// 3R Studios, every page: saved Ajustes (theme, motion, text size, contrast, underline, Libras), the
// Ajustes dialog, header state, section highlight, jump buttons, scroll reveals and the home's timeline/parallax.
// Settings live only in this browser (localStorage "3r-prefs"). Each language is its own page
// (/, /en/, /es/, /fr/); switching language swaps the page content in place (same scroll spot, no reload)
// and the address changes with it, so links, Back and search engines still see real pages.
(function () {
  const root = document.documentElement;
  const KEY = '3r-prefs';
  const DEFAULTS = { theme: 'light', motion: 'auto', text: '1', contrast: false, underline: false, libras: false };
  let prefs = {};
  try { prefs = Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { prefs = Object.assign({}, DEFAULTS); }
  if (prefs.theme === 'auto' && !localStorage.getItem('3r-theme-v2')) prefs.theme = 'light'; // old default was "auto"

  function apply() {
    root.dataset.theme = prefs.theme;
    root.dataset.motion = prefs.motion;
    root.style.setProperty('--scale', prefs.text);
    root.dataset.text = prefs.text;
    if (prefs.contrast) root.dataset.contrast = 'high'; else delete root.dataset.contrast;
    if (prefs.underline) root.dataset.underline = 'on'; else delete root.dataset.underline;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); localStorage.setItem('3r-theme-v2', '1'); } catch (e) { /* private mode: settings last this visit */ }
  }
  apply();
  const still = () => prefs.motion === 'reduce' || (prefs.motion !== 'full' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const isPT = () => root.lang === 'pt-BR';
  root.classList.add('js');
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('ready')));

  // Libras (Brazilian Sign Language) via VLibras, the federal government's free widget: loaded only when
  // the visitor turns it on in Ajustes, and only on pt-BR pages (it translates Portuguese text).
  // Turning it off removes the widget from the page; turning it on again reuses the loaded script.
  function libras(on) {
    const w0 = document.querySelector('[vw]');
    if (!on) { if (w0) w0.remove(); return; }
    if (w0) return;
    const w = document.createElement('div');
    w.setAttribute('vw', ''); w.className = 'enabled';
    w.innerHTML = '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
    document.body.append(w);
    const start = () => { new window.VLibras.Widget('https://vlibras.gov.br/app'); if (document.readyState === 'complete') dispatchEvent(new Event('load')); };
    if (window.VLibras) { start(); return; }
    const s = document.createElement('script');
    s.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    s.onload = start;
    document.body.append(s);
  }

  // Colours change with a short blend of the components, not a flash of the whole page.
  function blend(change) {
    if (still()) { change(); return; }
    root.classList.add('swap');
    change();
    clearTimeout(blend.t); blend.t = setTimeout(() => root.classList.remove('swap'), 320);
  }
  // Section snapping (desktop home) would re-align the page after a text-size or language change and
  // move what you were reading. It pauses until your next scroll gesture, which snaps as usual.
  function holdSnap() {
    if (root.classList.contains('free')) return;
    root.classList.add('free');
    const release = () => { root.classList.remove('free'); for (const t of ['wheel', 'touchstart', 'keydown']) removeEventListener(t, release, true); };
    for (const t of ['wheel', 'touchstart', 'keydown']) addEventListener(t, release, { capture: true, passive: true });
  }
  // A text-size change keeps the line you were reading where it was, instead of jumping. The anchor is
  // taken when Ajustes opens, because the open dialog covers the page for hit-testing.
  let mark = null;
  function findAnchor() {
    const hdH = (document.querySelector('.hd') || { offsetHeight: 0 }).offsetHeight;
    for (let y = hdH + 12; y < innerHeight * .7; y += 40) for (const x of [.5, .3, .7, .15, .85]) {
      const at = document.elementsFromPoint(innerWidth * x, y).find(e => !e.closest('dialog, .hd') && /^(H[1-4]|P|LI|IMG|A|BLOCKQUOTE|FIGURE|B|SUMMARY)$/.test(e.tagName));
      if (at) return at;
    }
    return null;
  }
  function keepPlace(change) {
    holdSnap();
    const at = (mark && mark.isConnected) ? mark : findAnchor();
    const before = at && at.getBoundingClientRect().top;
    change();
    if (at) scrollTo({ top: scrollY + at.getBoundingClientRect().top - before, behavior: 'instant' });
  }

  const W = {
    'pt-BR': ['Ajustes', 'Fechar ajustes', 'Idioma', 'Tema', 'Claro', 'Escuro', 'Automático', 'Animações', 'Do aparelho', 'Reduzidas', 'Completas', 'Tamanho do texto', 'Normal', 'Maior', 'Muito maior', 'Alto contraste', 'Sublinhar links', 'Restaurar padrão'],
    en: ['Settings', 'Close settings', 'Language', 'Theme', 'Light', 'Dark', 'Automatic', 'Animations', 'Device setting', 'Reduced', 'Full', 'Text size', 'Normal', 'Larger', 'Largest', 'High contrast', 'Underline links', 'Reset to default'],
    es: ['Ajustes', 'Cerrar ajustes', 'Idioma', 'Tema', 'Claro', 'Oscuro', 'Automático', 'Animaciones', 'Del dispositivo', 'Reducidas', 'Completas', 'Tamaño del texto', 'Normal', 'Más grande', 'Mucho más grande', 'Alto contraste', 'Subrayar enlaces', 'Restablecer'],
    fr: ['Réglages', 'Fermer les réglages', 'Langue', 'Thème', 'Clair', 'Sombre', 'Automatique', 'Animations', 'Celles de l’appareil', 'Réduites', 'Complètes', 'Taille du texte', 'Normale', 'Plus grande', 'Très grande', 'Contraste élevé', 'Souligner les liens', 'Rétablir par défaut'],
  };

  // Ajustes dialog, built here so every page (and every language) gets the same one.
  function buildDialog() {
    const gear = document.getElementById('gear');
    if (!gear || !window.HTMLDialogElement) return;
    const [tTitle, tClose, tLang, tTheme, tLight, tDark, tAuto, tMotion, tDevice, tReduce, tFull, tText, tNormal, tBig, tBigger, tContrast, tUnderline, tReset] = W[root.lang] || W['pt-BR'];
    const seg = (name, label, opts) => `<fieldset><legend>${label}</legend><div class="seg">${opts.map(([v, t]) =>
      `<label><input type="radio" name="${name}" value="${v}"><span>${t}</span></label>`).join('')}</div></fieldset>`;
    const langs = document.querySelector('.hd .langs');
    const old = document.getElementById('prefs'); if (old) old.remove();
    const dlg = document.createElement('dialog');
    dlg.className = 'prefs'; dlg.id = 'prefs'; dlg.setAttribute('aria-labelledby', 'prefs-h');
    dlg.innerHTML = `<div class="pfh"><h2 id="prefs-h">${tTitle}</h2><button class="x" type="button" aria-label="${tClose}"><span aria-hidden="true">×</span></button></div>
<form>${langs ? `<fieldset class="lg"><legend>${tLang}</legend><div class="seg">${[...langs.querySelectorAll('a')].map(a =>
      `<a href="${a.getAttribute('href')}" hreflang="${a.hreflang}" lang="${a.lang}"${a.hasAttribute('aria-current') ? ' aria-current="true"' : ''}>${a.querySelector('.sr').textContent}</a>`).join('')}</div></fieldset>` : ''}
${seg('theme', tTheme, [['light', tLight], ['dark', tDark], ['auto', tAuto]])}
${seg('motion', tMotion, [['auto', tDevice], ['reduce', tReduce], ['full', tFull]])}
${seg('text', tText, [['1', tNormal], ['1.15', tBig], ['1.3', tBigger]])}
<label class="tog">${tContrast} <input type="checkbox" name="contrast"></label>
<label class="tog">${tUnderline} <input type="checkbox" name="underline"></label>
${isPT() ? '<label class="tog">Tradutor de Libras (VLibras) <input type="checkbox" name="libras"></label>' : ''}
<button class="reset" type="button">${tReset}</button></form>`;
    document.body.appendChild(dlg);
    const form = dlg.querySelector('form');
    const sync = () => {
      for (const n of ['theme', 'motion', 'text']) { const r = form.querySelector(`[name="${n}"][value="${prefs[n]}"]`); if (r) r.checked = true; }
      form.contrast.checked = !!prefs.contrast; form.underline.checked = !!prefs.underline;
      if (form.libras) form.libras.checked = !!prefs.libras;
    };
    const set = (next) => {
      const textChanged = next.text !== prefs.text;
      prefs = next;
      if (textChanged) keepPlace(apply); else blend(apply);
      save();
      if (isPT()) libras(prefs.libras);
    };
    form.addEventListener('change', () => {
      const f = new FormData(form);
      set({ theme: f.get('theme'), motion: f.get('motion'), text: f.get('text'), contrast: form.contrast.checked, underline: form.underline.checked,
        libras: form.libras ? form.libras.checked : prefs.libras });
    });
    dlg.querySelector('.reset').addEventListener('click', () => { set(Object.assign({}, DEFAULTS)); sync(); });
    gear.addEventListener('click', () => { mark = findAnchor(); sync(); dlg.showModal(); });
    dlg.querySelector('.x').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  }

  // Everything below is bound to the current page content and rebuilt after a language swap.
  let hd, items = [], lines = [], links = [], secs = [], up, down, fs = [], io;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function init() {
    buildDialog();
    if (isPT() && prefs.libras) libras(true);
    // Testimonial carousel arrows (rendered only with 2+ testimonials).
    document.querySelectorAll('[data-car]').forEach(b => b.addEventListener('click', () => {
      const t = b.closest('.tst').querySelector('.track'); t.scrollBy({ left: t.clientWidth * +b.dataset.car, behavior: still() ? 'auto' : 'smooth' });
    }));
    document.querySelectorAll('[data-i]').forEach(el => el.style.setProperty('--i', el.dataset.i));
    document.querySelectorAll('[data-d]').forEach(el => el.style.setProperty('--d', el.dataset.d));
    document.querySelectorAll('.end h2 .wd').forEach((el, i) => el.style.setProperty('--i', i));
    if (io) io.disconnect();
    io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
    }), { threshold: .05, rootMargin: '0px 0px -4% 0px' }) : null;
    document.querySelectorAll('.rv, .end h2').forEach(el => io ? io.observe(el) : el.classList.add('in-view'));
    hd = document.querySelector('.hd');
    items = [...document.querySelectorAll('[data-focus]')];
    lines = [...document.querySelectorAll('.ln')];
    links = [...document.querySelectorAll('.hd nav a[href*="#"]')].filter(a => a.pathname === location.pathname);
    secs = links.map(a => document.getElementById(a.hash.slice(1)));
    up = document.querySelector('.jump .up'); down = document.querySelector('.jump .down');
    const show = document.querySelector('.show');
    fs = show && matchMedia('(pointer: fine)').matches ? [...show.querySelectorAll('.f')] : [];
    frame();
  }

  function frame() {
    const vh = innerHeight, y = scrollY, max = root.scrollHeight - vh;
    if (hd) hd.classList.toggle('sc', y > 10);
    if (up) up.classList.toggle('off', y < vh * .5);
    if (down) down.classList.toggle('off', y > max - vh * .5);
    if (!still()) {
      items.forEach(el => { const r = el.getBoundingClientRect();
        const d = clamp(Math.abs(r.top + r.height / 2 - vh / 2) / (vh * .6), 0, 1);
        el.style.setProperty('--d', d.toFixed(3)); el.classList.toggle('on', d < .35); });
      lines.forEach(l => { const r = l.parentElement.getBoundingClientRect(); l.style.setProperty('--p', clamp((vh / 2 - r.top) / r.height, 0, 1).toFixed(3)); });
    } else { items.forEach(el => { el.style.setProperty('--d', 0); el.classList.add('on'); }); lines.forEach(l => l.style.setProperty('--p', 1)); }
    let cur = -1; secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < vh * .5) cur = i; });
    links.forEach((a, i) => a.classList.toggle('on', i === cur));
  }
  addEventListener('scroll', () => requestAnimationFrame(frame), { passive: true });
  addEventListener('resize', frame);
  addEventListener('pointermove', e => {
    if (still() || !fs.length) return;
    const x = e.clientX / innerWidth - .5, yy = e.clientY / innerHeight - .5;
    fs.forEach((f, i) => { const k = (i + 1) * 9; f.style.transform = `translate(${(-x * k).toFixed(1)}px, ${(-yy * k).toFixed(1)}px)`; });
  }, { passive: true });

  // Language switch without a reload: fetch the same page in the other language, swap the body and
  // keep the reader on the same section. Pages with their own scripts (apps list, downloads) and any
  // failure fall back to a normal page load.
  const SOLO = 'script[src*="projects.js"], script[src*="use.js"]';
  let shownPath = location.pathname;
  async function swapTo(url, push) {
    if (document.querySelector(SOLO)) { location.assign(url); return; }
    const hdH = hd ? hd.offsetHeight : 0;
    // The section nearest the top of the screen (above or below the header) is the one to keep in view.
    const spot = [...document.querySelectorAll('main [id]')].reduce((best, e) => {
      const d = Math.abs(e.getBoundingClientRect().top - hdH); return !best || d < best.d ? { e, d } : best; }, null)?.e;
    const offset = spot ? spot.getBoundingClientRect().top : 0, atTop = scrollY < 4;
    let doc;
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      doc = new DOMParser().parseFromString(await r.text(), 'text/html');
      if (doc.querySelector(SOLO) || !doc.querySelector('.hd .langs')) throw new Error('needs a full load');
    } catch (e) { location.assign(url); return; }
    const dlg = document.getElementById('prefs'); const fromDialog = !!(dlg && dlg.open); if (fromDialog) dlg.close();
    const swap = () => {
      holdSnap();
      if (push) history.pushState(null, '', url);
      shownPath = location.pathname;
      root.lang = doc.documentElement.lang;
      document.title = doc.title;
      for (const sel of ['meta[name="description"]', 'link[rel="canonical"]']) {
        const a = document.head.querySelector(sel), b = doc.head.querySelector(sel); if (a && b) a.replaceWith(b.cloneNode());
      }
      const keep = [...document.body.children].filter(e => e.matches('[vw], script'));
      const fresh = [...doc.body.childNodes].filter(n => n.nodeName !== 'SCRIPT').map(n => document.importNode(n, true));
      document.body.replaceChildren(...fresh, ...keep);
      if (!isPT()) libras(false);
      init();
      const same = spot && document.getElementById(spot.id);
      if (atTop) scrollTo(0, 0); else if (same) scrollBy(0, same.getBoundingClientRect().top - offset);
      // Content already on screen shows at once instead of replaying its entrance.
      document.querySelectorAll('.rv, .end h2').forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in-view'); });
      frame();
    };
    if (document.startViewTransition && !still()) await document.startViewTransition(swap).updateCallbackDone; else swap();
    const target = document.querySelector('.hd .langs a[aria-current]');
    (fromDialog || !target || !target.offsetParent ? document.getElementById('gear') : target).focus({ preventScroll: true });
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('.langs a[hreflang], #prefs .lg a[hreflang]');
    if (!a || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (!a.hasAttribute('aria-current')) swapTo(a.href, true);
  });
  // Back/Forward between languages swaps again; in-page anchor jumps keep the same path and are left alone.
  addEventListener('popstate', () => { if (location.pathname !== shownPath) swapTo(location.href, false); });

  init();
}());
