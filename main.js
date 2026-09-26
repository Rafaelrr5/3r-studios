// 3R Studios: vertical scroll drives a horizontal track on desktop.
// One rAF loop, only while moving; transforms only, no layout reads per frame except cheap rects.
(() => {
  const wide = matchMedia("(min-width: 900px) and (hover: hover) and (pointer: fine)");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const pin = document.getElementById("pin");
  const track = document.getElementById("track");
  const bar = document.getElementById("bar");
  const count = document.getElementById("count");
  const plates = [...track.querySelectorAll(".plate")];
  const shapes = [...track.querySelectorAll(".shape")].map((el, i) => ({ el, k: i % 3 }));
  const total = String(plates.length).padStart(2, "0");

  let horiz = false, max = 0, cur = 0, last = 0, vel = 0, running = false, shown = -1;

  function measure() {
    horiz = wide.matches;
    root.classList.toggle("h", horiz);
    if (horiz) {
      max = track.scrollWidth - innerWidth;
      pin.style.height = max + innerHeight + "px";
    } else {
      pin.style.height = "";
      track.style.transform = "";
      shapes.forEach((s) => (s.el.style.transform = ""));
    }
    kick();
  }

  function tick() {
    if (!horiz) { running = false; return; }
    const tgt = Math.min(max, Math.max(0, scrollY - pin.offsetTop));
    cur = reduce ? tgt : cur + (tgt - cur) * 0.12;
    vel += (cur - last - vel) * 0.2;
    last = cur;
    track.style.transform = `translate3d(${-cur}px,0,0)`;
    bar.style.transform = `scaleX(${max ? cur / max : 0})`;
    if (!reduce) {
      const v = Math.max(-40, Math.min(40, vel));
      for (const { el, k } of shapes)
        el.style.transform = `translate3d(${v * (k - 1) * 0.6}px,${v * (k % 2 ? 0.4 : -0.4)}px,0) rotate(${v * (k + 1) * 0.5}deg)`;
    }
    const n = plates.filter((p) => p.getBoundingClientRect().left < innerWidth * 0.5).length;
    if (n !== shown) { shown = n; count.textContent = `${String(n).padStart(2, "0")} / ${total}`; }
    if (Math.abs(tgt - cur) > 0.5 || Math.abs(vel) > 0.05) requestAnimationFrame(tick);
    else running = false;
  }
  function kick() { if (!running && horiz) { running = true; requestAnimationFrame(tick); } }

  // pointer parallax inside each artwork (desktop only, CSS transition does the easing)
  track.addEventListener("pointermove", (e) => {
    const art = e.target.closest(".art");
    if (!art || !horiz || reduce) return;
    const r = art.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    art.querySelector(".shapes").style.transform = `translate3d(${x * 24}px,${y * 24}px,0)`;
  });
  track.addEventListener("pointerout", (e) => {
    const art = e.target.closest(".art");
    if (art && !art.contains(e.relatedTarget)) art.querySelector(".shapes").style.transform = "";
  });

  // arrow keys jump plate to plate
  addEventListener("keydown", (e) => {
    if (!horiz || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
    e.preventDefault();
    const stops = [0, ...plates.map((p) => p.offsetLeft - parseFloat(getComputedStyle(root).getPropertyValue("--pad"))), max];
    const now = scrollY - pin.offsetTop;
    const next = e.key === "ArrowRight" ? stops.find((s) => s > now + 5) ?? max : [...stops].reverse().find((s) => s < now - 5) ?? 0;
    scrollTo({ top: pin.offsetTop + Math.min(max, next), behavior: reduce ? "auto" : "smooth" });
  });

  // vertical mode: reveal artwork as it enters
  const io = new IntersectionObserver((es) => es.forEach((en) => en.isIntersecting && en.target.classList.add("in")), { threshold: 0.35 });
  plates.forEach((p) => io.observe(p));

  addEventListener("scroll", kick, { passive: true });
  addEventListener("resize", measure);
  wide.addEventListener("change", measure);
  document.fonts?.ready.then(measure);
  measure();
})();
