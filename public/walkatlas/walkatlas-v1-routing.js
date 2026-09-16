/* WALKATLAS v1 — routing pedonale OSRM.
   Il server pubblico è adatto soltanto a prove leggere: in produzione usare un provider dedicato. */
(function (global) {
  'use strict';

  const config = {
    baseUrl: 'https://routing.openstreetmap.de/routed-foot',
    profile: 'foot',
    apiProfile: 'driving',
    timeoutMs: 12000,
    minRequestIntervalMs: 1100,
    maxWaypoints: 25
  };

  const cache = new Map();
  const inflight = new Map();
  const FALLBACK_TTL_MS = 30000;
  let requestQueue = Promise.resolve();
  let lastRequestStartedAt = 0;

  function fingerprint(points) {
    const root = String(config.baseUrl || '').replace(/\/$/, '');
    return `${root}|${config.profile}|${config.apiProfile}|${points.map(p => `${Number(p.lat).toFixed(5)},${Number(p.lon).toFixed(5)}`).join('|')}`;
  }

  function cacheGet(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) { cache.delete(key); return null; }
    return entry.value;
  }

  function cacheSet(key, value, ttlMs = null) {
    cache.set(key, { value, expiresAt: ttlMs === null ? null : Date.now() + ttlMs });
  }

  function waypoints(items, base, returnToBase) {
    const places = Array.isArray(items) ? items.filter(p => p && Number.isFinite(p.lat) && Number.isFinite(p.lon)) : [];
    if (base && Number.isFinite(base.lat) && Number.isFinite(base.lon) && places.length) {
      return returnToBase === false ? [base, ...places] : [base, ...places, base];
    }
    return places;
  }

  function haversineKm(a, b) {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLon = (b.lon - a.lon) * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  function airEstimate(points) {
    let km = 0;
    for (let i = 1; i < points.length; i++) km += haversineKm(points[i - 1], points[i]);
    const durationMin = Math.max(1, Math.round((km / 4.5) * 60));
    return {
      source: 'air',
      label: 'stima in linea d’aria',
      km,
      durationMin,
      latlngs: points.map(p => [p.lat, p.lon])
    };
  }

  function maneuverInstruction(maneuver, streetName) {
    const type = String(maneuver && maneuver.type || 'continue');
    const modifier = String(maneuver && maneuver.modifier || '');
    const street = String(streetName || '').trim();
    const suffix = street ? ` su ${street}` : '';
    if (type === 'depart') return `Parti${suffix}`;
    if (type === 'arrive') return 'Sei arrivato';
    if (type.includes('roundabout') || type === 'rotary') return `Entra nella rotonda${suffix}`;
    if (modifier === 'left') return `Svolta a sinistra${suffix}`;
    if (modifier === 'slight left') return `Tieni leggermente la sinistra${suffix}`;
    if (modifier === 'sharp left') return `Svolta nettamente a sinistra${suffix}`;
    if (modifier === 'right') return `Svolta a destra${suffix}`;
    if (modifier === 'slight right') return `Tieni leggermente la destra${suffix}`;
    if (modifier === 'sharp right') return `Svolta nettamente a destra${suffix}`;
    if (modifier === 'uturn') return 'Fai inversione quando è sicuro';
    return `Continua${suffix}`;
  }

  function scheduleRequest(task) {
    const run = requestQueue.then(async () => {
      const waitMs = Math.max(0, Number(config.minRequestIntervalMs || 0) - (Date.now() - lastRequestStartedAt));
      if (waitMs) await new Promise(resolve => setTimeout(resolve, waitMs));
      lastRequestStartedAt = Date.now();
      return task();
    });
    requestQueue = run.catch(() => undefined);
    return run;
  }

  async function requestOsrm(points) {
    if (!Array.isArray(points) || points.length < 2) throw new Error('Servono almeno due punti per il percorso.');
    if (points.length > config.maxWaypoints) throw new Error(`La guida supporta al massimo ${config.maxWaypoints - 2} tappe più partenza e ritorno.`);
    const coord = points.map(p => `${p.lon},${p.lat}`).join(';');
    const root = String(config.baseUrl || '').replace(/\/$/, '');
    const url = `${root}/route/v1/${config.apiProfile}/${coord}?overview=full&geometries=geojson&steps=true&annotations=false`;
    return scheduleRequest(async () => {
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = setTimeout(() => { if (controller) controller.abort(); }, config.timeoutMs);
      try {
        const response = await fetch(url, { signal: controller ? controller.signal : undefined, mode: 'cors' });
        if (!response.ok) throw new Error(`osrm ${response.status}`);
        const body = await response.json();
        const route = body && Array.isArray(body.routes) ? body.routes[0] : null;
        if (!route || !route.geometry || !Array.isArray(route.geometry.coordinates)) throw new Error('osrm empty');
        const coordinates = route.geometry.coordinates.map(pair => [Number(pair[0]), Number(pair[1])]);
        const latlngs = coordinates.map(pair => [pair[1], pair[0]]);
        const km = Number(route.distance || 0) / 1000;
        const durationSec = Math.max(1, Math.round(Number(route.duration || 0)));
        const durationMin = Math.max(1, Math.round(durationSec / 60));
        if (!latlngs.length || latlngs.some(pair => !pair.every(Number.isFinite)) || !Number.isFinite(km) || !Number.isFinite(durationMin)) throw new Error('osrm invalid');
        const legs = (Array.isArray(route.legs) ? route.legs : []).map((leg, legIndex) => ({
          legIndex,
          distanceM: Math.max(0, Number(leg.distance || 0)),
          durationSec: Math.max(0, Number(leg.duration || 0)),
          summary: String(leg.summary || '')
        }));
        const maneuvers = [];
        (Array.isArray(route.legs) ? route.legs : []).forEach((leg, legIndex) => {
          (Array.isArray(leg.steps) ? leg.steps : []).forEach((step, stepIndex) => {
            const maneuver = step.maneuver || {};
            const location = Array.isArray(maneuver.location) ? [Number(maneuver.location[0]), Number(maneuver.location[1])] : null;
            if (!location || !location.every(Number.isFinite)) return;
            maneuvers.push({
              id: `leg-${legIndex + 1}-step-${stepIndex + 1}`,
              legIndex,
              stepIndex,
              type: String(maneuver.type || 'continue'),
              modifier: String(maneuver.modifier || ''),
              streetName: String(step.name || ''),
              instruction: maneuverInstruction(maneuver, step.name),
              location,
              distanceM: Math.max(0, Number(step.distance || 0)),
              durationSec: Math.max(0, Number(step.duration || 0))
            });
          });
        });
        return {
          id: `osrm-${Date.now()}`,
          source: 'osrm',
          profile: 'foot',
          provider: 'FOSSGIS OSRM foot',
          label: 'percorso a piedi',
          km,
          durationMin,
          durationSec,
          latlngs,
          polyline: { type: 'LineString', coordinates },
          legs,
          maneuvers
        };
      } finally {
        clearTimeout(timer);
      }
    });
  }

  function cached(items, base, returnToBase = true) {
    const points = waypoints(items, base, returnToBase);
    if (points.length < 2) return null;
    return cacheGet(fingerprint(points));
  }

  async function ensure(items, base, returnToBase = true) {
    const points = waypoints(items, base, returnToBase);
    if (points.length < 2) return null;
    const key = fingerprint(points);
    const saved = cacheGet(key);
    if (saved) return saved;
    if (inflight.has(key)) return inflight.get(key);
    const job = (async () => {
      try {
        const walking = await requestOsrm(points);
        cacheSet(key, walking);
        return walking;
      } catch (error) {
        const estimate = airEstimate(points);
        cacheSet(key, estimate, FALLBACK_TTL_MS);
        return estimate;
      } finally {
        inflight.delete(key);
      }
    })();
    inflight.set(key, job);
    return job;
  }

  async function ensureStrict(items, base, returnToBase = true) {
    const points = waypoints(items, base, returnToBase);
    if (points.length < 2) throw new Error('Servono almeno una partenza e una tappa.');
    const baseKey = fingerprint(points);
    const saved = cacheGet(baseKey);
    if (saved && saved.source === 'osrm') return saved;
    const key = `strict|${baseKey}`;
    if (inflight.has(key)) return inflight.get(key);
    const job = requestOsrm(points).then(walking => {
      cacheSet(baseKey, walking);
      cacheSet(key, walking);
      return walking;
    }).finally(() => inflight.delete(key));
    inflight.set(key, job);
    return job;
  }

  async function routePoints(points) {
    const clean = (Array.isArray(points) ? points : []).filter(point => point && Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lon))).map(point => ({ lat: Number(point.lat), lon: Number(point.lon) }));
    if (clean.length < 2) throw new Error('Servono almeno due punti per il ricalcolo.');
    const key = `direct|${fingerprint(clean)}`;
    const saved = cacheGet(key);
    if (saved && saved.source === 'osrm') return saved;
    if (inflight.has(key)) return inflight.get(key);
    const job = requestOsrm(clean).then(walking => { cacheSet(key, walking, 15000); return walking; }).finally(() => inflight.delete(key));
    inflight.set(key, job);
    return job;
  }

  function clear() { cache.clear(); }

  global.WalkatlasWalk = {
    config,
    cached,
    ensure,
    ensureStrict,
    routePoints,
    waypoints,
    airEstimate,
    clear
  };
  global.PalinsestoWalk = global.WalkatlasWalk;
})(window);
