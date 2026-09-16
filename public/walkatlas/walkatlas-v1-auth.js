(function (global) {
  'use strict';

  /* Chiavi tecniche storiche mantenute per non perdere profili, base e preferiti. */
  const USERS_KEY = 'palinsesto_v9_users';
  const SESSION_KEY = 'palinsesto_v9_session';
  const GUEST_DATA_KEY = 'palinsesto_v9_guest_data';
  const USER_DATA_PREFIX = 'palinsesto_v9_userdata_';
  const RESET_KEY = 'palinsesto_v9_resets';
  const LAST_EMAIL_KEY = 'walkatlas_last_email';
  const DEMO_EMAIL = 'prova@walkatlas.app';
  const DEMO_PASSWORD = 'Walkatlas1';
  const PASSWORD_ITERATIONS = 120000;
  const RESET_TTL_MS = 15 * 60 * 1000;
  const RESET_MAX_ATTEMPTS = 5;
  const RESET_CODE_ITERATIONS = 80000;
  const RESET_REQUEST_COOLDOWN_MS = 60 * 1000;
  const RESET_REQUEST_WINDOW_MS = 15 * 60 * 1000;
  const RESET_MAX_REQUESTS_PER_WINDOW = 3;
  const MAX_ROUTE_PLACES = 40;
  const RESET_INVALID_MESSAGE = 'Codice non valido o scaduto. Richiedine uno nuovo.';
  const memoryFallback = new Map();

  let persistent = true;
  try {
    const probe = '__palinsesto_v9_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
  } catch (error) {
    persistent = false;
  }

  const storage = {
    getItem(key) {
      if (persistent) {
        try { return localStorage.getItem(key); } catch (error) { persistent = false; }
      }
      return memoryFallback.has(key) ? memoryFallback.get(key) : null;
    },
    setItem(key, value) {
      if (persistent) {
        try { localStorage.setItem(key, value); return; } catch (error) { persistent = false; }
      }
      memoryFallback.set(key, value);
    },
    removeItem(key) {
      if (persistent) {
        try { localStorage.removeItem(key); } catch (error) { persistent = false; }
      }
      memoryFallback.delete(key);
    }
  };

  function readJSON(key, fallback) {
    try {
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    storage.setItem(key, JSON.stringify(value));
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function newId() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') return global.crypto.randomUUID();
    return `usr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function randomSalt() {
    if (!global.crypto || typeof global.crypto.getRandomValues !== 'function') {
      throw new Error('Questo browser non supporta la registrazione protetta.');
    }
    const bytes = new Uint8Array(16);
    global.crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function passwordDigest(salt, password, iterations = PASSWORD_ITERATIONS) {
    if (!global.crypto || !global.crypto.subtle) {
      throw new Error('Questo browser non supporta la registrazione protetta.');
    }
    const encoder = new TextEncoder();
    const key = await global.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const derived = await global.crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: encoder.encode(salt), iterations, hash: 'SHA-256' },
      key,
      256
    );
    return Array.from(new Uint8Array(derived), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function randomResetCode() {
    if (!global.crypto || typeof global.crypto.getRandomValues !== 'function') {
      throw new Error('Questo browser non supporta il recupero password.');
    }
    const bytes = new Uint8Array(4);
    global.crypto.getRandomValues(bytes);
    const value = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
    return String(value % 1000000).padStart(6, '0');
  }

  function publicUser(user) {
    if (!user) return null;
    const safe = {};
    ['id', 'firstName', 'lastName', 'email', 'city', 'createdAt', 'updatedAt'].forEach(key => {
      if (Object.prototype.hasOwnProperty.call(user, key)) safe[key] = user[key];
    });
    return safe;
  }

  function passwordResets() {
    const value = readJSON(RESET_KEY, {});
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function removePasswordReset(emailValue) {
    const email = normalizeEmail(emailValue);
    const resets = passwordResets();
    if (!Object.prototype.hasOwnProperty.call(resets, email)) return false;
    delete resets[email];
    writeJSON(RESET_KEY, resets);
    return true;
  }

  function resetRequestedAt(pending) {
    if (!pending || typeof pending !== 'object') return 0;
    const explicit = Number(pending.requestedAt);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    const expiresAt = Number(pending.expiresAt);
    return Number.isFinite(expiresAt) && expiresAt > RESET_TTL_MS ? expiresAt - RESET_TTL_MS : 0;
  }

  function users() {
    const value = readJSON(USERS_KEY, []);
    return Array.isArray(value) ? value : [];
  }

  function lastEmail() {
    return String(storage.getItem(LAST_EMAIL_KEY) || '').trim().toLowerCase();
  }

  function rememberEmail(email) {
    const value = normalizeEmail(email);
    if (value) storage.setItem(LAST_EMAIL_KEY, value);
  }

  function collectUserdata() {
    const out = { guest: getUserData(null) };
    users().forEach(user => { out[user.id] = getUserData(user.id); });
    return out;
  }

  async function pushToServer() {
    try {
      await fetch('/api/auth/state', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users: users(),
          userdata: collectUserdata(),
          sessionUserId: session()?.userId || null
        })
      });
    } catch (error) { /* preview senza API: resta il salvataggio locale */ }
  }

  let pushTimer = 0;
  function schedulePush() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => { pushToServer(); }, 250);
  }

  function mergeIncomingUsers(incoming) {
    if (!Array.isArray(incoming) || !incoming.length) return false;
    const byEmail = new Map();
    users().forEach(user => { if (user && user.email) byEmail.set(String(user.email).toLowerCase(), user); });
    let changed = false;
    incoming.forEach(user => {
      if (!user || !user.email || !user.passwordHash || !user.salt) return;
      const key = String(user.email).toLowerCase();
      const prev = byEmail.get(key);
      if (!prev || String(user.updatedAt || '') >= String(prev.updatedAt || '')) {
        if (JSON.stringify(prev) !== JSON.stringify(user)) changed = true;
        byEmail.set(key, user);
      }
    });
    if (changed) writeJSON(USERS_KEY, [...byEmail.values()]);
    return changed;
  }

  function mergeIncomingUserdata(incoming) {
    if (!incoming || typeof incoming !== 'object') return;
    if (incoming.guest) saveUserData(null, { ...getUserData(null), ...normalizeUserData(incoming.guest) });
    Object.keys(incoming).forEach(id => {
      if (id === 'guest') return;
      saveUserData(id, { ...getUserData(id), ...normalizeUserData(incoming[id]) });
    });
  }

  async function ensureDemoAccount() {
    if (users().some(user => user.email === DEMO_EMAIL)) return;
    const now = new Date().toISOString();
    const salt = randomSalt();
    const passwordHash = await passwordDigest(salt, DEMO_PASSWORD, PASSWORD_ITERATIONS);
    const list = users();
    list.push({
      id: 'usr_demo_walkatlas',
      firstName: 'Esploratore',
      lastName: 'Walkatlas',
      email: DEMO_EMAIL,
      city: 'Roma',
      salt,
      passwordHash,
      passwordIterations: PASSWORD_ITERATIONS,
      createdAt: now,
      updatedAt: now,
      demo: true
    });
    writeJSON(USERS_KEY, list);
  }

  async function hydrateFromServer() {
    try {
      await ensureDemoAccount();
      const response = await fetch('/api/auth/state', { credentials: 'include' });
      if (!response.ok) { schedulePush(); return; }
      const remote = await response.json();
      mergeIncomingUsers(remote.users);
      mergeIncomingUserdata(remote.userdata);
      const remoteSession = remote.sessionUserId;
      if (remoteSession && users().some(user => user.id === remoteSession)) {
        if (!session() || session().userId !== remoteSession) {
          writeJSON(SESSION_KEY, { userId: remoteSession, createdAt: new Date().toISOString() });
        }
      }
      await ensureDemoAccount();
      schedulePush();
    } catch (error) {
      try { await ensureDemoAccount(); } catch (e) {}
    }
  }

  const ready = hydrateFromServer();

  function session() {
    const value = readJSON(SESSION_KEY, null);
    return value && value.userId ? value : null;
  }

  function currentUser() {
    const active = session();
    if (!active) return null;
    const user = users().find(item => item.id === active.userId);
    if (!user) {
      storage.removeItem(SESSION_KEY);
      return null;
    }
    return publicUser(user);
  }

  function defaultUserData() {
    return {
      route: [],
      favoritePlaces: [],
      favoritePeople: [],
      favoriteRoutes: [],
      recentlyViewed: [],
      homeBase: null,
      stats: { cardsOpened: 0, lastAccess: null },
      preferences: { language: 'it', country: 'IT' },
      catalogRefVersion: null
    };
  }

  function boundedText(value, maxLength) {
    return String(value || '').trim().slice(0, maxLength);
  }

  function normalizeHomeBase(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const lat = Number(value.lat);
    const lon = Number(value.lon);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) return null;
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) return null;
    const icon = ['tent', 'bed', 'pin'].includes(value.icon) ? value.icon : 'tent';
    const updatedAt = typeof value.updatedAt === 'string' && !Number.isNaN(Date.parse(value.updatedAt))
      ? value.updatedAt
      : new Date().toISOString();
    return {
      lat,
      lon,
      label: boundedText(value.label, 120) || 'La mia base',
      icon,
      city: boundedText(value.city, 80),
      updatedAt
    };
  }

  function normalizeUserData(value) {
    const base = defaultUserData();
    const source = value && typeof value === 'object' ? value : {};
    return {
      ...base,
      ...source,
      route: Array.isArray(source.route) ? source.route : [],
      favoritePlaces: Array.isArray(source.favoritePlaces) ? source.favoritePlaces : [],
      favoritePeople: Array.isArray(source.favoritePeople) ? source.favoritePeople : [],
      favoriteRoutes: Array.isArray(source.favoriteRoutes)
        ? source.favoriteRoutes.filter(item => item && typeof item === 'object').map(item => ({
            ...item,
            places: Array.isArray(item.places) ? item.places : [],
            stopNotes: item.stopNotes && typeof item.stopNotes === 'object' && !Array.isArray(item.stopNotes) ? item.stopNotes : {},
            stopPhotos: item.stopPhotos && typeof item.stopPhotos === 'object' && !Array.isArray(item.stopPhotos) ? item.stopPhotos : {}
          }))
        : [],
      recentlyViewed: Array.isArray(source.recentlyViewed) ? source.recentlyViewed : [],
      homeBase: normalizeHomeBase(source.homeBase),
      stats: { ...base.stats, ...(source.stats || {}) },
      preferences: { ...base.preferences, ...(source.preferences || {}) }
    };
  }

  function dataKey(userId) {
    return userId ? `${USER_DATA_PREFIX}${userId}` : GUEST_DATA_KEY;
  }

  function getUserData(userId) {
    return normalizeUserData(readJSON(dataKey(userId), null));
  }

  function saveUserData(userId, value) {
    const normalized = normalizeUserData(value);
    writeJSON(dataKey(userId), normalized);
    return normalized;
  }

  function activeUserId() {
    const active = session();
    return active ? active.userId : null;
  }

  function activeData() {
    return getUserData(activeUserId());
  }

  function updateActiveData(updater) {
    const userId = activeUserId();
    const before = getUserData(userId);
    const after = typeof updater === 'function' ? updater(before) : { ...before, ...updater };
    const saved = saveUserData(userId, after);
    schedulePush();
    return saved;
  }

  function notify(reason) {
    const detail = { user: currentUser() };
    if (reason) detail.reason = reason;
    global.dispatchEvent(new CustomEvent('walkatlas:authchange', { detail }));
    /* Evento storico mantenuto per eventuali integrazioni locali già esistenti. */
    global.dispatchEvent(new CustomEvent('palinsesto:authchange', { detail }));
  }

  function mergeGuestData(userId) {
    const guest = getUserData(null);
    const account = getUserData(userId);
    const merged = {
      ...account,
      route: Array.from(new Set([...(account.route || []), ...(guest.route || [])])),
      favoritePlaces: Array.from(new Set([...(account.favoritePlaces || []), ...(guest.favoritePlaces || [])])),
      favoritePeople: Array.from(new Set([...(account.favoritePeople || []), ...(guest.favoritePeople || [])])),
      recentlyViewed: Array.from(new Set([...(account.recentlyViewed || []), ...(guest.recentlyViewed || [])])).slice(0, 20),
      homeBase: account.homeBase || guest.homeBase || null,
      stats: {
        ...account.stats,
        cardsOpened: Number(account.stats.cardsOpened || 0) + Number(guest.stats.cardsOpened || 0)
      }
    };
    saveUserData(userId, merged);
    saveUserData(null, defaultUserData());
  }

  async function register(input) {
    const firstName = String(input.firstName || '').trim();
    const lastName = String(input.lastName || '').trim();
    const email = normalizeEmail(input.email);
    const password = String(input.password || '');
    if (!firstName || !lastName) throw new Error('Inserisci nome e cognome.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Inserisci un indirizzo email valido.');
    if (password.length < 8) throw new Error('La password deve contenere almeno 8 caratteri.');
    const list = users();
    if (list.some(user => user.email === email)) throw new Error('Esiste già un account con questa email.');

    const salt = randomSalt();
    const passwordHash = await passwordDigest(salt, password, PASSWORD_ITERATIONS);
    const now = new Date().toISOString();
    const user = {
      id: newId(),
      firstName,
      lastName,
      email,
      city: String(input.city || '').trim(),
      salt,
      passwordHash,
      passwordIterations: PASSWORD_ITERATIONS,
      createdAt: now,
      updatedAt: now
    };
    list.push(user);
    writeJSON(USERS_KEY, list);
    writeJSON(SESSION_KEY, { userId: user.id, createdAt: now });
    rememberEmail(email);
    mergeGuestData(user.id);
    updateActiveData(data => ({ ...data, stats: { ...data.stats, lastAccess: now } }));
    schedulePush();
    notify();
    return publicUser(user);
  }

  async function login(emailValue, passwordValue) {
    const email = normalizeEmail(emailValue);
    const password = String(passwordValue || '');
    const user = users().find(item => item.email === email);
    if (!user) throw new Error('Email o password non corretti.');
    const candidate = await passwordDigest(user.salt, password, user.passwordIterations || PASSWORD_ITERATIONS);
    if (candidate !== user.passwordHash) throw new Error('Email o password non corretti.');
    const now = new Date().toISOString();
    writeJSON(SESSION_KEY, { userId: user.id, createdAt: now });
    rememberEmail(email);
    mergeGuestData(user.id);
    updateActiveData(data => ({ ...data, stats: { ...data.stats, lastAccess: now } }));
    schedulePush();
    notify();
    return publicUser(user);
  }

  function logout() {
    storage.removeItem(SESSION_KEY);
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    notify();
  }

  function updateProfile(patch) {
    const active = session();
    if (!active) throw new Error('Devi accedere per modificare il profilo.');
    const list = users();
    const index = list.findIndex(user => user.id === active.userId);
    if (index < 0) throw new Error('Profilo non trovato.');
    list[index] = {
      ...list[index],
      firstName: String(patch.firstName || list[index].firstName).trim(),
      lastName: String(patch.lastName || list[index].lastName).trim(),
      city: String(patch.city ?? list[index].city ?? '').trim(),
      updatedAt: new Date().toISOString()
    };
    writeJSON(USERS_KEY, list);
    schedulePush();
    notify();
    return publicUser(list[index]);
  }

  async function changePassword(currentPassword, nextPassword) {
    const active = session();
    if (!active) throw new Error('Devi accedere per modificare la password.');
    const current = String(currentPassword || '');
    const next = String(nextPassword || '');
    if (next.length < 8) throw new Error('La nuova password deve contenere almeno 8 caratteri.');
    if (current === next) throw new Error('La nuova password deve essere diversa da quella attuale.');
    const list = users();
    const index = list.findIndex(user => user.id === active.userId);
    if (index < 0) throw new Error('Profilo non trovato.');
    const user = list[index];
    const candidate = await passwordDigest(user.salt, current, user.passwordIterations || PASSWORD_ITERATIONS);
    if (candidate !== user.passwordHash) throw new Error('La password attuale non è corretta.');
    const salt = randomSalt();
    const passwordHash = await passwordDigest(salt, next, PASSWORD_ITERATIONS);
    list[index] = {
      ...user,
      salt,
      passwordHash,
      passwordIterations: PASSWORD_ITERATIONS,
      updatedAt: new Date().toISOString()
    };
    writeJSON(USERS_KEY, list);
    removePasswordReset(user.email);
    schedulePush();
    notify('password-change');
    return publicUser(list[index]);
  }

  async function requestPasswordReset(emailValue) {
    const email = normalizeEmail(emailValue);
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Inserisci un indirizzo email valido.');
    const now = Date.now();
    const resets = passwordResets();
    const pending = resets[email] && typeof resets[email] === 'object' ? resets[email] : null;
    const previousRequestedAt = resetRequestedAt(pending);
    if (pending && previousRequestedAt && now < previousRequestedAt + RESET_REQUEST_COOLDOWN_MS) {
      const waitSeconds = Math.max(1, Math.ceil((previousRequestedAt + RESET_REQUEST_COOLDOWN_MS - now) / 1000));
      throw new Error(`Attendi ${waitSeconds} secondi prima di richiedere un altro codice.`);
    }

    let windowStartedAt = pending ? Number(pending.requestWindowStartedAt) : 0;
    if (!Number.isFinite(windowStartedAt) || windowStartedAt <= 0) windowStartedAt = previousRequestedAt || now;
    let requestCount = pending ? Number(pending.requestCount) : 0;
    if (!Number.isFinite(requestCount) || requestCount < 0) requestCount = pending ? 1 : 0;
    if (now >= windowStartedAt + RESET_REQUEST_WINDOW_MS) {
      windowStartedAt = now;
      requestCount = 0;
    }
    if (requestCount >= RESET_MAX_REQUESTS_PER_WINDOW) {
      const waitMinutes = Math.max(1, Math.ceil((windowStartedAt + RESET_REQUEST_WINDOW_MS - now) / 60000));
      throw new Error(`Troppe richieste di recupero. Riprova tra ${waitMinutes} minuti.`);
    }

    const pendingExpiresAt = pending ? Number(pending.expiresAt) : 0;
    const preserveAttempts = pending && Number.isFinite(pendingExpiresAt) && now < pendingExpiresAt;
    const attempts = preserveAttempts ? Math.max(0, Number(pending.attempts) || 0) : 0;
    if (attempts >= RESET_MAX_ATTEMPTS) {
      const waitMinutes = Math.max(1, Math.ceil((pendingExpiresAt - now) / 60000));
      throw new Error(`Troppi tentativi di verifica. Riprova tra ${waitMinutes} minuti.`);
    }

    const user = users().find(item => item.email === email);
    const code = randomResetCode();
    const salt = randomSalt();
    const codeHash = await passwordDigest(salt, code, RESET_CODE_ITERATIONS);
    resets[email] = {
      salt,
      codeHash,
      iterations: RESET_CODE_ITERATIONS,
      expiresAt: now + RESET_TTL_MS,
      attempts,
      requestedAt: now,
      requestWindowStartedAt: windowStartedAt,
      requestCount: requestCount + 1,
      targetUserId: user ? user.id : null
    };
    writeJSON(RESET_KEY, resets);
    return { email, code, expiresMinutes: Math.round(RESET_TTL_MS / 60000) };
  }

  async function confirmPasswordReset(emailValue, codeValue, nextPassword) {
    const email = normalizeEmail(emailValue);
    const code = String(codeValue || '').trim();
    const next = String(nextPassword || '');
    if (!/^\d{6}$/.test(code)) throw new Error('Inserisci il codice di 6 cifre.');
    if (next.length < 8) throw new Error('La nuova password deve contenere almeno 8 caratteri.');
    const resets = passwordResets();
    const pending = resets[email];
    if (!pending || typeof pending !== 'object') throw new Error(RESET_INVALID_MESSAGE);
    if (Date.now() >= Number(pending.expiresAt || 0)) {
      delete resets[email];
      writeJSON(RESET_KEY, resets);
      throw new Error(RESET_INVALID_MESSAGE);
    }
    if (Number(pending.attempts || 0) >= RESET_MAX_ATTEMPTS) {
      throw new Error('Troppi tentativi di verifica. Attendi la scadenza della richiesta corrente.');
    }
    const candidate = await passwordDigest(pending.salt, code, pending.iterations || RESET_CODE_ITERATIONS);
    if (candidate !== pending.codeHash) {
      pending.attempts = Number(pending.attempts || 0) + 1;
      pending.lastAttemptAt = Date.now();
      resets[email] = pending;
      writeJSON(RESET_KEY, resets);
      if (pending.attempts >= RESET_MAX_ATTEMPTS) {
        throw new Error('Troppi tentativi di verifica. Attendi la scadenza della richiesta corrente.');
      }
      throw new Error(RESET_INVALID_MESSAGE);
    }
    const list = users();
    const hasBoundTarget = Object.prototype.hasOwnProperty.call(pending, 'targetUserId');
    const index = hasBoundTarget
      ? list.findIndex(user => pending.targetUserId && user.id === pending.targetUserId && user.email === email)
      : list.findIndex(user => user.email === email);
    if (index < 0) {
      delete resets[email];
      writeJSON(RESET_KEY, resets);
      throw new Error(RESET_INVALID_MESSAGE);
    }
    const salt = randomSalt();
    const passwordHash = await passwordDigest(salt, next, PASSWORD_ITERATIONS);
    list[index] = {
      ...list[index],
      salt,
      passwordHash,
      passwordIterations: PASSWORD_ITERATIONS,
      updatedAt: new Date().toISOString()
    };
    writeJSON(USERS_KEY, list);
    delete resets[email];
    writeJSON(RESET_KEY, resets);
    const active = session();
    if (active && active.userId === list[index].id) storage.removeItem(SESSION_KEY);
    notify('password-reset');
    return publicUser(list[index]);
  }

  function setRoute(route) {
    return updateActiveData(data => ({ ...data, route: Array.from(new Set(route || [])).slice(0, MAX_ROUTE_PLACES) }));
  }

  function setHomeBase(value) {
    if (!session()) throw new Error('Devi accedere per salvare la tua base.');
    const homeBase = normalizeHomeBase({ ...value, updatedAt: new Date().toISOString() });
    if (!homeBase) throw new Error('La posizione scelta per la base non è valida.');
    return updateActiveData(data => ({ ...data, homeBase }));
  }

  function clearHomeBase() {
    if (!session()) throw new Error('Devi accedere per rimuovere la tua base.');
    return updateActiveData(data => ({ ...data, homeBase: null }));
  }

  function recordCardOpen(placeId) {
    if (placeId === undefined || placeId === null) return activeData();
    return updateActiveData(data => ({
      ...data,
      recentlyViewed: [placeId, ...data.recentlyViewed.filter(id => id !== placeId)].slice(0, 20),
      stats: { ...data.stats, cardsOpened: Number(data.stats.cardsOpened || 0) + 1 }
    }));
  }

  function isFavoritePlace(placeId) {
    if (placeId === undefined || placeId === null) return false;
    return activeData().favoritePlaces.some(id => String(id) === String(placeId));
  }

  function toggleFavoritePlace(placeId) {
    if (placeId === undefined || placeId === null) return activeData();
    return updateActiveData(data => {
      const exists = data.favoritePlaces.some(id => String(id) === String(placeId));
      return {
        ...data,
        favoritePlaces: exists
          ? data.favoritePlaces.filter(id => String(id) !== String(placeId))
          : [placeId, ...data.favoritePlaces]
      };
    });
  }

  function isFavoritePerson(personId) {
    if (personId === undefined || personId === null) return false;
    return activeData().favoritePeople.some(id => String(id) === String(personId));
  }

  function toggleFavoritePerson(personId) {
    if (personId === undefined || personId === null) return activeData();
    return updateActiveData(data => {
      const exists = data.favoritePeople.some(id => String(id) === String(personId));
      return {
        ...data,
        favoritePeople: exists
          ? data.favoritePeople.filter(id => String(id) !== String(personId))
          : [personId, ...data.favoritePeople]
      };
    });
  }

  function migratePlaceReferences(resolver, version = 'catalog-v1') {
    if (typeof resolver !== 'function') throw new Error('Resolver del catalogo non valido.');
    const backupPrefix = `palinsesto_v9_backup_${String(version).replace(/[^a-zA-Z0-9_-]/g, '_')}_`;
    const normalizeReferences = values => {
      const result = [];
      for (const reference of Array.isArray(values) ? values : []) {
        const resolved = resolver(reference);
        const next = resolved || reference;
        if (next !== undefined && next !== null && !result.some(item => String(item) === String(next))) result.push(next);
      }
      return result;
    };
    const migrateKey = key => {
      const raw = readJSON(key, null);
      if (!raw || raw.catalogRefVersion === version) return false;
      const before = normalizeUserData(raw);
      const after = {
        ...before,
        route: normalizeReferences(before.route),
        favoritePlaces: normalizeReferences(before.favoritePlaces),
        recentlyViewed: normalizeReferences(before.recentlyViewed),
        favoriteRoutes: before.favoriteRoutes.map(item => item && typeof item === 'object'
          ? { ...item, places: normalizeReferences(item.places) }
          : item),
        catalogRefVersion: version
      };
      const backupKey = `${backupPrefix}${key}`;
      if (!storage.getItem(backupKey)) writeJSON(backupKey, raw);
      writeJSON(key, after);
      return true;
    };
    let migrated = 0;
    if (migrateKey(GUEST_DATA_KEY)) migrated += 1;
    for (const user of users()) if (migrateKey(dataKey(user.id))) migrated += 1;
    return { version, migrated };
  }

  global.WalkatlasAuth = Object.freeze({
    register,
    login,
    logout,
    currentUser,
    updateProfile,
    changePassword,
    requestPasswordReset,
    confirmPasswordReset,
    activeData,
    updateActiveData,
    setRoute,
    setHomeBase,
    clearHomeBase,
    recordCardOpen,
    isFavoritePlace,
    toggleFavoritePlace,
    isFavoritePerson,
    toggleFavoritePerson,
    migratePlaceReferences,
    isPersistent: () => persistent,
    ready: () => ready,
    lastEmail,
    demoCredentials: () => ({ email: DEMO_EMAIL, password: DEMO_PASSWORD })
  });
  global.PalinsestoAuth = global.WalkatlasAuth;
})(window);
