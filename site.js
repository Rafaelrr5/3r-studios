// 3R Studios, every page: saved Ajustes (theme, motion, text size, contrast, underline), the Ajustes
// dialog, header state, section highlight, jump buttons, scroll reveals and the home's timeline/parallax.
// Settings live only in this browser (localStorage "3r-prefs"). Each language is its own page
// (/, /en/, /es/, /fr/); the dialog's words follow the page's <html lang> and it repeats the language links.
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
    if (prefs.contrast) root.dataset.contrast = 'high'; else delete root.dataset.contrast;
    if (prefs.underline) root.dataset.underline = 'on'; else delete root.dataset.underline;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); localStorage.setItem('3r-theme-v2', '1'); } catch (e) { /* private mode: settings last this visit */ }
  }
  apply();
  // Libras (Brazilian Sign Language) via VLibras, the federal government's free widget: loaded only when
  // the visitor turns it on in Ajustes, and only on pt-BR pages (it translates Portuguese text).
  const PT = root.lang === 'pt-BR';
  function libras() {
    if (document.querySelector('[vw]')) return;
    const w = document.createElement('div');
    w.setAttribute('vw', ''); w.className = 'enabled';
    w.innerHTML = '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
    document.body.append(w);
    const s = document.createElement('script');
    s.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    s.onload = () => { new window.VLibras.Widget('https://vlibras.gov.br/app'); if (document.readyState === 'complete') dispatchEvent(new Event('load')); };
    document.body.append(s);
  }
  if (PT && prefs.libras) addEventListener('DOMContentLoaded', libras);
  const still = () => prefs.motion === 'reduce' || (prefs.motion !== 'full' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  root.classList.add('js');
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('ready')));

  // Ajustes dialog, built here so every page gets the same one.
  const gear = document.getElementById('gear');
  if (gear && window.HTMLDialogElement) {
    const W = {
      'pt-BR': ['Ajustes', 'Fechar ajustes', 'Idioma', 'Tema', 'Claro', 'Escuro', 'Automático', 'Animações', 'Do aparelho', 'Reduzidas', 'Completas', 'Tamanho do texto', 'Normal', 'Maior', 'Muito maior', 'Alto contraste', 'Sublinhar links', 'Restaurar padrão'],
      en: ['Settings', 'Close settings', 'Language', 'Theme', 'Light', 'Dark', 'Automatic', 'Animations', 'Device setting', 'Reduced', 'Full', 'Text size', 'Normal', 'Larger', 'Largest', 'High contrast', 'Underline links', 'Reset to default'],
      es: ['Ajustes', 'Cerrar ajustes', 'Idioma', 'Tema', 'Claro', 'Oscuro', 'Automático', 'Animaciones', 'Del dispositivo', 'Reducidas', 'Completas', 'Tamaño del texto', 'Normal', 'Más grande', 'Mucho más grande', 'Alto contraste', 'Subrayar enlaces', 'Restablecer'],
      fr: ['Réglages', 'Fermer les réglages', 'Langue', 'Thème', 'Clair', 'Sombre', 'Automatique', 'Animations', 'Celles de l’appareil', 'Réduites', 'Complètes', 'Taille du texte', 'Normale', 'Plus grande', 'Très grande', 'Contraste élevé', 'Souligner les liens', 'Rétablir par défaut'],
    };
    const [tTitle, tClose, tLang, tTheme, tLight, tDark, tAuto, tMotion, tDevice, tReduce, tFull, tText, tNormal, tBig, tBigger, tContrast, tUnderline, tReset] = W[root.lang] || W['pt-BR'];
    const seg = (name, label, opts) => `<fieldset><legend>${label}</legend><div class="seg">${opts.map(([v, t]) =>
      `<label><input type="radio" name="${name}" value="${v}"><span>${t}</span></label>`).join('')}</div></fieldset>`;
    const langs = document.querySelector('.hd .langs');
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
${PT ? '<label class="tog">Tradutor de Libras (VLibras) <input type="checkbox" name="libras"></label>' : ''}
<button class="reset" type="button">${tReset}</button></form>`;
    document.body.appendChild(dlg);
    const form = dlg.querySelector('form');
    const sync = () => {
      for (const n of ['theme', 'motion', 'text']) { const r = form.querySelector(`[name="${n}"][value="${prefs[n]}"]`); if (r) r.checked = true; }
      form.contrast.checked = !!prefs.contrast; form.underline.checked = !!prefs.underline;
      if (form.libras) form.libras.checked = !!prefs.libras;
    };
    form.addEventListener('change', () => {
      const f = new FormData(form);
      const was = prefs.libras;
      prefs = { theme: f.get('theme'), motion: f.get('motion'), text: f.get('text'), contrast: form.contrast.checked, underline: form.underline.checked,
        libras: form.libras ? form.libras.checked : prefs.libras };
      apply(); save();
      if (PT && prefs.libras && !was) libras();
      if (PT && was && !prefs.libras) location.reload(); // the widget has no clean unload
    });
    dlg.querySelector('.reset').addEventListener('click', () => {
      const was = prefs.libras;
      prefs = Object.assign({}, DEFAULTS); apply(); save(); sync();
      if (PT && was) location.reload();
    });
    gear.addEventListener('click', () => { sync(); dlg.showModal(); });
    dlg.querySelector('.x').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  }

  // Testimonial carousel arrows (rendered only with 2+ testimonials).
  document.querySelectorAll('[data-car]').forEach(b => b.addEventListener('click', () => {
    const t = b.closest('.tst').querySelector('.track'); t.scrollBy({ left: t.clientWidth * +b.dataset.car, behavior: still() ? 'auto' : 'smooth' });
  }));
  document.querySelectorAll('[data-i]').forEach(el => el.style.setProperty('--i', el.dataset.i));
  document.querySelectorAll('[data-d]').forEach(el => el.style.setProperty('--d', el.dataset.d));
  document.querySelectorAll('.end h2 .wd').forEach((el, i) => el.style.setProperty('--i', i));

  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
  }), { threshold: .05, rootMargin: '0px 0px -4% 0px' }) : null;
  document.querySelectorAll('.rv, .end h2').forEach(el => io ? io.observe(el) : el.classList.add('in-view'));

  const hd = document.querySelector('.hd');
  const items = [...document.querySelectorAll('[data-focus]')];
  const lines = [...document.querySelectorAll('.ln')];
  const links = [...document.querySelectorAll('.hd nav a[href*="#"]')].filter(a => a.pathname === location.pathname);
  const secs = links.map(a => document.getElementById(a.hash.slice(1)));
  const up = document.querySelector('.jump .up'), down = document.querySelector('.jump .down');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

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
  frame();

  const show = document.querySelector('.show');
  if (show && matchMedia('(pointer: fine)').matches) {
    const fs = [...show.querySelectorAll('.f')];
    addEventListener('pointermove', e => {
      if (still()) return;
      const x = e.clientX / innerWidth - .5, yy = e.clientY / innerHeight - .5;
      fs.forEach((f, i) => { const k = (i + 1) * 9; f.style.transform = `translate(${(-x * k).toFixed(1)}px, ${(-yy * k).toFixed(1)}px)`; });
    }, { passive: true });
  }
}());
