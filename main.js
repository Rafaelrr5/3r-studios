// 3R Studios: vertical scroll drives a horizontal track on desktop, plus settings
// (language, theme, motion, browsing mode, text size, contrast, link underline).
// One rAF loop that runs only while something moves; only transforms are animated.
(() => {
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const pin = $("pin"), track = $("track"), bar = $("bar"), count = $("count");
  const dlg = $("prefs"), form = dlg.querySelector("form"), gear = $("gear"), saved = $("saved");
  const plates = [...track.querySelectorAll(".plate")];
  const shapes = [...track.querySelectorAll(".shape")].map((el, i) => ({ el, k: i % 3 }));
  const total = String(plates.length).padStart(2, "0");
  const wideMQ = matchMedia("(min-width: 900px)");
  const fineMQ = matchMedia("(hover: hover) and (pointer: fine)");
  const reduceMQ = matchMedia("(prefers-reduced-motion: reduce)");
  const KEY = "3r-prefs";
  const DEFAULTS = { lang: null, theme: "auto", motion: "auto", layout: "auto", text: "1", contrast: false, underline: false };

  let prefs = { ...DEFAULTS };
  try { prefs = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch {}
  prefs.lang = prefs.lang || root.lang || "en";

  const reduced = () => prefs.motion === "reduce" || (prefs.motion === "auto" && reduceMQ.matches);
  const wantHoriz = () => wideMQ.matches && (prefs.layout === "horiz" || (prefs.layout === "auto" && fineMQ.matches));

  /* ---------- language ---------- */
  function applyLang(lang) {
    const t = (window.I18N && I18N[lang]) || I18N.en;
    root.lang = lang;
    document.title = t.title;
    document.querySelector('meta[name="description"]').content = t.desc;
    document.querySelectorAll("[data-i18n]").forEach((el) => { const v = t[el.dataset.i18n]; if (v) el.textContent = v; });
    document.querySelectorAll("[data-i18n-label]").forEach((el) => { const v = t[el.dataset.i18nLabel]; if (v) el.setAttribute("aria-label", v); });
    measure();
  }

  /* ---------- settings ---------- */
  function applyPrefs() {
    root.dataset.theme = prefs.theme;
    root.dataset.motion = prefs.motion;
    root.dataset.layout = prefs.layout;
    root.style.setProperty("--scale", prefs.text);
    prefs.contrast ? (root.dataset.contrast = "high") : delete root.dataset.contrast;
    prefs.underline ? (root.dataset.underline = "on") : delete root.dataset.underline;
    const dark = prefs.theme === "dark" || (prefs.theme === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.querySelector('meta[name="theme-color"]').content = getComputedStyle(root).getPropertyValue("--bg").trim() || (dark ? "#070A1C" : "#EDEEF2");
    if (root.lang !== prefs.lang) applyLang(prefs.lang); else measure();
  }
  function syncForm() {
    for (const name of ["lang", "theme", "motion", "layout", "text"]) {
      const input = form.querySelector(`input[name="${name}"][value="${prefs[name]}"]`);
      if (input) input.checked = true;
    }
    form.contrast.checked = !!prefs.contrast;
    form.underline.checked = !!prefs.underline;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {}
    saved.textContent = (I18N[prefs.lang] || I18N.en).saved;
    clearTimeout(save.t); save.t = setTimeout(() => (saved.textContent = ""), 2500);
  }
  form.addEventListener("change", (e) => {
    const { name, type, checked, value } = e.target;
    prefs[name] = type === "checkbox" ? checked : value;
    applyPrefs(); save();
  });
  $("reset").addEventListener("click", () => {
    prefs = { ...DEFAULTS, lang: prefs.lang };
    try { localStorage.removeItem(KEY); } catch {}
    syncForm(); applyPrefs();
    saved.textContent = "";
  });
  gear.addEventListener("click", () => { syncForm(); dlg.showModal(); });
  dlg.addEventListener("close", () => gear.focus());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); // click on backdrop

  /* ---------- horizontal track ---------- */
  let horiz = false, max = 0, cur = 0, last = 0, vel = 0, running = false, shown = -1;

  function measure() {
    const was = horiz;
    horiz = wantHoriz();
    root.classList.toggle("h", horiz);
    if (horiz) {
      max = Math.max(0, track.scrollWidth - innerWidth);
      pin.style.height = max + innerHeight + "px";
      if (!was) cur = last = Math.min(max, Math.max(0, scrollY - pin.offsetTop));
    } else {
      pin.style.height = "";
      track.style.transform = "";
      shapes.forEach((s) => (s.el.style.transform = ""));
    }
    shown = -1;
    kick();
  }

  function tick() {
    if (!horiz) { running = false; return; }
    const r = reduced();
    const tgt = Math.min(max, Math.max(0, scrollY - pin.offsetTop));
    cur = r ? tgt : cur + (tgt - cur) * 0.12;
    vel = r ? 0 : vel + (cur - last - vel) * 0.2;
    last = cur;
    track.style.transform = `translate3d(${-cur}px,0,0)`;
    bar.style.transform = `scaleX(${max ? cur / max : 0})`;
    const v = Math.max(-40, Math.min(40, vel));
    for (const { el, k } of shapes)
      el.style.transform = v ? `translate3d(${v * (k - 1) * 0.6}px,${v * (k % 2 ? 0.4 : -0.4)}px,0) rotate(${v * (k + 1) * 0.5}deg)` : "";
    const n = plates.filter((p) => p.getBoundingClientRect().left < innerWidth * 0.5).length;
    if (n !== shown) { shown = n; count.textContent = `${String(n).padStart(2, "0")} / ${total}`; }
    if (Math.abs(tgt - cur) > 0.5 || Math.abs(vel) > 0.05) requestAnimationFrame(tick);
    else running = false;
  }
  function kick() { if (!running && horiz) { running = true; requestAnimationFrame(tick); } }

  const padPx = () => parseFloat(getComputedStyle(root).getPropertyValue("--pad")) || 0;
  const stopFor = (el) => Math.min(max, Math.max(0, el.offsetLeft - padPx()));
  function goTo(x) { scrollTo({ top: pin.offsetTop + x, behavior: reduced() ? "auto" : "smooth" }); }

  // Keyboard focus inside the track: bring the focused plate on screen, since the track is moved by transform.
  const sticky = pin.firstElementChild;
  track.addEventListener("focusin", (e) => {
    if (!horiz) return;
    sticky.scrollLeft = 0; // older browsers without overflow:clip scroll the container on focus
    const plate = e.target.closest(".plate, .end, .intro");
    if (!plate) return;
    const x = plate.classList.contains("intro") ? 0 : plate.classList.contains("end") ? max : stopFor(plate);
    if (Math.abs(x - (scrollY - pin.offsetTop)) > 4) scrollTo({ top: pin.offsetTop + x, behavior: "auto" });
  });

  // Pointer parallax inside each artwork (CSS transition does the easing).
  track.addEventListener("pointermove", (e) => {
    const art = e.target.closest(".art");
    if (!art || !horiz || reduced()) return;
    const r = art.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    art.querySelector(".shapes").style.transform = `translate3d(${x * 24}px,${y * 24}px,0)`;
  });
  track.addEventListener("pointerout", (e) => {
    const art = e.target.closest(".art");
    if (art && !art.contains(e.relatedTarget)) art.querySelector(".shapes").style.transform = "";
  });

  // ← → jump plate to plate. Ignored while the settings dialog is open or a form control has focus.
  addEventListener("keydown", (e) => {
    if (!horiz || dlg.open || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    if (e.target.closest("input, textarea, select, [contenteditable]")) return;
    e.preventDefault();
    const stops = [0, ...plates.map(stopFor), max];
    const now = scrollY - pin.offsetTop;
    const next = e.key === "ArrowRight" ? stops.find((s) => s > now + 5) ?? max : [...stops].reverse().find((s) => s < now - 5) ?? 0;
    goTo(next);
  });

  // Skip link: land on the first project in either mode.
  document.querySelector(".skip").addEventListener("click", (e) => {
    e.preventDefault();
    if (horiz) scrollTo({ top: pin.offsetTop + stopFor(plates[0]), behavior: "auto" });
    plates[0].focus({ preventScroll: horiz });
  });

  // Vertical mode: reveal artwork as it enters.
  const io = new IntersectionObserver((es) => es.forEach((en) => en.isIntersecting && en.target.classList.add("in")), { threshold: 0.3 });
  plates.forEach((p) => io.observe(p));

  addEventListener("scroll", kick, { passive: true });
  addEventListener("resize", measure);
  wideMQ.addEventListener("change", measure);
  fineMQ.addEventListener("change", measure);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyPrefs);
  document.fonts?.ready.then(measure);

  applyLang(prefs.lang);
  applyPrefs();
})();
