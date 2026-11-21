// 3R Studios, every page: saved Ajustes (theme, motion, text size, contrast, underline), the Ajustes
// dialog, header state, section highlight, jump buttons, scroll reveals and the home's timeline/parallax.
// Settings live only in this browser (localStorage "3r-prefs"); the text stays in pt-BR.
(function () {
  const root = document.documentElement;
  const KEY = '3r-prefs';
  const DEFAULTS = { theme: 'light', motion: 'auto', text: '1', contrast: false, underline: false };
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
  const still = () => prefs.motion === 'reduce' || (prefs.motion !== 'full' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  root.classList.add('js');
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('ready')));

  // Ajustes dialog, built here so every page gets the same one.
  const gear = document.getElementById('gear');
  if (gear && window.HTMLDialogElement) {
    const seg = (name, label, opts) => `<fieldset><legend>${label}</legend><div class="seg">${opts.map(([v, t]) =>
      `<label><input type="radio" name="${name}" value="${v}"><span>${t}</span></label>`).join('')}</div></fieldset>`;
    const dlg = document.createElement('dialog');
    dlg.className = 'prefs'; dlg.id = 'prefs'; dlg.setAttribute('aria-labelledby', 'prefs-h');
    dlg.innerHTML = `<div class="ph"><h2 id="prefs-h">Ajustes</h2><button class="x" type="button" aria-label="Fechar ajustes"><span aria-hidden="true">×</span></button></div>
<form>${seg('theme', 'Tema', [['light', 'Claro'], ['dark', 'Escuro'], ['auto', 'Automático']])}
${seg('motion', 'Animações', [['auto', 'Do aparelho'], ['reduce', 'Reduzidas'], ['full', 'Completas']])}
${seg('text', 'Tamanho do texto', [['1', 'Normal'], ['1.15', 'Maior'], ['1.3', 'Muito maior']])}
<label class="tog">Alto contraste <input type="checkbox" name="contrast"></label>
<label class="tog">Sublinhar links <input type="checkbox" name="underline"></label></form>`;
    document.body.appendChild(dlg);
    const form = dlg.querySelector('form');
    const sync = () => {
      for (const n of ['theme', 'motion', 'text']) { const r = form.querySelector(`[name="${n}"][value="${prefs[n]}"]`); if (r) r.checked = true; }
      form.contrast.checked = !!prefs.contrast; form.underline.checked = !!prefs.underline;
    };
    form.addEventListener('change', () => {
      const f = new FormData(form);
      prefs = { theme: f.get('theme'), motion: f.get('motion'), text: f.get('text'), contrast: form.contrast.checked, underline: form.underline.checked };
      apply(); save();
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
