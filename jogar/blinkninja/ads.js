// Google AdSense: fill only the ad boxes the current layout shows (hidden boxes have no width).
(function () {
  function unit(slotEl, style, format) {
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.setAttribute('style', style);
    ins.dataset.adClient = 'ca-pub-5017691799936042';
    ins.dataset.adSlot = '7879124390';
    if (format) { ins.dataset.adFormat = format; ins.dataset.fullWidthResponsive = 'true'; }
    slotEl.appendChild(ins);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* ad blocker: keep the game running */ }
  }
  function visible(el) { return el && el.offsetParent !== null && el.clientWidth > 0; }
  const left = document.getElementById('left-skyscraper-ad-slot');
  const right = document.getElementById('right-rectangle-ad-slot');
  const below = document.getElementById('leaderboard-ad-slot');
  if (visible(left)) unit(left, 'display:inline-block;width:300px;height:600px');
  if (visible(right)) unit(right, 'display:inline-block;width:300px;height:250px');
  if (visible(below)) unit(below, 'display:block;width:100%;min-height:90px', 'auto');
}());
