/* WALKATLAS 1.2 — adapter locale sincrono del contratto /api/v1.
   Il futuro adapter HTTP manterrà i payload, usando però chiamate asincrone. */
(function (global) {
  'use strict';

  const STORE_VERSION = 1;
  /* Namespace tecnico storico: resta stabile per rendere i dati v1.3 immediatamente leggibili. */
  const PREFIX = 'palinsesto_v12_';
  const HEATMAP_K = 5;
  const TRANSITION_WINDOW_MS = 48 * 60 * 60 * 1000;
  const MAX_NOTE = 280;
  const MAX_ROUTE_TITLE = 80;
  const MAX_ROUTE_DESC = 600;
  const MAX_STOPS = 40;

  const FEATURE_FLAGS = Object.freeze({
    visits: true,
    timeline: true,
    yearSummary: true,
    yearSummaryExtended: true,
    userRoutes: true,
    heatmap: true,
    heatmapDemoBanner: true,
    diary: true,
    activities: true
  });

  const PLAN_ENTITLEMENTS = Object.freeze({
    free: ['visits', 'timeline', 'yearSummary', 'userRoutes', 'heatmap', 'diary', 'activities'],
    plus: ['visits', 'timeline', 'yearSummary', 'yearSummaryExtended', 'userRoutes', 'heatmap', 'diary', 'activities']
  });

  function nowIso() { return new Date().toISOString(); }
  function newId(prefix) {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') return global.crypto.randomUUID();
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
  function sanitize(value, max) {
    return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
  }
  function storage() {
    return {
      get(key, fallback) {
        try {
          const raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : fallback;
        } catch (error) { return fallback; }
      },
      set(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (error) { return false; }
      }
    };
  }
  const db = storage();

  function actorId() {
    const user = global.WalkatlasAuth && WalkatlasAuth.currentUser && WalkatlasAuth.currentUser();
    return user && user.id ? String(user.id) : 'guest-local';
  }
  function isGuest() { return actorId() === 'guest-local'; }

  function storeKey(kind, userId) { return `${PREFIX}${kind}_v${STORE_VERSION}_${userId || actorId()}`; }

  function readList(kind, userId) {
    const raw = db.get(storeKey(kind, userId), []);
    return Array.isArray(raw) ? raw.filter(item => item && typeof item === 'object') : [];
  }
  function writeList(kind, list, userId) { return db.set(storeKey(kind, userId), list); }

  function readAllLists(kind) {
    const rows = [];
    const keyPrefix = `${PREFIX}${kind}_v${STORE_VERSION}_`;
    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key || !key.startsWith(keyPrefix)) continue;
        const list = db.get(key, []);
        if (Array.isArray(list)) rows.push(...list);
      }
    } catch (error) { /* Il profilo corrente resta comunque disponibile. */ }
    return rows;
  }

  function ok(data) { return { ok: true, status: 200, data }; }
  function created(data) { return { ok: true, status: 201, data }; }
  function fail(status, code, message) { return { ok: false, status, error: { code, message } }; }
  function storageFailure() { return fail(507, 'storage_unavailable', 'Spazio locale non disponibile: il dato non è stato salvato. Libera spazio nel browser e riprova.'); }

  function requireUser(forWrite) {
    if (forWrite && isGuest()) {
      return fail(401, 'unauthenticated', 'Accedi o registrati per conservare questo dato sul profilo. In locale resta un profilo ospite, non sincronizzato.');
    }
    return null;
  }

  /* ---------- Visits ---------- */
  function normalizeVisit(item) {
    if (!item || typeof item !== 'object') return null;
    const visitedAt = Date.parse(item.visited_at);
    if (!Number.isFinite(visitedAt)) return null;
    const method = ['manual', 'gps', 'qr', 'ticket'].includes(item.verification_method) ? item.verification_method : 'manual';
    const status = ['self_reported', 'verified', 'rejected'].includes(item.verification_status) ? item.verification_status : 'self_reported';
    if (item.deleted_at) return null;
    return {
      id: String(item.id || newId('visit')),
      user_id: String(item.user_id || actorId()),
      place_id: String(item.place_id || ''),
      visited_at: new Date(visitedAt).toISOString(),
      verification_method: method,
      verification_status: status,
      note: sanitize(item.note, MAX_NOTE),
      verification_latitude: null,
      verification_longitude: null,
      verification_accuracy_m: null,
      source: item.source || 'manual_ui',
      idempotency_key: String(item.idempotency_key || ''),
      created_at: item.created_at || nowIso(),
      updated_at: item.updated_at || nowIso()
    };
  }

  function visitMinuteKey(userId, placeId, visitedAt) {
    const t = new Date(visitedAt);
    const stamp = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}T${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
    return `${userId}|${placeId}|${stamp}`;
  }

  const VisitRepository = {
    list(filters = {}) {
      const userId = actorId();
      let items = readList('visits', userId).map(normalizeVisit).filter(Boolean);
      if (filters.placeId) items = items.filter(v => v.place_id === String(filters.placeId));
      if (filters.year) items = items.filter(v => new Date(v.visited_at).getFullYear() === Number(filters.year));
      items.sort((a, b) => Date.parse(b.visited_at) - Date.parse(a.visited_at));
      return ok({ items, total: items.length, page: { hasMore: false } });
    },
    get(id) {
      const found = readList('visits').map(normalizeVisit).filter(Boolean).find(v => v.id === id);
      return found ? ok(found) : fail(404, 'not_found', 'Visita non trovata.');
    },
    create(input) {
      const userId = actorId();
      if (!input || !input.place_id) return fail(400, 'invalid', 'Luogo mancante.');
      const visitedAt = input.visited_at ? new Date(input.visited_at) : new Date();
      if (Number.isNaN(visitedAt.getTime())) return fail(400, 'invalid', 'Data non valida.');
      const suppliedKey = input.idempotency_key === undefined || input.idempotency_key === null || input.idempotency_key === ''
        ? null
        : String(input.idempotency_key);
      const idempotency = suppliedKey || visitMinuteKey(userId, input.place_id, visitedAt.toISOString());
      const list = readList('visits', userId).map(normalizeVisit).filter(Boolean);
      const duplicate = list.find(v => v.idempotency_key === idempotency);
      if (duplicate) return ok(duplicate);
      const visit = normalizeVisit({
        id: newId('visit'),
        user_id: userId,
        place_id: String(input.place_id),
        visited_at: visitedAt.toISOString(),
        verification_method: input.verification_method || 'manual',
        verification_status: 'self_reported',
        note: input.note,
        source: input.source || 'manual_ui',
        idempotency_key: idempotency,
        created_at: nowIso(),
        updated_at: nowIso()
      });
      if (!writeList('visits', [visit, ...list], userId)) return storageFailure();
      return created(visit);
    },
    update(id, patch) {
      const userId = actorId();
      const list = readList('visits', userId).map(normalizeVisit).filter(Boolean);
      const index = list.findIndex(v => v.id === id);
      if (index < 0) return fail(404, 'not_found', 'Visita non trovata.');
      if (patch.visited_at) {
        const d = new Date(patch.visited_at);
        if (Number.isNaN(d.getTime())) return fail(400, 'invalid', 'Data non valida.');
        const previousAutoKey = visitMinuteKey(userId, list[index].place_id, list[index].visited_at);
        const nextVisitedAt = d.toISOString();
        const nextKey = list[index].idempotency_key === previousAutoKey
          ? visitMinuteKey(userId, list[index].place_id, nextVisitedAt)
          : list[index].idempotency_key;
        if (list.some((visit, itemIndex) => itemIndex !== index && visit.idempotency_key === nextKey)) {
          return fail(409, 'duplicate', 'Esiste già una visita equivalente nel minuto scelto.');
        }
        list[index].visited_at = nextVisitedAt;
        list[index].idempotency_key = nextKey;
      }
      if (patch.note !== undefined) list[index].note = sanitize(patch.note, MAX_NOTE);
      list[index].updated_at = nowIso();
      if (!writeList('visits', list, userId)) return storageFailure();
      return ok(list[index]);
    },
    remove(id) {
      const userId = actorId();
      const list = readList('visits', userId).map(normalizeVisit).filter(Boolean);
      if (!list.some(v => v.id === id)) return fail(404, 'not_found', 'Visita non trovata.');
      if (!writeList('visits', list.filter(v => v.id !== id), userId)) return storageFailure();
      return ok({ id, deleted: true });
    },
    forPlace(placeId) {
      return this.list({ placeId }).data.items;
    },
    hasPlace(placeId) {
      return this.forPlace(placeId).length > 0;
    }
  };

  /* ---------- Routes (itinerari personali 1.2, distinti dal Diario) ---------- */
  function normalizeRoute(item) {
    if (!item || typeof item !== 'object') return null;
    const visibility = ['private', 'unlisted', 'public'].includes(item.visibility) ? item.visibility : 'private';
    const status = ['draft', 'published', 'archived'].includes(item.status) ? item.status : 'draft';
    const stops = Array.isArray(item.stops) ? item.stops.filter(s => s && s.place_id).map((s, i) => ({
      id: String(s.id || newId('stop')),
      place_id: String(s.place_id),
      position: Number.isFinite(Number(s.position)) ? Number(s.position) : i,
      note: sanitize(s.note, MAX_NOTE)
    })).sort((a, b) => a.position - b.position).slice(0, MAX_STOPS) : [];
    return {
      id: String(item.id || newId('route')),
      owner_user_id: String(item.owner_user_id || actorId()),
      title: sanitize(item.title, MAX_ROUTE_TITLE) || 'Itinerario',
      description: sanitize(item.description, MAX_ROUTE_DESC),
      visibility,
      status,
      theme: sanitize(item.theme, 40),
      estimated_duration_minutes: Number(item.estimated_duration_minutes) || null,
      share_token: item.share_token || newId('share').replace(/-/g, '').slice(0, 12),
      created_at: item.created_at || nowIso(),
      updated_at: item.updated_at || nowIso(),
      published_at: item.published_at || null,
      stops
    };
  }

  function canReadRoute(route) {
    if (!route) return false;
    if (route.owner_user_id === actorId()) return true;
    if (route.status !== 'published') return false;
    return route.visibility === 'public' || route.visibility === 'unlisted';
  }

  const RouteRepository = {
    listMine() {
      const items = readList('routes').map(normalizeRoute).filter(Boolean)
        .filter(r => r.owner_user_id === actorId())
        .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
      return ok({ items, total: items.length });
    },
    get(id) {
      const mine = readList('routes').map(normalizeRoute).filter(Boolean);
      const route = mine.find(r => r.id === id)
        || readAllLists('routes').map(normalizeRoute).filter(Boolean).find(r => r.id === id);
      if (!route || !canReadRoute(route)) return fail(404, 'not_found', 'Itinerario non trovato.');
      return ok(route);
    },
    createFromStops(input) {
      const userId = actorId();
      const title = sanitize(input && input.title, MAX_ROUTE_TITLE);
      if (!title) return fail(400, 'invalid', 'Il titolo è obbligatorio.');
      const placeIds = Array.isArray(input.place_ids) ? input.place_ids.filter(Boolean).slice(0, MAX_STOPS) : [];
      if (!placeIds.length) return fail(400, 'invalid', 'Servono almeno una tappa.');
      const route = normalizeRoute({
        id: newId('route'),
        owner_user_id: userId,
        title,
        description: input.description,
        visibility: input.visibility || 'private',
        status: input.status || 'draft',
        theme: input.theme,
        estimated_duration_minutes: input.estimated_duration_minutes,
        created_at: nowIso(),
        updated_at: nowIso(),
        published_at: input.status === 'published' ? nowIso() : null,
        stops: placeIds.map((place_id, position) => ({ place_id, position }))
      });
      if (!writeList('routes', [route, ...readList('routes').map(normalizeRoute).filter(Boolean)], userId)) return storageFailure();
      return created(route);
    },
    update(id, patch) {
      const userId = actorId();
      const list = readList('routes').map(normalizeRoute).filter(Boolean);
      const index = list.findIndex(r => r.id === id);
      if (index < 0) return fail(404, 'not_found', 'Itinerario non trovato.');
      if (list[index].owner_user_id !== userId) return fail(403, 'forbidden', 'Solo l’autore può modificarlo.');
      if (patch.title !== undefined) {
        const title = sanitize(patch.title, MAX_ROUTE_TITLE);
        if (!title) return fail(400, 'invalid', 'Il titolo è obbligatorio.');
        list[index].title = title;
      }
      if (patch.description !== undefined) list[index].description = sanitize(patch.description, MAX_ROUTE_DESC);
      if (patch.visibility && ['private', 'unlisted', 'public'].includes(patch.visibility)) list[index].visibility = patch.visibility;
      if (patch.status && ['draft', 'published', 'archived'].includes(patch.status)) {
        list[index].status = patch.status;
        if (patch.status === 'published') list[index].published_at = list[index].published_at || nowIso();
      }
      if (Array.isArray(patch.place_ids)) {
        list[index].stops = patch.place_ids.filter(Boolean).slice(0, MAX_STOPS).map((place_id, position) => ({ id: newId('stop'), place_id: String(place_id), position, note: '' }));
      }
      list[index].updated_at = nowIso();
      if (!writeList('routes', list, userId)) return storageFailure();
      return ok(list[index]);
    },
    duplicate(id) {
      const source = this.get(id);
      if (!source.ok) return source;
      return this.createFromStops({
        title: `${source.data.title} (copia)`,
        description: source.data.description,
        visibility: 'private',
        status: 'draft',
        place_ids: source.data.stops.map(s => s.place_id)
      });
    },
    remove(id) {
      const userId = actorId();
      const list = readList('routes').map(normalizeRoute).filter(Boolean);
      const route = list.find(r => r.id === id);
      if (!route) return fail(404, 'not_found', 'Itinerario non trovato.');
      if (route.owner_user_id !== userId) return fail(403, 'forbidden', 'Solo l’autore può eliminarlo.');
      if (!writeList('routes', list.filter(r => r.id !== id), userId)) return storageFailure();
      return ok({ id, deleted: true });
    },
    save(id) {
      const userId = actorId();
      const got = this.get(id);
      if (!got.ok) return got;
      const saves = readList('route_saves', userId);
      if (saves.some(s => s.route_id === id && s.user_id === userId)) return ok(saves.find(s => s.route_id === id));
      const row = { id: newId('rsave'), route_id: id, user_id: userId, created_at: nowIso() };
      if (!writeList('route_saves', [row, ...saves], userId)) return storageFailure();
      return created(row);
    },
    unsave(id) {
      const userId = actorId();
      if (!writeList('route_saves', readList('route_saves', userId).filter(s => s.route_id !== id), userId)) return storageFailure();
      return ok({ route_id: id, saved: false });
    },
    complete(id, source) {
      const userId = actorId();
      const got = this.get(id);
      if (!got.ok) return got;
      const day = new Date().toISOString().slice(0, 10);
      const idempotency = `${userId}|${id}|${day}`;
      const list = readList('route_completions', userId);
      const dup = list.find(c => c.idempotency_key === idempotency);
      if (dup) return ok(dup);
      const row = {
        id: newId('rcomp'),
        route_id: id,
        user_id: userId,
        completed_at: nowIso(),
        source: source || 'manual_ui',
        idempotency_key: idempotency,
        created_at: nowIso(),
        updated_at: nowIso()
      };
      if (!writeList('route_completions', [row, ...list], userId)) return storageFailure();
      return created(row);
    },
    completions(id) {
      return readList('route_completions').filter(c => c.route_id === id && c.user_id === actorId());
    }
  };

  /* ---------- Stats ---------- */
  function placeMeta(placeId) {
    const lookup = global.walkatlasLookupPlace;
    if (typeof lookup === 'function') {
      try { return lookup(placeId); } catch (error) { return null; }
    }
    return null;
  }

  const StatsService = {
    compute(year) {
      const visits = VisitRepository.list(year ? { year } : {}).data.items.filter(visit => visit.verification_status !== 'rejected');
      const unique = new Set(visits.map(v => v.place_id));
      const byMonth = Array.from({ length: 12 }, () => 0);
      const cats = {}, eras = {}, regions = {}, cities = {}, counts = {};
      visits.forEach(v => {
        byMonth[new Date(v.visited_at).getMonth()] += 1;
        counts[v.place_id] = (counts[v.place_id] || 0) + 1;
        const place = placeMeta(v.place_id);
        if (!place) return;
        const cat = place.type === 'musei' ? 'musei' : place.type === 'siti' ? 'siti' : 'altro';
        cats[cat] = (cats[cat] || 0) + 1;
        const era = place.era || 'tutte';
        eras[era] = (eras[era] || 0) + 1;
        if (place.region) regions[place.region] = (regions[place.region] || 0) + 1;
        if (place.city) cities[place.city] = (cities[place.city] || 0) + 1;
      });
      let busiestMonth = null, busiest = -1;
      byMonth.forEach((n, i) => { if (n > busiest) { busiest = n; busiestMonth = i; } });
      const mostVisitedId = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || null;
      const completions = readList('route_completions').filter(c => !year || new Date(c.completed_at).getFullYear() === Number(year));
      return {
        year: year || null,
        visite_totali: visits.length,
        luoghi_unici: unique.size,
        itinerari_completati: completions.length,
        per_mese: byMonth,
        mese_piu_attivo: visits.length ? busiestMonth : null,
        categorie: cats,
        epoche: eras,
        territori: regions,
        citta: cities,
        luogo_piu_visitato: mostVisitedId,
        include: 'visite manuali valide (self_reported). Escluse le cancellate.'
      };
    },
    compare(year) {
      const current = this.compute(year);
      const previous = this.compute(year - 1);
      const delta = (a, b) => a - b;
      const pct = (a, b) => (b === 0 ? null : Math.round(((a - b) / b) * 100));
      return {
        year,
        current,
        previous,
        hasPrevious: previous.visite_totali > 0,
        delta: {
          visite: delta(current.visite_totali, previous.visite_totali),
          luoghi: delta(current.luoghi_unici, previous.luoghi_unici),
          visite_pct: pct(current.visite_totali, previous.visite_totali)
        }
      };
    }
  };

  /* ---------- Heatmap (aggregato; mock locale, mai dati personali in output pubblico) ---------- */
  const HeatmapRepository = {
    k: HEATMAP_K,
    visitsPublic() {
      const mine = VisitRepository.list().data.items.filter(visit => visit.verification_status !== 'rejected');
      const byPlace = {};
      mine.forEach(v => { byPlace[v.place_id] = (byPlace[v.place_id] || 0) + 1; });
      const uniqueUsers = 1;
      if (uniqueUsers < HEATMAP_K) {
        return ok({
          mode: 'demo',
          k: HEATMAP_K,
          period: 'dati locali di questo profilo',
          message: 'Modalità dimostrativa: la soglia minima di 5 utenti non è raggiunta. Nessun aggregato pubblico. I tuoi visitati restano privati in Il mio Walkatlas.',
          cells: [],
          transitions: []
        });
      }
      const cells = Object.entries(byPlace)
        .filter(([, n]) => n >= HEATMAP_K)
        .map(([place_id, count]) => ({ place_id, count }));
      return ok({ mode: 'live', k: HEATMAP_K, cells, transitions: [] });
    },
    transitionsPublic() {
      return this.visitsPublic();
    }
  };

  /* ---------- Entitlements ---------- */
  const EntitlementService = {
    flags: FEATURE_FLAGS,
    plan() {
      const saved = db.get(storeKey('plan'), { plan: 'free' });
      return saved && saved.plan === 'plus' ? 'plus' : 'free';
    },
    setPlan(plan) {
      db.set(storeKey('plan'), { plan: plan === 'plus' ? 'plus' : 'free', updated_at: nowIso() });
      return this.plan();
    },
    list() {
      const plan = this.plan();
      return PLAN_ENTITLEMENTS[plan] || PLAN_ENTITLEMENTS.free;
    },
    can(capability) {
      if (FEATURE_FLAGS[capability] === false) return false;
      return this.list().includes(capability);
    },
    snapshot() {
      return { plan: this.plan(), flags: { ...FEATURE_FLAGS }, entitlements: this.list(), payments: false };
    }
  };

  /* ---------- Diario (prototipo localStorage; produzione = sql/0008_diary.sql) ---------- */
  const MAX_DIARY_TITLE = 120;
  const MAX_DIARY_BODY = 8000;
  const MAX_DIARY_CAPTION = 160;
  const MAX_DIARY_MEDIA = 8;
  const MAX_DIARY_TAGS = 8;

  function normalizeDiary(item) {
    if (!item || typeof item !== 'object' || item.deleted_at) return null;
    const type = ['place', 'route', 'free'].includes(item.entry_type) ? item.entry_type : 'free';
    const visibility = ['private', 'unlisted', 'public'].includes(item.visibility) ? item.visibility : 'private';
    const status = ['draft', 'published', 'hidden', 'reported'].includes(item.status) ? item.status : 'published';
    const ratingRaw = item.rating;
    const rating = ratingRaw === null || ratingRaw === undefined || ratingRaw === '' ? null : Math.min(5, Math.max(1, Number(ratingRaw) || 0));
    const places = Array.isArray(item.places)
      ? item.places.map((row, index) => {
          const placeId = row && typeof row === 'object' ? row.place_id || row.id : row;
          return placeId ? { place_id: String(placeId), position: Number.isFinite(row && row.position) ? row.position : index } : null;
        }).filter(Boolean).slice(0, 40)
      : [];
    const media = Array.isArray(item.media)
      ? item.media.map((row, index) => {
          if (!row || !row.file_url) return null;
          return {
            id: String(row.id || newId('media')),
            file_url: String(row.file_url),
            media_type: row.media_type || 'image',
            caption: sanitize(row.caption, MAX_DIARY_CAPTION),
            position: Number.isFinite(row.position) ? row.position : index,
            created_at: row.created_at || nowIso()
          };
        }).filter(Boolean).slice(0, MAX_DIARY_MEDIA)
      : [];
    return {
      id: String(item.id || newId('diary')),
      user_id: String(item.user_id || actorId()),
      author_name: sanitize(item.author_name, 80),
      entry_type: type,
      title: sanitize(item.title, MAX_DIARY_TITLE) || 'Senza titolo',
      body: String(item.body || '').slice(0, MAX_DIARY_BODY),
      visibility,
      rating,
      publish_as_review: !!item.publish_as_review,
      tags: Array.isArray(item.tags) ? item.tags.map(tag => sanitize(tag, 32)).filter(Boolean).slice(0, MAX_DIARY_TAGS) : [],
      places,
      route_id: item.route_id ? String(item.route_id) : null,
      person_id: item.person_id ? String(item.person_id) : null,
      visit_date: item.visit_date || null,
      media,
      status,
      created_at: item.created_at || nowIso(),
      updated_at: item.updated_at || nowIso(),
      published_at: item.published_at || null
    };
  }

  function diaryAuthorName() {
    const user = global.WalkatlasAuth && WalkatlasAuth.currentUser && WalkatlasAuth.currentUser();
    if (!user) return 'Ospite';
    return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'Esploratore';
  }

  function diaryCanRead(entry) {
    if (!entry) return false;
    if (entry.user_id === actorId()) return true;
    if (entry.status !== 'published') return false;
    return entry.visibility === 'public' || entry.visibility === 'unlisted';
  }

  const DiaryRepository = {
    listMine() {
      const items = readList('diary_entries', actorId()).map(normalizeDiary).filter(Boolean)
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
      return ok({ items });
    },
    listPublic(limit = 20) {
      const items = readAllLists('diary_entries').map(normalizeDiary).filter(Boolean)
        .filter(entry => entry.visibility === 'public' && entry.status === 'published')
        .sort((a, b) => Date.parse(b.published_at || b.created_at) - Date.parse(a.published_at || a.created_at))
        .slice(0, Math.max(1, Math.min(50, Number(limit) || 20)));
      return ok({ items });
    },
    get(id) {
      const all = readAllLists('diary_entries').map(normalizeDiary).filter(Boolean);
      const found = all.find(entry => entry.id === String(id));
      if (!found || !diaryCanRead(found)) return fail(404, 'not_found', 'Racconto non disponibile.');
      return ok(found);
    },
    create(input) {
      const auth = requireUser(true);
      if (auth) return auth;
      const list = readList('diary_entries', actorId()).map(normalizeDiary).filter(Boolean);
      const now = nowIso();
      const visibility = ['private', 'unlisted', 'public'].includes(input && input.visibility) ? input.visibility : 'private';
      const entry = normalizeDiary({
        ...(input || {}),
        id: newId('diary'),
        user_id: actorId(),
        author_name: diaryAuthorName(),
        visibility,
        status: 'published',
        created_at: now,
        updated_at: now,
        published_at: visibility === 'private' ? null : now
      });
      if (!writeList('diary_entries', [entry, ...list], actorId())) return storageFailure();
      return created(entry);
    },
    update(id, patch) {
      const auth = requireUser(true);
      if (auth) return auth;
      const list = readList('diary_entries', actorId()).map(normalizeDiary).filter(Boolean);
      const index = list.findIndex(entry => entry.id === String(id));
      if (index < 0) return fail(404, 'not_found', 'Racconto non trovato.');
      const next = normalizeDiary({
        ...list[index],
        ...(patch || {}),
        id: list[index].id,
        user_id: list[index].user_id,
        created_at: list[index].created_at,
        updated_at: nowIso()
      });
      if (next.visibility !== 'private' && !next.published_at) next.published_at = nowIso();
      if (next.visibility === 'private') next.published_at = null;
      list[index] = next;
      if (!writeList('diary_entries', list, actorId())) return storageFailure();
      return ok(next);
    },
    remove(id) {
      const auth = requireUser(true);
      if (auth) return auth;
      const list = readList('diary_entries', actorId()).map(normalizeDiary).filter(Boolean);
      if (!list.some(entry => entry.id === String(id))) return fail(404, 'not_found', 'Racconto non trovato.');
      if (!writeList('diary_entries', list.filter(entry => entry.id !== String(id)), actorId())) return storageFailure();
      return ok({ id: String(id), deleted: true });
    },
    report(id, reason) {
      const found = this.get(id);
      if (!found.ok) return found;
      const reports = readList('diary_reports', actorId());
      reports.unshift({ id: newId('report'), diary_entry_id: String(id), reason: sanitize(reason, 280), created_at: nowIso() });
      writeList('diary_reports', reports.slice(0, 50), actorId());
      return ok({ reported: true });
    }
  };

  /* PROGETTO TEMPO v0.1 — ActivityRepository + filtri GPS. Pacchetto: progetto-tempo/ */
  const ACTIVITY_STATUSES = ['in_progress', 'paused', 'completed', 'partial', 'discarded'];
  const LIVE_STATUSES = ['in_progress', 'paused'];
  const STOP_STATUSES = ['planned', 'reached', 'visited', 'skipped'];
  const MAX_ACTIVITY_POINTS = 4000;
  const MAX_ACTIVITY_NOTE = 800;
  /* Soglie GPS dell’attività: documentate qui, non nei componenti UI. */
  const ACTIVITY_GPS = Object.freeze({
    maxAccuracyM: 45,
    minMoveM: 6,
    maxJumpM: 120,
    maxSpeedMps: 5.5,
    proximityM: 80,
    staleMs: 45000,
    persistMs: 8000
  });

  function haversineMeters(lat1, lon1, lat2, lon2) {
    const r = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function acceptActivityGpsPoint(previous, coords, nowMs, paused) {
    if (paused) return { accepted: false, reason: 'paused', meters: 0 };
    if (!coords) return { accepted: false, reason: 'invalid', meters: 0 };
    const lat = Number(coords.latitude), lon = Number(coords.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return { accepted: false, reason: 'invalid', meters: 0 };
    const accuracy = Number(coords.accuracy);
    if (Number.isFinite(accuracy) && accuracy > ACTIVITY_GPS.maxAccuracyM) {
      return { accepted: false, reason: 'accuracy', meters: 0 };
    }
    if (!previous) return { accepted: true, reason: 'first', meters: 0 };
    const meters = haversineMeters(previous.latitude, previous.longitude, lat, lon);
    const dt = Math.max(0.001, (Number(nowMs) - Number(previous.recorded_at_ms || nowMs)) / 1000);
    if (meters < ACTIVITY_GPS.minMoveM) return { accepted: false, reason: 'still', meters };
    if (meters / dt > ACTIVITY_GPS.maxSpeedMps) return { accepted: false, reason: 'speed', meters };
    if (meters > ACTIVITY_GPS.maxJumpM) return { accepted: false, reason: 'jump', meters };
    return { accepted: true, reason: 'ok', meters };
  }

  function normalizeActivityStop(item, index) {
    if (!item || typeof item !== 'object') return null;
    const status = STOP_STATUSES.includes(item.status) ? item.status : 'planned';
    return {
      id: String(item.id || newId('astop')),
      place_id: String(item.place_id || ''),
      sequence_number: Number.isFinite(Number(item.sequence_number)) ? Number(item.sequence_number) : index,
      status,
      reached_at: item.reached_at || null,
      visit_id: item.visit_id || null,
      confirmation_method: ['manual', 'gps_confirm', 'skipped'].includes(item.confirmation_method) ? item.confirmation_method : 'manual'
    };
  }

  function normalizeActivity(item) {
    if (!item || typeof item !== 'object' || item.deleted_at) return null;
    const status = ACTIVITY_STATUSES.includes(item.status) ? item.status : 'in_progress';
    const type = item.activity_type === 'route' ? 'route' : 'free';
    const method = ['gps', 'manual', 'estimated', 'imported'].includes(item.recording_method) ? item.recording_method : 'manual';
    const source = ['recorded_gps', 'planned_route', 'manual', 'unavailable'].includes(item.distance_source) ? item.distance_source : 'unavailable';
    const stops = Array.isArray(item.stops) ? item.stops.map(normalizeActivityStop).filter(Boolean) : [];
    return {
      id: String(item.id || newId('act')),
      user_id: String(item.user_id || actorId()),
      route_id: item.route_id ? String(item.route_id) : null,
      favorite_route_id: item.favorite_route_id ? String(item.favorite_route_id) : null,
      title: sanitize(item.title, MAX_ROUTE_TITLE) || 'Camminata culturale',
      activity_type: type,
      status,
      visibility: ['private', 'unlisted', 'public'].includes(item.visibility) ? item.visibility : 'private',
      recording_method: method,
      distance_source: source,
      started_at: item.started_at || nowIso(),
      ended_at: item.ended_at || null,
      elapsed_seconds: Math.max(0, Math.round(Number(item.elapsed_seconds) || 0)),
      moving_seconds: Math.max(0, Math.round(Number(item.moving_seconds) || 0)),
      paused_seconds: Math.max(0, Math.round(Number(item.paused_seconds) || 0)),
      distance_meters: Math.max(0, Math.round(Number(item.distance_meters) || 0)),
      estimated_distance_meters: item.estimated_distance_meters == null ? null : Math.max(0, Math.round(Number(item.estimated_distance_meters) || 0)),
      keep_track: item.keep_track !== false,
      notes: sanitize(item.notes, MAX_ACTIVITY_NOTE),
      last_point_at: item.last_point_at || null,
      idempotency_key: String(item.idempotency_key || ''),
      created_at: item.created_at || nowIso(),
      updated_at: item.updated_at || nowIso(),
      deleted_at: null,
      stops
    };
  }

  function normalizeActivityPoint(item, index) {
    if (!item || typeof item !== 'object') return null;
    const lat = Number(item.latitude), lon = Number(item.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return {
      id: String(item.id || newId('apt')),
      recorded_at: item.recorded_at || nowIso(),
      latitude: lat,
      longitude: lon,
      accuracy_meters: Number.isFinite(Number(item.accuracy_meters)) ? Number(item.accuracy_meters) : null,
      altitude_meters: Number.isFinite(Number(item.altitude_meters)) ? Number(item.altitude_meters) : null,
      speed_meters_second: Number.isFinite(Number(item.speed_meters_second)) ? Number(item.speed_meters_second) : null,
      sequence_number: Number.isFinite(Number(item.sequence_number)) ? Number(item.sequence_number) : index,
      accepted: item.accepted !== false
    };
  }

  const ActivityRepository = {
    listMine() {
      const items = readList('activities', actorId()).map(normalizeActivity).filter(Boolean)
        .filter(a => a.status !== 'discarded')
        .sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at));
      return ok({ items, total: items.length });
    },
    active() {
      const live = readList('activities', actorId()).map(normalizeActivity).filter(Boolean)
        .find(a => LIVE_STATUSES.includes(a.status));
      return ok(live || null);
    },
    get(id, withPoints) {
      const list = readList('activities', actorId()).map(normalizeActivity).filter(Boolean);
      const found = list.find(a => a.id === String(id));
      if (!found) return fail(404, 'not_found', 'Attività non trovata.');
      if (withPoints) {
        found.points = readList('activity_points', actorId())
          .filter(p => p && p.activity_id === found.id)
          .map(normalizeActivityPoint).filter(Boolean)
          .sort((a, b) => a.sequence_number - b.sequence_number);
      }
      return ok(found);
    },
    create(input) {
      const auth = requireUser(true);
      if (auth) return auth;
      const userId = actorId();
      const key = String((input && input.idempotency_key) || '');
      const list = readList('activities', userId).map(normalizeActivity).filter(Boolean);
      if (key) {
        const dup = list.find(a => a.idempotency_key === key);
        if (dup) return ok(dup);
      }
      const live = this.active();
      if (live.ok && live.data) return fail(409, 'activity_open', 'Hai già un’attività in corso o in pausa. Termina o riprendi quella.');
      const stops = Array.isArray(input && input.stops) ? input.stops : [];
      const activity = normalizeActivity({
        ...(input || {}),
        id: newId('act'),
        user_id: userId,
        status: 'in_progress',
        visibility: 'private',
        started_at: nowIso(),
        elapsed_seconds: 0,
        moving_seconds: 0,
        paused_seconds: 0,
        distance_meters: 0,
        keep_track: true,
        stops: stops.map((s, i) => ({
          place_id: s.place_id || s,
          sequence_number: i,
          status: 'planned'
        }))
      });
      activity.idempotency_key = key;
      if (!writeList('activities', [activity, ...list], userId)) return storageFailure();
      return created(activity);
    },
    update(id, patch) {
      const auth = requireUser(true);
      if (auth) return auth;
      const userId = actorId();
      const list = readList('activities', userId).map(normalizeActivity).filter(Boolean);
      const index = list.findIndex(a => a.id === String(id));
      if (index < 0) return fail(404, 'not_found', 'Attività non trovata.');
      const current = list[index];
      const next = normalizeActivity({ ...current, ...(patch || {}), id: current.id, user_id: current.user_id, started_at: current.started_at, created_at: current.created_at, updated_at: nowIso() });
      if (Array.isArray(patch && patch.stops)) next.stops = patch.stops.map(normalizeActivityStop).filter(Boolean);
      list[index] = next;
      if (!writeList('activities', list, userId)) return storageFailure();
      return ok(next);
    },
    pause(id) { return this.update(id, { status: 'paused' }); },
    resume(id) {
      const live = this.active();
      if (live.ok && live.data && live.data.id !== String(id)) {
        return fail(409, 'activity_open', 'Un’altra attività è già aperta.');
      }
      return this.update(id, { status: 'in_progress' });
    },
    setStop(id, placeId, patch) {
      const got = this.get(id);
      if (!got.ok) return got;
      const stops = (got.data.stops || []).map(stop => {
        if (stop.place_id !== String(placeId)) return stop;
        return normalizeActivityStop({ ...stop, ...(patch || {}) }, stop.sequence_number);
      });
      return this.update(id, { stops });
    },
    finish(id, status, extra) {
      const allowed = ['completed', 'partial', 'discarded'];
      const nextStatus = allowed.includes(status) ? status : 'partial';
      return this.update(id, { status: nextStatus, ended_at: nowIso(), ...(extra || {}) });
    },
    appendPoints(id, points) {
      const auth = requireUser(true);
      if (auth) return auth;
      const got = this.get(id);
      if (!got.ok) return got;
      if (got.data.status !== 'in_progress') return fail(409, 'not_recording', 'L’attività non sta registrando.');
      const userId = actorId();
      const existing = readList('activity_points', userId).filter(p => p && p.activity_id === String(id));
      const start = existing.length;
      const incoming = (Array.isArray(points) ? points : []).map((p, i) => {
        const row = normalizeActivityPoint(p, start + i);
        if (!row) return null;
        row.activity_id = String(id);
        return row;
      }).filter(Boolean);
      const merged = existing.concat(incoming).slice(-MAX_ACTIVITY_POINTS);
      if (!writeList('activity_points', [
        ...readList('activity_points', userId).filter(p => p && p.activity_id !== String(id)),
        ...merged
      ], userId)) return storageFailure();
      return ok({ added: incoming.length, total: merged.length });
    },
    clearTrack(id) {
      const auth = requireUser(true);
      if (auth) return auth;
      const got = this.get(id);
      if (!got.ok) return got;
      const userId = actorId();
      if (!writeList('activity_points', readList('activity_points', userId).filter(p => p && p.activity_id !== String(id)), userId)) return storageFailure();
      return this.update(id, { keep_track: false, distance_source: got.data.distance_source === 'recorded_gps' ? 'unavailable' : got.data.distance_source });
    },
    remove(id) {
      return this.finish(id, 'discarded', { keep_track: false });
    },
    stats(year) {
      const items = this.listMine().data.items.filter(a => a.status === 'completed' || a.status === 'partial')
        .filter(a => !year || new Date(a.started_at).getFullYear() === Number(year));
      const km = items.reduce((n, a) => n + (a.distance_source === 'recorded_gps' ? a.distance_meters : 0), 0) / 1000;
      const moving = items.reduce((n, a) => n + a.moving_seconds, 0);
      const elapsed = items.reduce((n, a) => n + a.elapsed_seconds, 0);
      const longest = items.slice().sort((a, b) => b.distance_meters - a.distance_meters)[0] || null;
      const longestTime = items.slice().sort((a, b) => b.moving_seconds - a.moving_seconds)[0] || null;
      return ok({
        year: year || null,
        attivita: items.length,
        completate: items.filter(a => a.status === 'completed').length,
        parziali: items.filter(a => a.status === 'partial').length,
        km_registrati: Math.round(km * 10) / 10,
        minuti_in_movimento: Math.round(moving / 60),
        minuti_totali: Math.round(elapsed / 60),
        piu_lunga_km: longest,
        piu_lunga_tempo: longestTime
      });
    }
  };



  function adoptGuestIfNeeded() {
    const user = global.WalkatlasAuth && WalkatlasAuth.currentUser && WalkatlasAuth.currentUser();
    if (!user) return;
    const guestVisits = readList('visits', 'guest-local').map(normalizeVisit).filter(Boolean);
    if (guestVisits.length) {
      const mine = readList('visits', user.id).map(normalizeVisit).filter(Boolean);
      const keys = new Set(mine.map(v => v.idempotency_key));
      const merged = [...mine];
      guestVisits.forEach(v => {
        if (keys.has(v.idempotency_key)) return;
        merged.push({ ...v, id: newId('visit'), user_id: user.id });
      });
      if (writeList('visits', merged, user.id)) writeList('visits', [], 'guest-local');
    }
    const guestRoutes = readList('routes', 'guest-local').map(normalizeRoute).filter(Boolean);
    if (guestRoutes.length) {
      const mine = readList('routes', user.id).map(normalizeRoute).filter(Boolean);
      const keys = new Set(mine.map(r => `${r.title}|${r.stops.map(s => s.place_id).join(',')}`));
      guestRoutes.forEach(r => {
        const key = `${r.title}|${r.stops.map(s => s.place_id).join(',')}`;
        if (keys.has(key)) return;
        mine.push({ ...r, id: newId('route'), owner_user_id: user.id, visibility: 'private', status: 'draft' });
      });
      if (writeList('routes', mine, user.id)) writeList('routes', [], 'guest-local');
    }
    const guestDiary = readList('diary_entries', 'guest-local').map(normalizeDiary).filter(Boolean);
    if (guestDiary.length) {
      const mine = readList('diary_entries', user.id).map(normalizeDiary).filter(Boolean);
      const keys = new Set(mine.map(entry => `${entry.title}|${entry.created_at}`));
      guestDiary.forEach(entry => {
        const key = `${entry.title}|${entry.created_at}`;
        if (keys.has(key)) return;
        mine.push({ ...entry, id: newId('diary'), user_id: user.id, author_name: diaryAuthorName() });
      });
      if (writeList('diary_entries', mine, user.id)) writeList('diary_entries', [], 'guest-local');
    }
  }

  function exportMine() {
    return {
      exported_at: nowIso(),
      user_id: actorId(),
      guest: isGuest(),
      visits: VisitRepository.list().data.items,
      routes: RouteRepository.listMine().data.items,
      diary_entries: DiaryRepository.listMine().data.items,
      activities: ActivityRepository.listMine().data.items,
      completions: readList('route_completions')
    };
  }

  function wipeMine() {
    const id = actorId();
    return [
      writeList('visits', [], id),
      writeList('routes', [], id),
      writeList('route_saves', [], id),
      writeList('route_completions', [], id),
      writeList('diary_entries', [], id),
      writeList('activities', [], id),
      writeList('activity_points', [], id)
    ].every(Boolean);
  }

  global.WalkatlasV12 = Object.freeze({
    version: '1.2',
    FEATURE_FLAGS,
    VisitRepository,
    RouteRepository,
    DiaryRepository,
    ActivityRepository,
    ActivityGps: Object.freeze({
      config: ACTIVITY_GPS,
      acceptPoint: acceptActivityGpsPoint,
      haversineMeters
    }),
    StatsService,
    HeatmapRepository,
    EntitlementService,
    actorId,
    isGuest,
    adoptGuestIfNeeded,
    exportMine,
    wipeMine
  });
  global.PalinsestoV12 = global.WalkatlasV12;
})(window);
