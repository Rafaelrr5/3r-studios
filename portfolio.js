// Portfolio page: entrance, scroll reveals, timeline focus, header state, scrollspy, jump buttons.
(function () {
  const root = document.documentElement;
  let prefs = {};
  try { prefs = JSON.parse(localStorage.getItem('3r-prefs') || '{}'); } catch (e) { /* private mode */ }
  const still = prefs.motion === 'reduce' || (prefs.motion !== 'full' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (still) root.classList.add('still');
  root.classList.add('js', 'snap');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('ready')));

  document.querySelectorAll('[data-i]').forEach(el => el.style.setProperty('--i', el.dataset.i));
  document.querySelectorAll('[data-d]').forEach(el => el.style.setProperty('--d', el.dataset.d));
  document.querySelectorAll('.end h2 .wd').forEach((el, i) => el.style.setProperty('--i', i));

  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } }), { threshold: .05, rootMargin: '0px 0px -4% 0px' });
  document.querySelectorAll('.rv, .end h2, .end .hl').forEach(el => io.observe(el));

  const hd = document.querySelector('.hd');
  const items = [...document.querySelectorAll('[data-focus]')];
  const lines = [...document.querySelectorAll('.ln')];
  const links = [...document.querySelectorAll('.hd nav a[href^="#"]')];
  const secs = links.map(a => document.querySelector(a.getAttribute('href')));
  const up = document.querySelector('.jump .up'), down = document.querySelector('.jump .down');
  const show = document.querySelector('.show');

  function frame() {
    const vh = innerHeight, y = scrollY, max = root.scrollHeight - vh;
    hd.classList.toggle('sc', y > 10);
    up.classList.toggle('off', y < vh * .5);
    down.classList.toggle('off', y > max - vh * .5);
    if (!still) {
      items.forEach(el => { const r = el.getBoundingClientRect();
        const d = clamp(Math.abs(r.top + r.height / 2 - vh / 2) / (vh * .6), 0, 1);
        el.style.setProperty('--d', d.toFixed(3)); el.classList.toggle('on', d < .35); });
      lines.forEach(l => { const r = l.parentElement.getBoundingClientRect(); l.style.setProperty('--p', clamp((vh / 2 - r.top) / r.height, 0, 1).toFixed(3)); });
    } else items.forEach(el => el.classList.add('on'));
    let cur = -1; secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < vh * .5) cur = i; });
    links.forEach((a, i) => a.classList.toggle('on', i === cur));
  }
  addEventListener('scroll', () => requestAnimationFrame(frame), { passive: true });
  addEventListener('resize', frame);
  frame();

  if (show && !still && matchMedia('(pointer: fine)').matches) {
    const fs = [...show.querySelectorAll('.f')];
    addEventListener('pointermove', e => {
      const x = e.clientX / innerWidth - .5, yy = e.clientY / innerHeight - .5;
      fs.forEach((f, i) => { const k = (i + 1) * 9; f.style.transform = `translate(${(-x * k).toFixed(1)}px, ${(-yy * k).toFixed(1)}px)`; });
    }, { passive: true });
  }
}());
