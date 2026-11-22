(() => {
  const d = document, root = d.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // reveal on scroll
  const items = d.querySelectorAll('.it, .intro > *, .serie-text, .festa, .turma figure, .contato > *');
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    items.forEach(el => { el.classList.add('rv'); io.observe(el); });
  }

  // floating CTA after hero, hidden near the contact section
  const fl = d.querySelector('.float'), hero = d.querySelector('.hero'), ct = d.querySelector('#contato');
  const onScroll = () => {
    const past = hero.getBoundingClientRect().bottom < 80;
    const atCt = ct.getBoundingClientRect().top < innerHeight * .8;
    fl.classList.toggle('on', past && !atCt);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // lightbox
  const lb = d.getElementById('lb'), img = lb.querySelector('img'), num = lb.querySelector('.lb-n');
  const btns = [...d.querySelectorAll('.ph')];
  let i = 0, last = null;
  const show = n => {
    i = (n + btns.length) % btns.length;
    const src = btns[i].querySelector('img');
    img.src = btns[i].dataset.full; img.alt = src.alt;
    num.textContent = (i + 1) + ' / ' + btns.length;
  };
  const open = n => { last = d.activeElement; show(n); lb.hidden = false; d.body.style.overflow = 'hidden'; lb.querySelector('.lb-x').focus(); };
  const close = () => { lb.hidden = true; d.body.style.overflow = ''; if (last) last.focus(); };
  btns.forEach((b, n) => b.addEventListener('click', () => open(n)));
  lb.querySelector('.lb-x').onclick = close;
  lb.querySelector('.lb-p').onclick = () => show(i - 1);
  lb.querySelector('.lb-nx').onclick = () => show(i + 1);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  d.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(i + 1);
    else if (e.key === 'ArrowLeft') show(i - 1);
    else if (e.key === 'Tab') {
      const f = [...lb.querySelectorAll('button')], a = d.activeElement;
      if (e.shiftKey && a === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && a === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  // swipe
  let x0 = null;
  lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1));
  });
})();
