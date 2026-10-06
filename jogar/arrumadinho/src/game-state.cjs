// Fonte única do save entre visitas. O renderer só recebe dados primitivos já
// validados; bytes suspeitos ficam preservados no storage para exportação.
(function () {
  const GAME_SAVE_KEY = 'arrumadinho_game_v1';
  const GAME_SAVE_BACKUP_KEY = 'arrumadinho_game_v1_backup';
  const GAME_SAVE_VERSION = 1;
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  let lastRestoreStatus = { kind: 'absent', raw: null };

  function serializableGame(state) {
    return {
      version: GAME_SAVE_VERSION,
      scene: state.scene,
      cleaned: [...state.cleaned],
      catalog: [...state.catalog],
      inventory: [...state.inventory],
      placed: state.placed.map(item => ({ ...item })),
      visitors: [...state.visitors],
      playerSkin: state.playerSkin,
      playerName: state.playerName,
      criado: state.criado,
      animalNames: { ...state.animalNames },
      movedOut: [...state.movedOut]
    };
  }

  function ruleSet(rules) {
    return {
      scenes: new Set(Array.isArray(rules && rules.scenes) ? rules.scenes.filter(value => typeof value === 'string') : []),
      itemKeys: new Set(Array.isArray(rules && rules.itemKeys) ? rules.itemKeys.filter(value => typeof value === 'string') : []),
      visitorKeys: new Set(Array.isArray(rules && rules.visitorKeys) ? rules.visitorKeys.filter(value => typeof value === 'string') : []),
      ambientIds: new Set(Array.isArray(rules && rules.ambientIds) ? rules.ambientIds.filter(value => typeof value === 'string') : []),
      clutterIds: new Set(Array.isArray(rules && rules.clutterIds) ? rules.clutterIds.filter(Number.isInteger) : []),
      skins: new Set(Array.isArray(rules && rules.skins) ? rules.skins.filter(value => typeof value === 'string') : []),
      bounds: rules && rules.bounds && typeof rules.bounds === 'object' ? rules.bounds : {}
    };
  }

  function validArray(value) { return Array.isArray(value); }
  function knownString(value, allowed) { return typeof value === 'string' && (allowed.size === 0 || allowed.has(value)); }
  function withinBounds(scene, x, y, rules) {
    const bound = rules.bounds[scene];
    if (!bound && Object.keys(rules.bounds).length === 0) return Number.isFinite(x) && Number.isFinite(y);
    return Number.isFinite(x) && Number.isFinite(y) && bound &&
      Number.isFinite(bound.x0) && Number.isFinite(bound.x1) && Number.isFinite(bound.y0) && Number.isFinite(bound.y1) &&
      x >= bound.x0 && x <= bound.x1 && y >= bound.y0 && y <= bound.y1;
  }

  // Estrutura quebrada invalida o save inteiro; lixo dentro de arrays válidos é
  // filtrado elemento a elemento para não perder o restante da casa.
  function sanitizeSavedGame(saved, suppliedRules) {
    const rules = ruleSet(suppliedRules);
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return null;
    if (!own(saved, 'version') || !Number.isInteger(saved.version) || saved.version !== GAME_SAVE_VERSION) return null;
    const required = ['cleaned', 'catalog', 'inventory', 'placed', 'visitors', 'movedOut'];
    if (required.some(key => !own(saved, key) || !validArray(saved[key]))) return null;

    const scene = knownString(saved.scene, rules.scenes) ? saved.scene : 'jardim';
    const cleaned = saved.cleaned.filter(id => Number.isInteger(id) && (rules.clutterIds.size === 0 || rules.clutterIds.has(id)));
    const catalog = saved.catalog.filter(key => knownString(key, rules.itemKeys));
    const inventory = saved.inventory.filter(key => knownString(key, rules.itemKeys));
    const visitors = saved.visitors.filter(key => knownString(key, rules.visitorKeys));
    const movedOut = saved.movedOut.filter(id => knownString(id, rules.ambientIds));
    const placed = saved.placed.filter(item => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
      return own(item, 'itemKey') && own(item, 'scene') && own(item, 'x') && own(item, 'y') &&
        knownString(item.itemKey, rules.itemKeys) && knownString(item.scene, rules.scenes) &&
        withinBounds(item.scene, item.x, item.y, rules);
    }).map(item => ({
      itemKey: item.itemKey,
      scene: item.scene,
      x: item.x,
      y: item.y,
      scale: Number.isFinite(item.scale) ? Math.min(1.8, Math.max(0.6, item.scale)) : 1,
      ...(typeof item.id === 'string' && item.id ? { id: item.id } : {})
    }));

    const animalNames = {};
    if (own(saved, 'animalNames') && saved.animalNames && typeof saved.animalNames === 'object' && !Array.isArray(saved.animalNames)) {
      Object.keys(saved.animalNames).forEach(key => {
        const value = saved.animalNames[key];
        if (knownString(key, rules.visitorKeys) && typeof value === 'string') animalNames[key] = value;
      });
    }

    return {
      version: GAME_SAVE_VERSION, scene, cleaned, catalog, inventory, placed, visitors,
      playerSkin: knownString(saved.playerSkin, rules.skins) ? saved.playerSkin : null,
      playerName: typeof saved.playerName === 'string' ? saved.playerName : null,
      criado: saved.criado === true, animalNames, movedOut,
      selectedItem: null, showingBefore: false, radioPlaying: false, radioStation: 0
    };
  }

  function parseAndSanitize(raw, rules) {
    if (typeof raw !== 'string') return { game: null, reason: 'missing' };
    let parsed;
    try { parsed = JSON.parse(raw); } catch (_) { return { game: null, reason: 'invalid-json' }; }
    if (parsed && typeof parsed === 'object' && Number.isInteger(parsed.version) && parsed.version > GAME_SAVE_VERSION) {
      return { game: null, reason: 'future-version' };
    }
    const game = sanitizeSavedGame(parsed, rules);
    return game ? { game, reason: 'valid' } : { game: null, reason: 'invalid-shape' };
  }

  function persistGame(state, suppliedRules) {
    let encoded;
    try { encoded = JSON.stringify(serializableGame(state)); } catch (_) { return { ok: false, reason: 'serialize-failed' }; }
    try {
      const current = localStorage.getItem(GAME_SAVE_KEY);
      const inspected = parseAndSanitize(current, suppliedRules);
      if (inspected.game) localStorage.setItem(GAME_SAVE_BACKUP_KEY, current);
      localStorage.setItem(GAME_SAVE_KEY, encoded);
      return { ok: true };
    } catch (_) {
      return { ok: false, reason: 'write-failed' };
    }
  }

  function restoreGame(suppliedRules) {
    let primary;
    try { primary = localStorage.getItem(GAME_SAVE_KEY); } catch (_) {
      lastRestoreStatus = { kind: 'storage-unavailable', raw: null };
      return null;
    }
    const inspected = parseAndSanitize(primary, suppliedRules);
    if (inspected.game) {
      lastRestoreStatus = { kind: 'primary', raw: primary };
      return inspected.game;
    }
    if (primary === null) {
      lastRestoreStatus = { kind: 'absent', raw: null };
      return null;
    }
    let backup;
    try { backup = localStorage.getItem(GAME_SAVE_BACKUP_KEY); } catch (_) { backup = null; }
    const recovered = parseAndSanitize(backup, suppliedRules);
    if (recovered.game) {
      lastRestoreStatus = { kind: 'backup', reason: inspected.reason, raw: primary };
      return recovered.game;
    }
    lastRestoreStatus = { kind: 'unreadable', reason: inspected.reason, raw: primary };
    return null;
  }

  function getLastRestoreStatus() { return { ...lastRestoreStatus }; }
  function clearGame() {
    try { localStorage.removeItem(GAME_SAVE_KEY); localStorage.removeItem(GAME_SAVE_BACKUP_KEY); return { ok: true }; }
    catch (_) { return { ok: false, reason: 'write-failed' }; }
  }

  const api = { GAME_SAVE_KEY, GAME_SAVE_BACKUP_KEY, GAME_SAVE_VERSION, serializableGame, persistGame, restoreGame, sanitizeSavedGame, getLastRestoreStatus, clearGame };
  if (typeof window !== 'undefined') window.ArrumadinhoGameState = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
