(function (global) {
  'use strict';

  const core = global.WalkatlasCatalogCore;
  const italian = global.WalkatlasCatalogIt;
  const media = global.WalkatlasCatalogMedia;
  if (!core || !italian || !Array.isArray(media)) {
    throw new Error('Catalogo WALKATLAS incompleto: controllare l’ordine degli script dati.');
  }

  const locales = new Map([['it', italian]]);
  const placesById = new Map(core.places.map(place => [place.id, place]));
  const placesByScopedSlug = new Map(core.places.map(place => [`${place.countryId}:${place.slug}`, place]));
  const placesBySlug = new Map();
  for (const place of core.places) {
    placesBySlug.set(place.slug, placesBySlug.has(place.slug) ? null : place);
  }
  const legacyIds = new Map(Object.entries(core.legacyIdMap || {}));
  const adminAreas = new Map(core.adminAreas.map(item => [item.id, item]));
  const localities = new Map(core.localities.map(item => [item.id, item]));
  const erasById = new Map(core.taxonomy.eras.map(item => [item.id, item]));
  const mediaByPlace = new Map();
  const mediaRoleOrder = { cover: 0, gallery: 1, plan: 2, logo: 3 };

  for (const item of media) {
    const list = mediaByPlace.get(item.placeId) || [];
    list.push(item);
    mediaByPlace.set(item.placeId, list);
  }
  for (const list of mediaByPlace.values()) list.sort((a, b) =>
    (mediaRoleOrder[a.role] ?? 99) - (mediaRoleOrder[b.role] ?? 99)
    || a.sortOrder - b.sortOrder
    || String(a.id).localeCompare(String(b.id))
  );

  function canonicalLocale(locale) {
    return String(locale || '').trim().toLowerCase().replace(/_/g, '-');
  }

  function localeKey(locale) {
    const value = canonicalLocale(locale || 'it');
    const base = value.split('-')[0];
    return locales.has(value) ? value : locales.has(base) ? base : 'it';
  }

  function localeData(locale) {
    return locales.get(localeKey(locale)) || italian;
  }

  function resolvePlaceId(reference) {
    if (reference === undefined || reference === null || reference === '') return null;
    if (typeof reference === 'object') {
      if (reference.id) return resolvePlaceId(reference.id);
      if (reference.countryId && reference.slug) return resolvePlaceId(`${reference.countryId}:${reference.slug}`);
      return null;
    }
    const value = String(reference);
    if (placesById.has(value)) return value;
    if (legacyIds.has(value)) return legacyIds.get(value);
    const scoped = value.match(/^([A-Za-z]{2})[:/](.+)$/);
    if (scoped) return placesByScopedSlug.get(`${scoped[1].toUpperCase()}:${scoped[2]}`)?.id || null;
    const bySlug = placesBySlug.get(value);
    if (bySlug) return bySlug.id;
    return null;
  }

  function localizedLabel(section, id, locale) {
    const selected = localeData(locale);
    return selected[section]?.[id] ?? italian[section]?.[id] ?? id;
  }

  function mergeLocalizedRecord(fallback, selected) {
    if (!fallback && !selected) return null;
    const merged = { ...(fallback || {}) };
    for (const [key, value] of Object.entries(selected || {})) {
      if (value !== undefined && value !== null) merged[key] = value;
    }
    return merged;
  }

  function placeTranslation(id, locale) {
    const selected = localeData(locale);
    return mergeLocalizedRecord(italian.places[id], selected.places?.[id]);
  }

  function materialize(placeOrId, locale = 'it') {
    const place = placeOrId && typeof placeOrId === 'object'
      ? placeOrId
      : placesById.get(resolvePlaceId(placeOrId));
    if (!place) return null;
    const text = placeTranslation(place.id, locale);
    if (!text) return null;
    const placeMedia = (mediaByPlace.get(place.id) || []).map(item => ({ ...item, altText: item.alt?.[localeKey(locale)] || item.alt?.it || text.name }));
    const typeLegacy = place.typeId === 'site' ? 'siti' : place.typeId === 'museum' ? 'musei' : 'evento';
    return {
      id: place.id,
      legacyId: place.legacyId,
      slug: place.slug,
      countryId: place.countryId,
      country: localizedLabel('countries', place.countryId, locale),
      adminAreaId: place.adminAreaId,
      region: localizedLabel('adminAreas', place.adminAreaId, locale),
      localityId: place.localityId,
      city: localizedLabel('localities', place.localityId, locale),
      typeId: place.typeId,
      type: typeLegacy,
      familyId: place.familyId,
      familyLabel: localizedLabel('families', place.familyId, locale),
      kindId: place.kindId,
      kindLabel: localizedLabel('kinds', place.kindId, locale),
      museumCategoryId: place.museumCategoryId,
      cat: place.legacyCategoryId,
      era: place.primaryEraId,
      eraIds: [...place.eraIds],
      lat: place.latitude,
      lon: place.longitude,
      minutes: place.visitMinutes,
      closedDay: place.closedWeekdays.length ? place.closedWeekdays[0] % 7 : null,
      closedWeekdays: [...place.closedWeekdays],
      officialUrl: place.officialUrl,
      ticket: place.ticketUrl,
      hasPlan: place.hasFloorPlan,
      status: place.status,
      name: text.name,
      desc: text.shortDescription,
      context: text.context,
      focus: Array.isArray(text.visitFocus) ? [...text.visitFocus] : [],
      period: text.periodLabel,
      time: text.visitLabel,
      hoursText: text.hoursText,
      media: placeMedia,
      photos: placeMedia
        .filter(item => item.verificationStatus === 'verified' && (item.role === 'cover' || item.role === 'gallery'))
        .map(item => item.localPath)
        .filter(Boolean),
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

  function filterValues(value) {
    if (value === undefined || value === null || value === '') return null;
    const values = (Array.isArray(value) ? value : String(value).split(','))
      .map(item => String(item).trim())
      .filter(Boolean);
    return values.length ? new Set(values) : null;
  }

  function matchesValue(value, requested) {
    return !requested || requested.has(String(value));
  }

  function listPlaces(options = {}) {
    const locale = options.locale || 'it';
    const requestedIds = filterValues(options.ids);
    const countries = filterValues(options.countryId);
    const adminAreaIds = filterValues(options.adminAreaId);
    const localityIds = filterValues(options.localityId);
    const typeIds = filterValues(options.typeId);
    const familyIds = filterValues(options.familyId);
    const kindIds = filterValues(options.kindId);
    const eraIds = filterValues(options.eraId);
    const museumCategoryIds = filterValues(options.museumCategoryId);
    const search = String(options.search || '').trim().toLocaleLowerCase(localeKey(locale));
    return core.places
      .filter(place => !options.status || place.status === options.status)
      .filter(place => matchesValue(place.id, requestedIds))
      .filter(place => matchesValue(place.countryId, countries))
      .filter(place => matchesValue(place.adminAreaId, adminAreaIds))
      .filter(place => matchesValue(place.localityId, localityIds))
      .filter(place => matchesValue(place.typeId, typeIds))
      .filter(place => matchesValue(place.familyId, familyIds))
      .filter(place => matchesValue(place.kindId, kindIds))
      .filter(place => !eraIds || place.eraIds.some(eraId => eraIds.has(eraId)))
      .filter(place => matchesValue(place.museumCategoryId, museumCategoryIds))
      .filter(place => {
        if (!Array.isArray(options.bbox) || options.bbox.length !== 4) return true;
        const [west, south, east, north] = options.bbox.map(Number);
        if (![west, south, east, north].every(Number.isFinite) || south > north) return false;
        const longitudeMatches = west <= east
          ? place.longitude >= west && place.longitude <= east
          : place.longitude >= west || place.longitude <= east;
        return longitudeMatches && place.latitude >= south && place.latitude <= north;
      })
      .map(place => materialize(place, locale))
      .filter(place => !search || [place.name, place.city, place.region, place.country, place.period, place.familyLabel, place.kindLabel]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase(localeKey(locale))
        .includes(search));
  }

  function queryPlaces(options = {}) {
    const all = listPlaces(options);
    const requested = Number(options.limit || 100);
    const limit = Math.max(1, Math.min(Number.isFinite(requested) ? requested : 100, 500));
    const offset = Math.max(0, Number(options.cursor || 0) || 0);
    const items = all.slice(offset, offset + limit);
    return { items, total: all.length, nextCursor: offset + limit < all.length ? String(offset + limit) : null };
  }

  function listEras(locale = 'it') {
    const all = core.uiDefaults.allEras;
    const selected = localeData(locale);
    const rows = [[all.id, selected.ui?.allErasLabel || italian.ui.allErasLabel, selected.ui?.allErasChronology || italian.ui.allErasChronology]];
    for (const era of [...core.taxonomy.eras].sort((a, b) => a.sortOrder - b.sortOrder)) {
      const text = mergeLocalizedRecord(italian.eras[era.id], selected.eras?.[era.id]);
      rows.push([era.id, text.label, text.chronology]);
    }
    return rows;
  }

  function eraColors() {
    return Object.fromEntries([
      [core.uiDefaults.allEras.id, core.uiDefaults.allEras.color],
      ...core.taxonomy.eras.map(era => [era.id, era.color])
    ]);
  }

  function eraIcons() {
    return Object.fromEntries([
      [core.uiDefaults.allEras.id, core.uiDefaults.allEras.iconSvg],
      ...core.taxonomy.eras.map(era => [era.id, era.iconSvg])
    ]);
  }

  function eraReadings(locale = 'it') {
    const selected = localeData(locale);
    return Object.fromEntries(core.taxonomy.eras.map(era => [era.id, mergeLocalizedRecord(italian.eras[era.id], selected.eras?.[era.id])?.reading || '']));
  }

  function getTaxonomies(locale = 'it') {
    const label = (section, id) => localizedLabel(section, id, locale);
    return {
      version: core.catalogVersion,
      types: core.taxonomy.types.map(item => ({ ...item, label: label('types', item.id) })),
      families: core.taxonomy.families.map(item => ({ ...item, label: label('families', item.id) })),
      kinds: core.taxonomy.kinds.map(item => ({ ...item, label: label('kinds', item.id) })),
      museumCategories: core.taxonomy.museumCategories.map(item => ({ ...item, label: label('museumCategories', item.id) })),
      eras: core.taxonomy.eras.map(item => ({ ...item, ...mergeLocalizedRecord(italian.eras[item.id], localeData(locale).eras?.[item.id]) })),
      countries: core.countries.map(item => ({ ...item, label: label('countries', item.id) }))
    };
  }

  function registerLocale(locale, payload) {
    const key = canonicalLocale(locale);
    if (!key || !payload || typeof payload !== 'object') throw new Error('Traduzione non valida.');
    locales.set(key, payload);
  }

  function validateCatalog() {
    const errors = [];
    const ids = new Set();
    const slugs = new Set();
    for (const place of core.places) {
      if (ids.has(place.id)) errors.push(`ID duplicato: ${place.id}`);
      if (slugs.has(`${place.countryId}:${place.slug}`)) errors.push(`Slug duplicato: ${place.slug}`);
      ids.add(place.id);
      slugs.add(`${place.countryId}:${place.slug}`);
      if (!adminAreas.has(place.adminAreaId)) errors.push(`Regione mancante: ${place.adminAreaId}`);
      if (!localities.has(place.localityId)) errors.push(`Località mancante: ${place.localityId}`);
      if (!erasById.has(place.primaryEraId)) errors.push(`Epoca mancante: ${place.primaryEraId}`);
      if (!italian.places[place.id]) errors.push(`Testo italiano mancante: ${place.id}`);
      if (!Number.isFinite(place.latitude) || place.latitude < -90 || place.latitude > 90) errors.push(`Latitudine non valida: ${place.id}`);
      if (!Number.isFinite(place.longitude) || place.longitude < -180 || place.longitude > 180) errors.push(`Longitudine non valida: ${place.id}`);
    }
    for (const item of media) if (!placesById.has(item.placeId)) errors.push(`Media senza luogo: ${item.id}`);
    return { valid: errors.length === 0, errors, counts: { places: core.places.length, media: media.length, locales: locales.size } };
  }

  function bootstrap(locale = 'it') {
    return {
      data: listPlaces({ locale, status: 'published' }),
      eras: listEras(locale),
      eraColori: eraColors(),
      eraIcons: eraIcons(),
      letturaEpoca: eraReadings(locale)
    };
  }

  global.WalkatlasRepository = Object.freeze({
    schemaVersion: core.schemaVersion,
    catalogVersion: core.catalogVersion,
    placeReferenceVersion: core.placeReferenceVersion,
    bootstrap,
    listPlaces,
    queryPlaces,
    getPlaceById: materialize,
    resolvePlaceId,
    listEras,
    eraColors,
    eraIcons,
    eraReadings,
    getTaxonomies,
    registerLocale,
    validateCatalog
  });
  global.PalinsestoRepository = global.WalkatlasRepository;
})(window);
