// 3R Studios home: settings (language, theme, motion, text size, contrast, link underline)
// and the floating WhatsApp button. The HTML ships in pt-BR; another language is applied only
// after the visitor picks it in Ajustes (stored on this device).
(() => {
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  const dlg = $("prefs"), form = dlg.querySelector("form"), gear = $("gear"), saved = $("saved");
  const KEY = "3r-prefs";
  const BASE = "pt-BR";
  const DEFAULTS = { lang: BASE, theme: "auto", motion: "auto", text: "1", contrast: false, underline: false };

  let prefs = { ...DEFAULTS };
  try { prefs = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch {}
  if (!I18N[prefs.lang]) prefs.lang = BASE;

  /* ---------- language ---------- */
  function applyLang(lang) {
    const t = I18N[lang] || I18N[BASE];
    root.lang = lang;
    document.title = t.title;
    document.querySelector('meta[name="description"]').content = t.desc;
    document.querySelectorAll("[data-i18n]").forEach((el) => { const v = t[el.dataset.i18n]; if (v) el.textContent = v; });
    document.querySelectorAll("[data-i18n-label]").forEach((el) => { const v = t[el.dataset.i18nLabel]; if (v) el.setAttribute("aria-label", v); });
  }

  /* ---------- settings ---------- */
  function applyPrefs() {
    root.dataset.theme = prefs.theme;
    root.dataset.motion = prefs.motion;
    root.style.setProperty("--scale", prefs.text);
    prefs.contrast ? (root.dataset.contrast = "high") : delete root.dataset.contrast;
    prefs.underline ? (root.dataset.underline = "on") : delete root.dataset.underline;
    const dark = prefs.theme === "dark" || (prefs.theme === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.querySelector('meta[name="theme-color"]').content = getComputedStyle(root).getPropertyValue("--bg").trim() || (dark ? "#0B0A0F" : "#F5F2FA");
    if (root.lang !== prefs.lang) applyLang(prefs.lang);
  }
  function syncForm() {
    for (const name of ["lang", "theme", "motion", "text"]) {
      const input = form.querySelector(`input[name="${name}"][value="${prefs[name]}"]`);
      if (input) input.checked = true;
    }
    form.contrast.checked = !!prefs.contrast;
    form.underline.checked = !!prefs.underline;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {}
    saved.textContent = (I18N[prefs.lang] || I18N[BASE]).saved;
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

  // Floating WhatsApp button (mobile): hidden while a WhatsApp button is already on screen.
  const fabHide = new Set();
  const fio = new IntersectionObserver((es) => {
    es.forEach((en) => (en.isIntersecting ? fabHide.add(en.target) : fabHide.delete(en.target)));
    root.classList.toggle("fab-off", fabHide.size > 0);
  });
  document.querySelectorAll(".hero .ctas, .contact .ctas").forEach((el) => fio.observe(el));

  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyPrefs);
  // The head script already set root.lang from the stored choice; the text still needs swapping.
  if (prefs.lang !== BASE) applyLang(prefs.lang);
  applyPrefs();
})();
