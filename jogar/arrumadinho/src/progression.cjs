(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ArrumadinhoProgression = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const STORAGE_KEY = 'arrumadinho_progression_v1';

  function create(saved) {
    const source = saved && typeof saved === 'object' ? saved : {};
    return {
      eventHistory: Array.isArray(source.eventHistory) ? source.eventHistory.slice(-12) : [],
      ending: source.ending === 'continued' || source.ending === 'skipped' ? source.ending : null,
      endingOffered: source.endingOffered === true,
      payoffHeard: source.payoffHeard === true
    };
  }

  function addEvent(state, event) {
    if (!event || typeof event.title !== 'string' || typeof event.description !== 'string') return;
    state.eventHistory = state.eventHistory.concat({
      title: event.title,
      description: event.description,
      kind: typeof event.kind === 'string' ? event.kind : 'discovery'
    }).slice(-12);
  }

  function visitorReady(visitor, placed) {
    const items = Array.isArray(placed) ? placed : [];
    const inScene = key => items.some(item => item && item.itemKey === key && item.scene === visitor.scene);
    if (visitor.key === 'sapo') return inScene('banco');
    if (visitor.key === 'gato') return inScene('foto') && inScene('vaso');
    return false;
  }

  function visitorDescription(visitor) {
    if (visitor.key === 'sapo') return 'O sapinho veio porque o banco está no jardim — ele encontrou um lugar para descansar.';
    if (visitor.key === 'gato') return 'O gato entrou na sala porque a fotografia e o vaso ficaram juntos ali — reconheceu o cantinho.';
    return 'Este visitante ainda está procurando um cantinho que combine com ele.';
  }

  function coreComplete(cleaned, clutter) {
    const ids = new Set(Array.isArray(cleaned) ? cleaned : []);
    return Array.isArray(clutter) && clutter.length > 0 && clutter.every(item => ids.has(item.id));
  }

  function save(state, storage) {
    try {
      (storage || (typeof localStorage !== 'undefined' ? localStorage : null)).setItem(STORAGE_KEY, JSON.stringify(create(state)));
      return true;
    } catch (_) { return false; }
  }

  function restore(storage) {
    try {
      const raw = (storage || (typeof localStorage !== 'undefined' ? localStorage : null)).getItem(STORAGE_KEY);
      return raw ? create(JSON.parse(raw)) : create();
    } catch (_) { return create(); }
  }

  return { STORAGE_KEY, create, addEvent, visitorReady, visitorDescription, coreComplete, save, restore };
});
