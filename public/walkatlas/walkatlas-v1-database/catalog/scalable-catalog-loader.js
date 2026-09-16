(function (global) {
  'use strict';

  const currentScriptUrl = global.document?.currentScript?.src || null;
  const defaultManifestUrl = currentScriptUrl
    ? new URL('../static-catalog/manifest.json', currentScriptUrl).href
    : '../static-catalog/manifest.json';

  class CatalogRuntimeError extends Error {
    constructor(code, message, cause) {
      super(message, cause ? { cause } : undefined);
      this.name = 'CatalogRuntimeError';
      this.code = code;
    }
  }

  function canonicalLocale(locale) {
    return String(locale || 'it').trim().toLowerCase().replace(/_/g, '-');
  }

  function normalizeSearchText(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('it')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function values(value) {
    if (value === undefined || value === null || value === '') return [];
    return [...new Set((Array.isArray(value) ? value : String(value).split(','))
      .map(item => String(item).trim())
      .filter(Boolean))];
  }

  function normalizedTypes(value) {
    const aliases = { siti: 'site', musei: 'museum', evento: 'event' };
    return values(value).map(item => aliases[item] || item).filter(item => item !== 'tutti');
  }

  function normalizedEras(value) {
    return values(value).filter(item => item !== 'tutte');
  }

  function parseBbox(value) {
    if (value === undefined || value === null || value === '') return null;
    const bbox = (Array.isArray(value) ? value : String(value).split(',')).map(Number);
    if (bbox.length !== 4 || !bbox.every(Number.isFinite)) {
      throw new CatalogRuntimeError('invalid_bbox', 'bbox deve contenere ovest, sud, est e nord.');
    }
    const [west, south, east, north] = bbox;
    if (west < -180 || west > 180 || east < -180 || east > 180 || south < -90 || north > 90 || south > north) {
      throw new CatalogRuntimeError('invalid_bbox', 'bbox contiene coordinate o ordine non validi.');
    }
    return bbox;
  }

  function longitudeRanges(bbox) {
    return bbox[0] <= bbox[2] ? [[bbox[0], bbox[2]]] : [[bbox[0], 180], [-180, bbox[2]]];
  }

  function bboxesIntersect(first, second) {
    if (!first || !second || first[1] > second[3] || first[3] < second[1]) return false;
    return longitudeRanges(first).some(a => longitudeRanges(second).some(b => a[0] <= b[1] && a[1] >= b[0]));
  }

  function pointInBbox(longitude, latitude, bbox) {
    if (!bbox) return true;
    const longitudeMatches = bbox[0] <= bbox[2]
      ? longitude >= bbox[0] && longitude <= bbox[2]
      : longitude >= bbox[0] || longitude <= bbox[2];
    return longitudeMatches && latitude >= bbox[1] && latitude <= bbox[3];
  }

  function intersects(valuesA, valuesB) {
    return !valuesB.length || valuesA.some(value => valuesB.includes(String(value)));
  }

  function hashString(value) {
    let first = 2166136261;
    let second = 2246822519;
    for (let index = 0; index < value.length; index += 1) {
      const code = value.charCodeAt(index);
      first = Math.imul(first ^ code, 16777619);
      second = Math.imul(second ^ code, 3266489917);
    }
    return `${(first >>> 0).toString(16).padStart(8, '0')}${(second >>> 0).toString(16).padStart(8, '0')}`;
  }

  function cursorFor(fingerprint, offset) {
    return `sc1.${hashString(fingerprint)}.${Number(offset).toString(36)}`;
  }

  function offsetFromCursor(cursor, fingerprint) {
    if (cursor === undefined || cursor === null || cursor === '') return 0;
    if (/^\d+$/.test(String(cursor))) return Math.max(0, Number(cursor));
    const match = String(cursor).match(/^sc1\.([0-9a-f]{16})\.([0-9a-z]+)$/);
    if (!match || match[1] !== hashString(fingerprint)) {
      throw new CatalogRuntimeError('invalid_cursor', 'Il cursore non appartiene ai filtri correnti.');
    }
    const offset = parseInt(match[2], 36);
    if (!Number.isSafeInteger(offset) || offset < 0) throw new CatalogRuntimeError('invalid_cursor', 'Cursore non valido.');
    return offset;
  }

  function resolveUrl(reference, base) {
    try {
      return new URL(reference, base || global.document?.baseURI || global.location?.href).href;
    } catch {
      return reference;
    }
  }

  function localeConfiguration(manifest, requested) {
    const available = manifest.availableLocales || Object.keys(manifest.locales || {});
    const canonical = canonicalLocale(requested || manifest.defaultLocale);
    const base = canonical.split('-')[0];
    const exact = available.find(locale => canonicalLocale(locale) === canonical);
    const byBase = available.find(locale => canonicalLocale(locale).split('-')[0] === base);
    const key = exact || byBase || manifest.defaultLocale || available[0];
    return { key, config: manifest.locales?.[key] };
  }

  function queryShape(options, manifest) {
    const locale = localeConfiguration(manifest, options.locale).key;
    const normalized = {
      locale,
      ids: values(options.ids).sort(),
      countryIds: values(options.countryId ?? options.country).map(item => item.toUpperCase()).sort(),
      adminAreaIds: values(options.adminAreaId ?? options.adminArea).sort(),
      localityIds: values(options.localityId ?? options.locality).sort(),
      typeIds: normalizedTypes(options.typeId ?? options.type).sort(),
      familyIds: values(options.familyId ?? options.family).sort(),
      kindIds: values(options.kindId ?? options.kind).sort(),
      eraIds: normalizedEras(options.eraId ?? options.era).sort(),
      museumCategoryIds: values(options.museumCategoryId ?? options.museumCategory).sort(),
      bbox: parseBbox(options.bbox),
      search: normalizeSearchText(options.search),
      status: options.status || 'published',
      order: options.order || 'name'
    };
    return normalized;
  }

  function queryFingerprint(query, catalogVersion) {
    return JSON.stringify({ catalogVersion, ...query });
  }

  class CatalogRuntime {
    constructor(options = {}) {
      this.options = options;
      this.manifestUrl = resolveUrl(options.manifestUrl || defaultManifestUrl);
      this.locationProtocol = options.locationProtocol || global.location?.protocol || '';
      this.fetchFn = options.fetch || (typeof global.fetch === 'function' ? global.fetch.bind(global) : null);
      this.legacyRepository = options.repository || global.WalkatlasRepository || null;
      this.allowLegacyFallback = options.allowLegacyFallback !== false;
      this.requestedMode = options.mode || 'auto';
      this.maxPageSize = Math.max(1, Number(options.maxPageSize) || 500);
      this.mode = 'uninitialized';
      this.manifest = null;
      this.fallbackReason = null;
      this._initPromise = null;
      this._jsonCache = new Map();
      this._taxonomyCache = new Map();
      this._indexCache = new Map();
      this._referenceCache = new Map();
    }

    async init() {
      if (this.mode !== 'uninitialized') return this.info();
      if (this._initPromise) return this._initPromise;
      this._initPromise = this._initialize();
      try {
        return await this._initPromise;
      } catch (error) {
        this._initPromise = null;
        throw error;
      }
    }

    async _initialize() {
      if (this.requestedMode === 'legacy' || (this.locationProtocol === 'file:' && this.requestedMode !== 'static')) {
        return this._activateLegacy(this.locationProtocol === 'file:' ? 'file_protocol' : 'requested');
      }
      if (!this.fetchFn) {
        if (this.allowLegacyFallback) return this._activateLegacy('fetch_unavailable');
        throw new CatalogRuntimeError('fetch_unavailable', 'Il caricamento del catalogo statico richiede fetch.');
      }
      try {
        const manifest = await this._loadJson(this.manifestUrl, { cache: 'no-cache' });
        if (!manifest || !Array.isArray(manifest.shards) || !manifest.locales || !manifest.defaultLocale) {
          throw new CatalogRuntimeError('invalid_manifest', 'Manifest del catalogo statico non valido.');
        }
        this.manifest = manifest;
        this.mode = 'static';
        return this.info();
      } catch (error) {
        if (this.allowLegacyFallback && this.legacyRepository && this.requestedMode !== 'static') {
          return this._activateLegacy(error.code || 'manifest_unavailable', error);
        }
        if (error instanceof CatalogRuntimeError) throw error;
        throw new CatalogRuntimeError('manifest_unavailable', 'Manifest del catalogo statico non disponibile.', error);
      }
    }

    _activateLegacy(reason, cause) {
      if (!this.legacyRepository) {
        throw new CatalogRuntimeError('legacy_catalog_unavailable', 'Il catalogo locale del prototipo non è stato caricato.', cause);
      }
      this.mode = 'legacy';
      this.fallbackReason = reason;
      return this.info();
    }

    info() {
      return {
        mode: this.mode,
        catalogVersion: this.mode === 'static' ? this.manifest?.catalogVersion : this.legacyRepository?.catalogVersion,
        schemaVersion: this.mode === 'static' ? this.manifest?.schemaVersion : this.legacyRepository?.schemaVersion,
        fallbackReason: this.fallbackReason,
        manifestUrl: this.mode === 'static' ? this.manifestUrl : null
      };
    }

    get schemaVersion() {
      return this.mode === 'static' ? this.manifest?.schemaVersion : this.legacyRepository?.schemaVersion;
    }

    get catalogVersion() {
      return this.mode === 'static' ? this.manifest?.catalogVersion : this.legacyRepository?.catalogVersion;
    }

    get placeReferenceVersion() {
      return this.mode === 'static' ? this.manifest?.placeReferenceVersion : this.legacyRepository?.placeReferenceVersion;
    }

    async _loadJson(url, fetchOptions = {}) {
      const absoluteUrl = resolveUrl(url, this.manifestUrl);
      if (this._jsonCache.has(absoluteUrl)) return this._jsonCache.get(absoluteUrl);
      const pending = (async () => {
        const response = await this.fetchFn(absoluteUrl, { headers: { Accept: 'application/json' }, ...fetchOptions });
        if (!response || !response.ok) {
          throw new CatalogRuntimeError('catalog_fetch_failed', `Impossibile caricare ${absoluteUrl} (${response?.status || 'rete'}).`);
        }
        return response.json();
      })();
      this._jsonCache.set(absoluteUrl, pending);
      try {
        return await pending;
      } catch (error) {
        this._jsonCache.delete(absoluteUrl);
        throw error;
      }
    }

    _relativeUrl(pathValue) {
      return resolveUrl(pathValue, this.manifestUrl);
    }

    async _taxonomies(locale) {
      await this.init();
      if (this.mode === 'legacy') return null;
      const selected = localeConfiguration(this.manifest, locale);
      if (!selected.config?.taxonomies) throw new CatalogRuntimeError('locale_unavailable', `Tassonomie non disponibili per ${selected.key}.`);
      if (!this._taxonomyCache.has(selected.key)) {
        const pending = this._loadJson(this._relativeUrl(selected.config.taxonomies));
        this._taxonomyCache.set(selected.key, pending);
        pending.catch(() => this._taxonomyCache.delete(selected.key));
      }
      return this._taxonomyCache.get(selected.key);
    }

    async _searchIndex(locale) {
      await this.init();
      const selected = localeConfiguration(this.manifest, locale);
      if (!selected.config?.searchIndex) throw new CatalogRuntimeError('search_index_unavailable', `Indice di ricerca non disponibile per ${selected.key}.`);
      if (!this._indexCache.has(selected.key)) {
        const pending = this._loadJson(this._relativeUrl(selected.config.searchIndex));
        this._indexCache.set(selected.key, pending);
        pending.catch(() => {
          this._indexCache.delete(selected.key);
          this._referenceCache.delete(selected.key);
        });
      }
      return this._indexCache.get(selected.key);
    }

    async _referenceMaps(locale) {
      const selected = localeConfiguration(this.manifest, locale);
      if (this._referenceCache.has(selected.key)) return this._referenceCache.get(selected.key);
      const index = await this._searchIndex(selected.key);
      const byId = new Map();
      const byLegacyId = new Map();
      const byScopedSlug = new Map();
      const bySlug = new Map();
      for (const entry of index.entries || []) {
        byId.set(String(entry.id), entry);
        if (entry.legacyId !== undefined && entry.legacyId !== null) byLegacyId.set(String(entry.legacyId), entry);
        byScopedSlug.set(`${String(entry.countryId).toUpperCase()}:${entry.slug}`, entry);
        bySlug.set(entry.slug, bySlug.has(entry.slug) ? null : entry);
      }
      const maps = { byId, byLegacyId, byScopedSlug, bySlug, entries: index.entries || [] };
      this._referenceCache.set(selected.key, maps);
      return maps;
    }

    async prepareReferences(locale = 'it') {
      await this.init();
      if (this.mode === 'legacy') return { count: this.legacyRepository.bootstrap(locale).data.length, mode: 'legacy' };
      const maps = await this._referenceMaps(locale);
      return { count: maps.byId.size, mode: 'static' };
    }

    resolvePlaceIdSync(reference, locale = 'it') {
      if (this.mode === 'legacy') return this.legacyRepository.resolvePlaceId(reference);
      if (this.mode !== 'static') throw new CatalogRuntimeError('catalog_not_ready', 'Inizializzare il catalogo prima di risolvere i riferimenti.');
      if (reference === undefined || reference === null || reference === '') return null;
      if (typeof reference === 'object') {
        if (reference.id) return this.resolvePlaceIdSync(reference.id, locale);
        if (reference.countryId && reference.slug) return this.resolvePlaceIdSync(`${reference.countryId}:${reference.slug}`, locale);
        return null;
      }
      const selected = localeConfiguration(this.manifest, locale);
      const maps = this._referenceCache.get(selected.key);
      if (!maps) throw new CatalogRuntimeError('references_not_ready', 'Chiamare prepareReferences() prima del resolver sincrono.');
      const value = String(reference);
      if (maps.byId.has(value)) return maps.byId.get(value).id;
      if (maps.byLegacyId.has(value)) return maps.byLegacyId.get(value).id;
      const scoped = value.match(/^([A-Za-z]{2})[:/](.+)$/);
      if (scoped) return maps.byScopedSlug.get(`${scoped[1].toUpperCase()}:${scoped[2]}`)?.id || null;
      return maps.bySlug.get(value)?.id || null;
    }

    async resolvePlaceId(reference, locale = 'it') {
      await this.init();
      if (this.mode === 'legacy') return this.legacyRepository.resolvePlaceId(reference);
      await this._referenceMaps(locale);
      return this.resolvePlaceIdSync(reference, locale);
    }

    async _candidateEntries(query) {
      if (!query.search && !query.ids.length) return null;
      const maps = await this._referenceMaps(query.locale);
      let entries = maps.entries;
      if (query.ids.length) {
        const requested = new Set();
        for (const reference of query.ids) {
          const id = await this.resolvePlaceId(reference, query.locale);
          if (id) requested.add(id);
        }
        entries = entries.filter(entry => requested.has(entry.id));
      }
      if (query.search) {
        const tokens = query.search.split(' ').filter(Boolean);
        entries = entries.filter(entry => tokens.every(token => String(entry.text || '').includes(token)));
      }
      return entries;
    }

    _selectShards(query, candidateEntries) {
      const candidateShardIds = candidateEntries ? new Set(candidateEntries.map(entry => entry.shardId)) : null;
      return this.manifest.shards.filter(shard => {
        if (candidateShardIds && !candidateShardIds.has(shard.id)) return false;
        if (!intersects((shard.countryIds || []).map(String), query.countryIds)) return false;
        if (!intersects((shard.adminAreaIds || []).map(String), query.adminAreaIds)) return false;
        if (query.typeIds.length && !query.typeIds.some(id => Number(shard.typeCounts?.[id] || 0) > 0)) return false;
        if (query.eraIds.length && !query.eraIds.some(id => Number(shard.eraCounts?.[id] || 0) > 0)) return false;
        if (query.bbox && !bboxesIntersect(shard.bbox, query.bbox)) return false;
        return true;
      });
    }

    async _loadShard(descriptor, locale) {
      const selected = localeConfiguration(this.manifest, locale);
      const pathValue = descriptor.paths?.[selected.key] || descriptor.paths?.[this.manifest.defaultLocale];
      if (!pathValue) throw new CatalogRuntimeError('shard_locale_unavailable', `Shard ${descriptor.id} non disponibile per ${selected.key}.`);
      const payload = await this._loadJson(this._relativeUrl(pathValue));
      if (!payload || !Array.isArray(payload.places)) throw new CatalogRuntimeError('invalid_shard', `Shard ${descriptor.id} non valido.`);
      if (payload.catalogVersion !== this.manifest.catalogVersion) throw new CatalogRuntimeError('catalog_version_mismatch', `Versione incoerente nello shard ${descriptor.id}.`);
      if (payload.schemaVersion !== this.manifest.schemaVersion) throw new CatalogRuntimeError('schema_version_mismatch', `Schema incoerente nello shard ${descriptor.id}.`);
      return payload.places;
    }

    _label(taxonomies, section, id) {
      return taxonomies.labels?.[section]?.[id] ?? id;
    }

    _materialize(place, translation, media, taxonomies, detailsLoaded) {
      const locale = taxonomies.locale || this.manifest?.defaultLocale || 'it';
      const placeMedia = (media || []).map(item => ({
        ...item,
        altText: item.alt?.[locale] || item.alt?.[this.manifest?.defaultLocale] || translation.name
      }));
      const typeLegacy = place.typeId === 'site' ? 'siti' : place.typeId === 'museum' ? 'musei' : 'evento';
      return {
        id: place.id,
        legacyId: place.legacyId,
        slug: place.slug,
        countryId: place.countryId,
        country: this._label(taxonomies, 'countries', place.countryId),
        adminAreaId: place.adminAreaId,
        region: this._label(taxonomies, 'adminAreas', place.adminAreaId),
        localityId: place.localityId,
        city: this._label(taxonomies, 'localities', place.localityId),
        typeId: place.typeId,
        type: typeLegacy,
        familyId: place.familyId,
        familyLabel: this._label(taxonomies, 'families', place.familyId),
        kindId: place.kindId,
        kindLabel: this._label(taxonomies, 'kinds', place.kindId),
        museumCategoryId: place.museumCategoryId,
        cat: place.legacyCategoryId,
        era: place.primaryEraId,
        eraIds: [...(place.eraIds || [])],
        lat: place.latitude,
        lon: place.longitude,
        minutes: place.visitMinutes,
        closedDay: place.closedWeekdays?.length ? place.closedWeekdays[0] % 7 : null,
        closedWeekdays: [...(place.closedWeekdays || [])],
        officialUrl: place.officialUrl || null,
        ticket: place.ticketUrl || null,
        hasPlan: Boolean(place.hasFloorPlan),
        status: place.status,
        name: translation.name,
        desc: translation.shortDescription || '',
        context: translation.context || '',
        focus: Array.isArray(translation.visitFocus) ? [...translation.visitFocus] : [],
        period: translation.periodLabel || '',
        time: translation.visitLabel || '',
        hoursText: translation.hoursText || '',
        media: placeMedia,
        photos: placeMedia
          .filter(item => item.verificationStatus === 'verified' && (item.role === 'cover' || item.role === 'gallery'))
          .map(item => item.localPath)
          .filter(Boolean),
        detailsLoaded: Boolean(detailsLoaded),
        aliases: [...(place.aliases || [])],
        isUnesco: Boolean(place.isUnesco),
        unescoRelation: place.unescoRelation || null,
        unescoPropertyName: place.unescoPropertyName || null,
        unescoReferenceUrl: place.unescoReferenceUrl || null,
        isTop10: Boolean(place.isTop10),
        top10Position: place.top10Position || null,
        needsReview: Boolean(place.needsReview)
      };
    }

    _materializeSummary(summary, taxonomies) {
      return this._materialize(summary, summary.text || {}, summary.cover ? [summary.cover] : [], taxonomies, false);
    }

    _matches(place, query, candidateIds) {
      if (query.status && place.status !== query.status) return false;
      if (candidateIds && !candidateIds.has(place.id)) return false;
      if (query.countryIds.length && !query.countryIds.includes(String(place.countryId))) return false;
      if (query.adminAreaIds.length && !query.adminAreaIds.includes(String(place.adminAreaId))) return false;
      if (query.localityIds.length && !query.localityIds.includes(String(place.localityId))) return false;
      if (query.typeIds.length && !query.typeIds.includes(String(place.typeId))) return false;
      if (query.familyIds.length && !query.familyIds.includes(String(place.familyId))) return false;
      if (query.kindIds.length && !query.kindIds.includes(String(place.kindId))) return false;
      if (query.eraIds.length && !(place.eraIds || []).some(id => query.eraIds.includes(String(id)))) return false;
      if (query.museumCategoryIds.length && !query.museumCategoryIds.includes(String(place.museumCategoryId))) return false;
      return pointInBbox(place.longitude, place.latitude, query.bbox);
    }

    async queryPlaces(options = {}) {
      await this.init();
      if (this.mode === 'legacy') {
        const result = this.legacyRepository.queryPlaces(options);
        return { ...result, page: { hasMore: Boolean(result.nextCursor), nextCursor: result.nextCursor }, mode: 'legacy' };
      }
      const query = queryShape(options, this.manifest);
      const candidateEntries = await this._candidateEntries(query);
      if (candidateEntries && candidateEntries.length === 0) {
        return { items: [], total: 0, nextCursor: null, page: { hasMore: false, nextCursor: null }, loadedShardIds: [], mode: 'static' };
      }
      const descriptors = this._selectShards(query, candidateEntries);
      const [taxonomies, shardRows] = await Promise.all([
        this._taxonomies(query.locale),
        Promise.all(descriptors.map(descriptor => this._loadShard(descriptor, query.locale)))
      ]);
      const candidateIds = candidateEntries ? new Set(candidateEntries.map(entry => entry.id)) : null;
      const uniqueRows = new Map();
      for (const place of shardRows.flat()) {
        if (!place?.id || uniqueRows.has(place.id)) continue;
        uniqueRows.set(place.id, place);
      }
      const all = [...uniqueRows.values()]
        .filter(place => this._matches(place, query, candidateIds))
        .map(place => this._materializeSummary(place, taxonomies));
      all.sort((a, b) => normalizeSearchText(a.name).localeCompare(normalizeSearchText(b.name), query.locale) || a.id.localeCompare(b.id));

      const requestedLimit = Number(options.limit || 100);
      const limit = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 100, this.maxPageSize));
      const fingerprint = queryFingerprint(query, this.manifest.catalogVersion);
      const offset = offsetFromCursor(options.cursor, fingerprint);
      const items = all.slice(offset, offset + limit);
      const nextCursor = offset + limit < all.length ? cursorFor(fingerprint, offset + limit) : null;
      return {
        items,
        total: all.length,
        nextCursor,
        page: { hasMore: Boolean(nextCursor), nextCursor },
        loadedShardIds: descriptors.map(descriptor => descriptor.id),
        mode: 'static'
      };
    }

    async getPlaceById(reference, locale = 'it') {
      await this.init();
      if (this.mode === 'legacy') return this.legacyRepository.getPlaceById(reference, locale);
      const id = await this.resolvePlaceId(reference, locale);
      if (!id) return null;
      const selected = localeConfiguration(this.manifest, locale);
      const template = selected.config?.detailTemplate || this.manifest.locales?.[this.manifest.defaultLocale]?.detailTemplate;
      if (!template) throw new CatalogRuntimeError('detail_template_unavailable', 'Percorso delle schede complete non configurato.');
      const detailPath = template
        .replace('{placeId}', encodeURIComponent(id))
        .replace('{locale}', encodeURIComponent(selected.key));
      const [payload, taxonomies] = await Promise.all([
        this._loadJson(this._relativeUrl(detailPath)),
        this._taxonomies(selected.key)
      ]);
      if (!payload?.place || payload.place.id !== id) throw new CatalogRuntimeError('invalid_detail', `Scheda completa non valida: ${id}.`);
      if (payload.catalogVersion !== this.manifest.catalogVersion) throw new CatalogRuntimeError('catalog_version_mismatch', `Versione incoerente nella scheda ${id}.`);
      if (payload.schemaVersion !== this.manifest.schemaVersion) throw new CatalogRuntimeError('schema_version_mismatch', `Schema incoerente nella scheda ${id}.`);
      const translation = payload.translations?.[selected.key]
        || payload.translations?.[this.manifest.defaultLocale]
        || Object.values(payload.translations || {})[0];
      if (!translation) throw new CatalogRuntimeError('detail_translation_unavailable', `Testo della scheda non disponibile: ${id}.`);
      return this._materialize(payload.place, translation, payload.media || [], taxonomies, true);
    }

    async getPlacesByIds(ids, locale = 'it') {
      const places = await Promise.all((ids || []).map(id => this.getPlaceById(id, locale)));
      return places.filter(Boolean);
    }

    async getPlaceSummariesByIds(ids, locale = 'it') {
      const references = Array.isArray(ids) ? ids : [];
      if (!references.length) return [];
      const collected = [];
      let cursor = null;
      do {
        const page = await this.queryPlaces({ ids: references, locale, limit: this.maxPageSize, cursor });
        collected.push(...page.items);
        cursor = page.nextCursor;
      } while (cursor);
      const byId = new Map(collected.map(place => [place.id, place]));
      const resolved = await Promise.all(references.map(reference => this.resolvePlaceId(reference, locale)));
      return resolved.map(id => byId.get(id)).filter(Boolean);
    }

    async listEras(locale = 'it') {
      await this.init();
      if (this.mode === 'legacy') return this.legacyRepository.listEras(locale);
      const taxonomies = await this._taxonomies(locale);
      const all = taxonomies.uiDefaults.allEras;
      const rows = [[all.id, taxonomies.labels.ui.allErasLabel, taxonomies.labels.ui.allErasChronology]];
      for (const era of [...taxonomies.taxonomy.eras].sort((a, b) => a.sortOrder - b.sortOrder)) {
        const text = taxonomies.labels.eras[era.id];
        rows.push([era.id, text.label, text.chronology]);
      }
      return rows;
    }

    async eraColors(locale = 'it') {
      await this.init();
      if (this.mode === 'legacy') return this.legacyRepository.eraColors(locale);
      const taxonomies = await this._taxonomies(locale);
      return Object.fromEntries([
        [taxonomies.uiDefaults.allEras.id, taxonomies.uiDefaults.allEras.color],
        ...taxonomies.taxonomy.eras.map(era => [era.id, era.color])
      ]);
    }

    async eraIcons(locale = 'it') {
      await this.init();
      if (this.mode === 'legacy') return this.legacyRepository.eraIcons(locale);
      const taxonomies = await this._taxonomies(locale);
      return Object.fromEntries([
        [taxonomies.uiDefaults.allEras.id, taxonomies.uiDefaults.allEras.iconSvg],
        ...taxonomies.taxonomy.eras.map(era => [era.id, era.iconSvg])
      ]);
    }

    async eraReadings(locale = 'it') {
      await this.init();
      if (this.mode === 'legacy') return this.legacyRepository.eraReadings(locale);
      const taxonomies = await this._taxonomies(locale);
      return Object.fromEntries(taxonomies.taxonomy.eras.map(era => [era.id, taxonomies.labels.eras[era.id]?.reading || '']));
    }

    async getTaxonomies(locale = 'it') {
      await this.init();
      if (this.mode === 'legacy') return this.legacyRepository.getTaxonomies(locale);
      const data = await this._taxonomies(locale);
      const label = (section, id) => data.labels?.[section]?.[id] ?? id;
      return {
        version: data.catalogVersion,
        types: data.taxonomy.types.map(item => ({ ...item, label: label('types', item.id) })),
        families: data.taxonomy.families.map(item => ({ ...item, label: label('families', item.id) })),
        kinds: data.taxonomy.kinds.map(item => ({ ...item, label: label('kinds', item.id) })),
        museumCategories: data.taxonomy.museumCategories.map(item => ({ ...item, label: label('museumCategories', item.id) })),
        eras: data.taxonomy.eras.map(item => ({ ...item, ...data.labels.eras[item.id] })),
        countries: data.countries.map(item => ({ ...item, label: label('countries', item.id) }))
      };
    }

    async bootstrap(localeOrOptions = 'it') {
      await this.init();
      const options = typeof localeOrOptions === 'string' ? { locale: localeOrOptions } : { ...(localeOrOptions || {}) };
      const locale = options.locale || 'it';
      if (this.mode === 'legacy') return this.legacyRepository.bootstrap(locale);
      const [places, eras, eraColori, icons, readings] = await Promise.all([
        this.queryPlaces({ ...options, limit: options.limit || this.maxPageSize }),
        this.listEras(locale),
        this.eraColors(locale),
        this.eraIcons(locale),
        this.eraReadings(locale)
      ]);
      return {
        data: places.items,
        eras,
        eraColori,
        eraIcons: icons,
        letturaEpoca: readings,
        page: places.page,
        total: places.total,
        catalogMode: 'static'
      };
    }

    clearCache() {
      this._jsonCache.clear();
      this._taxonomyCache.clear();
      this._indexCache.clear();
      this._referenceCache.clear();
    }
  }

  global.WalkatlasCatalogLoader = Object.freeze({
    contractVersion: '1.0.0',
    defaultManifestUrl,
    CatalogRuntimeError,
    normalizeSearchText,
    create(options) {
      return new CatalogRuntime(options);
    }
  });
  global.PalinsestoCatalogLoader = global.WalkatlasCatalogLoader;
})(window);
