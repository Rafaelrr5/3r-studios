// Project cards for apps.html come from projetos.json. The original cards keep their artwork and
// translated copy through "template"; text typed in the catalog wins over the translation.
// Every catalog string is written with textContent; links must be safe http(s) or site-relative paths.
(() => {
  const s = (l, t, w, h, x = "") => `left:${l}%;top:${t}%;width:${w}%;height:${h}%;${x}`;
  const ART = {
    rp: [s(30, 10, 44, 44, "border-radius:50% 50% 50% 0;rotate:-45deg"), s(44, 24, 16, 16, "border-radius:50%"), s(8, 76, 84, 6, "border-radius:99px")],
    dj: [s(14, 14, 72, 72, "border-radius:50%"), s(42, 42, 16, 16, "border-radius:50%"), s(70, 6, 6, 50, "border-radius:99px;rotate:24deg")],
    p1: [s(18, 22, 40, 40, "border-radius:50%"), s(48, 48, 32, 32, "border-radius:50%"), s(10, 66, 16, 16)],
    p2: [s(12, 16, 56, 18, "border-radius:4px"), s(12, 42, 36, 18, "border-radius:4px"), s(12, 68, 70, 18, "border-radius:4px")],
    p3: [s(32, 14, 36, 72, "border-radius:999px"), s(10, 42, 80, 16, "border-radius:999px"), s(45, 44, 10, 12, "border-radius:50%")],
    p4: [s(14, 58, 15, 30), s(36, 38, 15, 50), s(58, 18, 15, 70)],
    p5: [s(14, 16, 66, 66, "border-radius:0 0 100% 0"), s(56, 56, 28, 28, "border-radius:50%"), s(14, 72, 20, 12)],
    qm: [s(14, 20, 72, 60, "border-radius:10px"), s(40, 36, 30, 30, "clip-path:polygon(0 0,100% 50%,0 100%)"), s(14, 8, 72, 8)],
    bn: [s(18, 20, 64, 64, "border-radius:50%"), s(10, 42, 80, 16, "border-radius:8px"), s(62, 14, 18, 18, "rotate:45deg")],
    ar: [s(14, 38, 72, 48, "border-radius:4px"), s(14, 8, 72, 40, "clip-path:polygon(50% 0,100% 100%,0 100%)"), s(42, 54, 18, 32)],
    vv: [s(10, 58, 80, 24, "border-radius:14px 14px 6px 6px"), s(34, 30, 16, 28, "border-radius:8px 8px 0 0"), s(50, 12, 40, 6, "border-radius:99px;rotate:-28deg")],
    dz: [s(8, 30, 40, 40, "border-radius:50%"), s(52, 30, 40, 40, "border-radius:50%"), s(44, 76, 12, 14, "border-radius:3px")],
  };
  // Cards added later get one of these, picked from the id so the art stays put between visits.
  const GENERIC = [
    [s(16, 16, 50, 50, "border-radius:50%"), s(52, 52, 30, 30, "border-radius:6px"), s(10, 78, 40, 6, "border-radius:99px")],
    [s(20, 20, 60, 60, "border-radius:18px;rotate:12deg"), s(40, 40, 20, 20, "border-radius:50%"), s(70, 10, 12, 12, "border-radius:50%")],
    [s(10, 50, 80, 30, "border-radius:999px 999px 0 0"), s(38, 22, 24, 24, "border-radius:50%"), s(12, 14, 14, 14)],
  ];
  const COPY = { rp: ["rLn", "rBd"], dj: ["dLn", "dBd"], p1: ["p1ln", "p1bd"], p2: ["p2ln", "p2bd"], p3: ["p3ln", "p3bd"], p4: ["p4ln", "p4bd"], p5: ["p5ln", "p5bd"], qm: ["qmln", "qmbd"], bn: ["bnln", "bnbd"], ar: ["arln", "arbd"], vv: ["vvln", "vvbd"], dz: ["dzln", "dzbd"] };
  const STATUS = { live: "rSt", dev: "dSt" };
  // What each thing is, at a glance. "tipo" in projetos.json is one of these pt-BR labels;
  // slug drives the chip colour and the filter, key the translation.
  const TIPOS = {
    "Site": { slug: "site", key: "tSite" }, "App": { slug: "app", key: "tApp" }, "Jogo": { slug: "jogo", key: "tGame" },
    "Automação": { slug: "automacao", key: "tAuto" }, "Ferramenta": { slug: "ferramenta", key: "tTool" }, "Plataforma": { slug: "plataforma", key: "tPlat" },
  };
  const tipoOf = (p) => (p && Object.prototype.hasOwnProperty.call(TIPOS, p.tipo) ? p.tipo : "");

  function safeUrl(u) {
    if (typeof u !== "string" || !u || /[\s\\]/.test(u)) return "";
    if (/^\.\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_.-]+)*\/?(?:#[A-Za-z0-9_-]+)?$/.test(u) && !u.split(/[\/#]/).includes("..")) return u;
    if (/^\.\/[A-Za-z0-9_-]+\.html(?:#[A-Za-z0-9_-]+)?$/.test(u)) return u;
    try {
      const x = new URL(u);
      return (x.protocol === "https:" || x.protocol === "http:") && x.hostname && !x.username && !x.password ? x.href : "";
    } catch { return ""; }
  }

  // Each switch is independent: a link shows only when its switch is on and its address is safe.
  function linksFor(p) {
    const out = [];
    const proj = p.useProject ? safeUrl(p.projectUrl) : "";
    const code = p.showCode ? safeUrl(p.codeUrl) : "";
    if (proj) out.push({ href: proj, key: p.template === "rp" ? "rGo" : "open" });
    if (code) out.push({ href: code, key: "view" });
    return out;
  }

  function hintText(t, mode, n) {
    if (!n) return t.hint0 || "";
    return String((n === 1 ? t["hint" + mode + "1"] : t["hint" + mode]) || "").replace("{n}", n);
  }

  function hash(str) { let h = 0; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }

  // opts.lang picks the copy (default English); opts.brief drops the long description and topic chips.
  function render(doc, catalog, I18N, opts = {}) {
    const en = (I18N && (I18N[opts.lang] || I18N.en)) || {};
    const el = (tag, cls, text) => {
      const e = doc.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    };
    const tr = (tag, cls, key) => { const e = el(tag, cls, en[key] || ""); e.dataset.i18n = key; return e; };
    const list = (catalog && Array.isArray(catalog.projects)) ? catalog.projects : [];

    return list.map((p, i) => {
      const num = String(i + 1).padStart(2, "0");
      const tpl = Object.prototype.hasOwnProperty.call(ART, p.template) ? p.template : "";
      const art = tpl ? ART[tpl] : GENERIC[hash(p.id) % GENERIC.length];
      const product = p.kind === "product";
      const hid = "proj-" + i;

      const plate = el("article", product ? "plate prod" : "plate");
      if (product && tpl) plate.dataset.p = tpl;
      plate.setAttribute("aria-labelledby", hid);

      const head = el("div", "h m");
      head.setAttribute("aria-hidden", "true");
      const left = el("span", null, num + " — ");
      if (!product) { left.append(tr("span", null, "lab")); if (p.platform) left.append(" · "); }
      if (p.platform) left.append(p.platform);
      head.append(left, el("span", null, p.year || ""));

      const card = el("div", "card");
      const artBox = el("div", "art");
      artBox.setAttribute("aria-hidden", "true");
      artBox.dataset.n = num;
      const shapes = el("div", "shapes");
      for (const css of art) { const sh = el("i", "shape"); sh.style.cssText = css; shapes.append(sh); }
      artBox.append(shapes);

      const txt = el("div", "txt");
      const tipo = tipoOf(p);
      if (tipo) { plate.dataset.tipo = TIPOS[tipo].slug; }
      if (tipo || STATUS[p.status]) {
        const meta = el("div", "meta");
        if (tipo) { const c = tr("p", "tipo m", TIPOS[tipo].key); c.dataset.t = TIPOS[tipo].slug; if (!c.textContent) c.textContent = tipo; meta.append(c); }
        if (STATUS[p.status]) meta.append(tr("p", "st m" + (p.status === "live" ? " live" : ""), STATUS[p.status]));
        txt.append(meta);
      }
      const h3 = el("h3", null, p.name); h3.id = hid;
      txt.append(h3);
      const [lnKey, bdKey] = COPY[tpl] || [];
      if (p.tagline) txt.append(el("p", "ln", p.tagline)); else if (lnKey) txt.append(tr("p", "ln", lnKey));
      if (!opts.brief) { if (p.description) txt.append(el("p", "bd", p.description)); else if (bdKey) txt.append(tr("p", "bd", bdKey)); }
      if (!opts.brief && Array.isArray(p.topics) && p.topics.length) {
        const ul = el("ul", "chips m");
        ul.dataset.i18nLabel = "topics";
        ul.setAttribute("aria-label", en.topics || "Topics");
        for (const tpc of p.topics) ul.append(el("li", null, tpc));
        txt.append(ul);
      }
      for (const l of linksFor(p)) {
        const a = el("a", "go");
        a.href = l.href; a.target = "_blank"; a.rel = "noopener";
        const b = el("b", null, "↗"); b.setAttribute("aria-hidden", "true");
        const sr = el("span", "sr", ": " + p.name + " ");
        sr.append(tr("span", null, "newtab"));
        a.append(b, tr("span", null, l.key), sr);
        txt.append(a);
      }

      card.append(artBox, txt);
      plate.append(head, card);
      return plate;
    });
  }

  // Filter chips: "Todos" plus each type present, in TIPOS order. Pressing one hides the other cards.
  function filters(doc, plates, I18N, opts = {}) {
    const t = (I18N && (I18N[opts.lang] || I18N.en)) || {};
    const present = Object.keys(TIPOS).filter((k) => plates.some((pl) => pl.dataset.tipo === TIPOS[k].slug));
    const opts2 = [{ slug: "", label: t.tAll || "Todos" }].concat(present.map((k) => ({ slug: TIPOS[k].slug, label: t[TIPOS[k].key] || k })));
    const buttons = opts2.map((o) => {
      const b = doc.createElement("button");
      b.type = "button"; b.className = "fchip m"; b.textContent = o.label;
      b.dataset.t = o.slug; b.setAttribute("aria-pressed", o.slug ? "false" : "true");
      return b;
    });
    function pick(slug) {
      let shown = 0;
      for (const b of buttons) b.setAttribute("aria-pressed", String(b.dataset.t === slug));
      for (const pl of plates) { const on = !slug || pl.dataset.tipo === slug; pl.hidden = !on; if (on) shown++; }
      return shown;
    }
    return { buttons, pick };
  }

  const api = { safeUrl, linksFor, hintText, render, filters, TIPOS };
  if (typeof module === "object" && module.exports) { module.exports = api; return; }
  window.PROJECTS = api;

  // apps.html: fill #apps-grid in the page's language (each language has its own copy of the page).
  const grid = document.getElementById("apps-grid");
  if (!grid) return;
  const lang = window.I18N && I18N[document.documentElement.lang] ? document.documentElement.lang : "pt-BR";
  const T = (window.I18N && I18N[lang]) || {};
  // Same folder as this script, so /en/apps.html still reads the one catalog at the site root.
  fetch(new URL("projetos.json", document.currentScript.src), { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then((cat) => {
      const plates = render(document, cat, window.I18N, { lang, brief: true });
      grid.append(...plates);
      const bar = document.getElementById("apps-filtros"), count = document.getElementById("apps-count");
      if (!bar) return;
      const f = filters(document, plates, window.I18N, { lang });
      const say = (n) => { if (count) count.textContent = (n === 1 ? T.items1 : T.itemsN || "{n}").replace("{n}", n); };
      for (const b of f.buttons) b.addEventListener("click", () => say(f.pick(b.dataset.t)));
      bar.append(...f.buttons);
      bar.hidden = false;
    })
    .catch((err) => {
      console.error("projetos.json:", err);
      const p = document.createElement("p");
      p.className = "load-err";
      p.setAttribute("role", "alert");
      p.textContent = T.loadErr || "Não foi possível carregar a lista de projetos.";
      grid.append(p);
    });
})();
