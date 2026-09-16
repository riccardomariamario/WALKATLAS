(function (global) {
  'use strict';

  /* Formato tecnico storico dei link: non cambia, così i percorsi già condivisi restano interoperabili. */
  const PREFIX = 'PAL1.';
  const ALTERNATE_PREFIX = 'WALK1.';
  const VERSION = 1;
  const MAX_CODE_LENGTH = 8192;
  const MAX_JSON_BYTES = 4096;
  const MAX_PLACES = 40;
  const REF_PATTERN = /^[A-Z]{2}:[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const BASE_ICONS = new Set(['tent', 'bed', 'pin']);

  function fail(message) {
    throw new Error(message);
  }

  function boundedText(value, maxLength) {
    return String(value || '').trim().slice(0, maxLength);
  }

  function normalizeReference(value, strict = false) {
    const raw = String(value || '').trim();
    if (strict) return REF_PATTERN.test(raw) ? raw : null;
    const separator = raw.indexOf(':');
    if (separator < 1) return null;
    const country = raw.slice(0, separator).toUpperCase();
    const slug = raw.slice(separator + 1).toLowerCase();
    const normalized = `${country}:${slug}`;
    return REF_PATTERN.test(normalized) ? normalized : null;
  }

  function placeReference(place) {
    if (typeof place === 'string') return normalizeReference(place);
    if (!place || typeof place !== 'object' || Array.isArray(place)) return null;
    const country = place.countryId || place.countryCode || place.country || '';
    return normalizeReference(`${country}:${place.slug || ''}`);
  }

  function uniqueReferences(values, strict = false) {
    const result = [];
    const seen = new Set();
    for (const value of Array.isArray(values) ? values : []) {
      const reference = typeof value === 'object'
        ? placeReference(value)
        : normalizeReference(value, strict);
      if (!reference || seen.has(reference)) continue;
      seen.add(reference);
      result.push(reference);
    }
    return result;
  }

  function normalizeSharedBase(value, strict = false) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    if (strict) {
      const allowed = new Set(['lat', 'lon', 'label', 'icon', 'city']);
      if (Object.keys(value).some(key => !allowed.has(key))) return null;
      if (typeof value.lat !== 'number' || typeof value.lon !== 'number') return null;
      if (typeof value.label !== 'string' || value.label.length > 120) return null;
      if (typeof value.city !== 'string' || value.city.length > 80) return null;
      if (typeof value.icon !== 'string' || !BASE_ICONS.has(value.icon)) return null;
    }
    const lat = Number(value.lat);
    const lon = Number(value.lon);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) return null;
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) return null;
    return {
      lat: Math.round(lat * 100000) / 100000,
      lon: Math.round(lon * 100000) / 100000,
      label: boundedText(value.label, 120) || 'Base condivisa',
      icon: BASE_ICONS.has(value.icon) ? value.icon : 'tent',
      city: boundedText(value.city, 80)
    };
  }

  function createPayload(input) {
    const source = input && typeof input === 'object' ? input : {};
    const places = source.placeRefs || source.places || [];
    const references = uniqueReferences(places);
    if (!references.length) fail('Aggiungi almeno una tappa prima di condividere.');
    if (references.length > MAX_PLACES) fail(`Puoi condividere al massimo ${MAX_PLACES} tappe.`);
    const payload = {
      v: VERSION,
      n: boundedText(source.name, 80) || 'Itinerario condiviso',
      p: references,
      m: source.mode === 'view' ? 'view' : 'copy'
    };
    if (source.includeBase === true) {
      const base = normalizeSharedBase(source.base);
      if (!base) fail('La base da condividere non è valida.');
      payload.b = base;
    }
    return payload;
  }

  function bytesToBase64Url(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + chunkSize));
    }
    return global.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function base64UrlToBytes(value) {
    if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) {
      fail('Il codice dell’itinerario non è valido.');
    }
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    let binary;
    try {
      binary = global.atob(padded);
    } catch (error) {
      fail('Il codice dell’itinerario non è valido.');
    }
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }

  function encodeItinerary(input) {
    const payload = createPayload(input);
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    if (bytes.byteLength > MAX_JSON_BYTES) fail('L’itinerario è troppo grande per un link offline.');
    const code = `${PREFIX}${bytesToBase64Url(bytes)}`;
    if (code.length > MAX_CODE_LENGTH) fail('L’itinerario è troppo grande per un link offline.');
    return code;
  }

  function acceptedPrefix(value) {
    if (String(value).startsWith(PREFIX)) return PREFIX;
    if (String(value).startsWith(ALTERNATE_PREFIX)) return ALTERNATE_PREFIX;
    return null;
  }

  function extractCode(value) {
    const raw = String(value || '').trim();
    if (!raw) fail('Inserisci un codice o un link condiviso.');
    if (acceptedPrefix(raw)) return raw;

    try {
      const url = new URL(raw, 'https://walkatlas.invalid/');
      const direct = url.searchParams.get('c');
      if (direct && acceptedPrefix(direct)) return direct;
      const queryIndex = url.hash.indexOf('?');
      if (queryIndex >= 0) {
        const fromHash = new URLSearchParams(url.hash.slice(queryIndex + 1)).get('c');
        if (fromHash && acceptedPrefix(fromHash)) return fromHash;
      }
    } catch (error) {
      // Il controllo tramite espressione regolare qui sotto gestisce anche frammenti di link.
    }

    const match = raw.match(/(?:^|[?&#=])((?:WALK1|PAL1)\.[A-Za-z0-9_-]+)/);
    if (match) return match[1];
    fail('Non trovo un itinerario Walkatlas valido nel testo inserito.');
  }

  function decodeItinerary(value) {
    const code = extractCode(value);
    const codePrefix = acceptedPrefix(code);
    if (code.length > MAX_CODE_LENGTH || !codePrefix) {
      fail('Il codice dell’itinerario non è valido.');
    }
    const bytes = base64UrlToBytes(code.slice(codePrefix.length));
    if (!bytes.byteLength || bytes.byteLength > MAX_JSON_BYTES) {
      fail('Il codice dell’itinerario supera la dimensione consentita.');
    }
    let payload;
    try {
      const json = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      payload = JSON.parse(json);
    } catch (error) {
      fail('Il contenuto dell’itinerario non è leggibile.');
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      fail('Il contenuto dell’itinerario non è valido.');
    }
    const allowed = new Set(['v', 'n', 'p', 'b', 'm']);
    if (Object.keys(payload).some(key => !allowed.has(key))) {
      fail('Il contenuto dell’itinerario contiene dati non riconosciuti.');
    }
    if (payload.v !== VERSION) fail('Questa versione del link non è supportata.');
    if (typeof payload.n !== 'string' || !payload.n.trim() || payload.n.length > 80) {
      fail('Il nome dell’itinerario non è valido.');
    }
    if (!Array.isArray(payload.p) || !payload.p.length || payload.p.length > MAX_PLACES) {
      fail(`L’itinerario deve contenere da 1 a ${MAX_PLACES} tappe.`);
    }
    const accessMode = payload.m === undefined ? 'copy' : payload.m;
    if (accessMode !== 'view' && accessMode !== 'copy') {
      fail('La modalità di condivisione non è valida.');
    }
    const placeRefs = uniqueReferences(payload.p, true);
    if (placeRefs.length !== payload.p.length) {
      fail('Le tappe del link non sono valide oppure sono duplicate.');
    }
    let base = null;
    if (Object.prototype.hasOwnProperty.call(payload, 'b')) {
      base = normalizeSharedBase(payload.b, true);
      if (!base) fail('La base inclusa nel link non è valida.');
    }
    return {
      version: VERSION,
      name: payload.n.trim(),
      placeRefs,
      accessMode,
      base,
      code
    };
  }

  function mergeReferences(current, incoming) {
    return uniqueReferences([...(Array.isArray(current) ? current : []), ...(Array.isArray(incoming) ? incoming : [])]);
  }

  function adoptReferences(current, incoming, mode = 'merge') {
    if (mode === 'replace') return uniqueReferences(incoming);
    if (mode === 'merge') return mergeReferences(current, incoming);
    fail('Modalità di importazione non riconosciuta.');
  }

  function buildShareUrl(currentHref, code) {
    const decoded = decodeItinerary(code);
    const url = new URL(String(currentHref || ''), 'https://walkatlas.app/');
    url.hash = `percorso-condiviso?c=${encodeURIComponent(decoded.code)}`;
    return url.href;
  }

  global.WalkatlasTrip = Object.freeze({
    PREFIX,
    ALTERNATE_PREFIX,
    VERSION,
    MAX_PLACES,
    placeReference,
    createPayload,
    encodeItinerary,
    decodeItinerary,
    extractCode,
    mergeReferences,
    adoptReferences,
    buildShareUrl,
    isShareableProtocol: href => /^https?:/i.test(String(href || ''))
  });
  global.PalinsestoTrip = global.WalkatlasTrip;
})(window);
