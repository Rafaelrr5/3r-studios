// Project cards come from projetos.json. The seven original cards keep their artwork and
// four-language copy through "template"; text typed in the catalog wins over the translation.
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
  };
  // Cards added later get one of these, picked from the id so the art stays put between visits.
  const GENERIC = [
    [s(16, 16, 50, 50, "border-radius:50%"), s(52, 52, 30, 30, "border-radius:6px"), s(10, 78, 40, 6, "border-radius:99px")],
    [s(20, 20, 60, 60, "border-radius:18px;rotate:12deg"), s(40, 40, 20, 20, "border-radius:50%"), s(70, 10, 12, 12, "border-radius:50%")],
    [s(10, 50, 80, 30, "border-radius:999px 999px 0 0"), s(38, 22, 24, 24, "border-radius:50%"), s(12, 14, 14, 14)],
  ];
  const COPY = { rp: ["rLn", "rBd"], dj: ["dLn", "dBd"], p1: ["p1ln", "p1bd"], p2: ["p2ln", "p2bd"], p3: ["p3ln", "p3bd"], p4: ["p4ln", "p4bd"], p5: ["p5ln", "p5bd"], qm: ["qmln", "qmbd"], bn: ["bnln", "bnbd"], ar: ["arln", "arbd"] };
  const STATUS = { live: "rSt", dev: "dSt" };

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

  function render(doc, catalog, I18N) {
    const en = (I18N && I18N.en) || {};
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
      if (STATUS[p.status]) txt.append(tr("p", "st m" + (p.status === "live" ? " live" : ""), STATUS[p.status]));
      const h3 = el("h3", null, p.name); h3.id = hid;
      txt.append(h3);
      const [lnKey, bdKey] = COPY[tpl] || [];
      if (p.tagline) txt.append(el("p", "ln", p.tagline)); else if (lnKey) txt.append(tr("p", "ln", lnKey));
      if (p.description) txt.append(el("p", "bd", p.description)); else if (bdKey) txt.append(tr("p", "bd", bdKey));
      if (Array.isArray(p.topics) && p.topics.length) {
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

  const api = { safeUrl, linksFor, hintText, render };
  if (typeof module === "object" && module.exports) { module.exports = api; return; }
  window.PROJECTS = api;

  // main.js awaits this before it measures the track, so the cards always exist first.
  const track = document.getElementById("track"), end = track.querySelector(".end");
  window.PROJECTS_READY = fetch("projetos.json", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then((cat) => {
      const plates = render(document, cat, window.I18N);
      plates.forEach((p) => track.insertBefore(p, end));
      const first = plates[0] || end; // skip link target, even with zero projects
      first.id = "work"; first.tabIndex = -1;
      return true;
    })
    .catch((err) => {
      console.error("projetos.json:", err);
      const warn = document.createElement("section");
      warn.className = "load-err";
      warn.id = "work"; warn.tabIndex = -1;
      warn.setAttribute("role", "alert");
      const p = document.createElement("p");
      p.dataset.i18n = "loadErr";
      p.textContent = (window.I18N && I18N.en.loadErr) || "The project list could not be loaded.";
      warn.append(p);
      track.insertBefore(warn, end);
      return false;
    });
})();
