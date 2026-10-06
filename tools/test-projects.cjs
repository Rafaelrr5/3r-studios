// node tools/test-projects.cjs — checks projects.js against projetos.json with a tiny fake DOM.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const P = require(path.join(root, "projects.js"));
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "i18n.js"), "utf8"), ctx);
const I18N = ctx.window.I18N;
const catalog = JSON.parse(fs.readFileSync(path.join(root, "projetos.json"), "utf8"));
// Fixed fixtures are separate from the owner's editable catalog.
const seed = { projects: ["rp", "dj", "p1", "p2", "p3", "p4", "p5"].map((template, i) => ({
  id: `fixture-${i}`, template, name: `Fixture ${i}`, kind: i < 2 ? "product" : "lab",
  status: "", platform: "", year: "", tagline: "", description: "", topics: [],
  showCode: i >= 2, codeUrl: i >= 2 ? `https://example.com/code/${i}` : "",
  useProject: i === 0, projectUrl: i === 0 ? "https://example.com/app" : ""
})) };

class Node {
  constructor(tag) { this.tagName = tag; this.kids = []; this.attrs = {}; this.dataset = {}; this.style = {}; this.className = ""; }
  set textContent(v) { this.kids = [String(v)]; }
  get textContent() { return this.kids.map((k) => (typeof k === "string" ? k : k.textContent)).join(""); }
  append(...n) { this.kids.push(...n); }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  all(pred, acc = []) { for (const k of this.kids) if (typeof k !== "string") { if (pred(k)) acc.push(k); k.all(pred, acc); } return acc; }
}
const doc = { createElement: (t) => new Node(t) };
const links = (plate) => plate.all((n) => n.tagName === "a");
const keyOf = (a) => a.all((n) => n.dataset.i18n && n.dataset.i18n !== "newtab")[0].dataset.i18n;
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok -", name); };

t("seed catalog renders the seven original cards with their links", () => {
  const plates = P.render(doc, seed, I18N);
  assert.equal(plates.length, 7);
  assert.equal(plates[0].dataset.p, "rp");
  assert.deepEqual(links(plates[0]).map(keyOf), ["rGo"]);
  assert.equal(links(plates[1]).length, 0, "DeejAI has no links");
  for (const p of plates.slice(2)) assert.deepEqual(links(p).map(keyOf), ["view"]);
  assert.equal(plates[2].all((n) => n.className === "shape").length, 3);
});

t("current editable catalog renders its actual project count", () => {
  assert.equal(P.render(doc, catalog, I18N).length, catalog.projects.length);
});

t("toggles are independent and unsafe or blank URLs never render", () => {
  const base = { id: "novo", template: "", name: "Novo", kind: "lab", status: "", platform: "Go", year: "2026", tagline: "", description: "", topics: [] };
  const both = { ...base, showCode: true, codeUrl: "https://github.com/x/y", useProject: true, projectUrl: "https://x.example/" };
  assert.deepEqual(links(P.render(doc, { projects: [both] }, I18N)[0]).map(keyOf), ["open", "view"]);
  assert.deepEqual(P.linksFor({ ...both, useProject: false }).map((l) => l.key), ["view"]);
  assert.deepEqual(P.linksFor({ ...both, showCode: false }).map((l) => l.key), ["open"]);
  assert.deepEqual(P.linksFor({ ...both, codeUrl: "javascript:alert(1)", projectUrl: "" }), []);
  for (const bad of ["javascript:alert(1)", "data:text/html,x", "//evil.example", "https://u:p@x.example/", "ftp://x.example/", "https://x.example/a b"])
    assert.equal(P.safeUrl(bad), "", bad);
});

t("typed text overrides the translation and is kept as plain text", () => {
  const evil = "<img src=x onerror=alert(1)>";
  const p = { ...seed.projects[2], tagline: evil, description: "" };
  const plate = P.render(doc, { projects: [p] }, I18N)[0];
  const ln = plate.all((n) => n.className === "ln")[0];
  assert.equal(ln.textContent, evil);
  assert.equal(ln.dataset.i18n, undefined, "edited text must not be overwritten by applyLang");
  assert.equal(plate.all((n) => n.className === "bd")[0].dataset.i18n, "p1bd");
  assert.doesNotMatch(fs.readFileSync(path.join(root, "projects.js"), "utf8"), /innerHTML|insertAdjacentHTML/);
});

t("added card without template gets generic art; zero projects renders nothing", () => {
  const p = { id: "extra", template: "", name: "Extra", kind: "product", status: "dev", platform: "", year: "", tagline: "", description: "", topics: [], showCode: false, codeUrl: "", useProject: false, projectUrl: "" };
  const plate = P.render(doc, { projects: [p] }, I18N)[0];
  assert.equal(plate.all((n) => n.className === "shape").length, 3);
  assert.equal(plate.dataset.p, undefined);
  assert.deepEqual(P.render(doc, { projects: [] }, I18N), []);
  assert.deepEqual(P.render(doc, null, I18N), []);
});

t("count hints follow the number of projects in all four languages", () => {
  for (const lang of ["en", "pt-BR", "es", "fr"]) {
    const L = I18N[lang];
    for (const mode of ["D", "M"]) {
      assert.match(P.hintText(L, mode, 9), /9/);
      assert.doesNotMatch(P.hintText(L, mode, 9), /\{n\}/);
      assert.match(P.hintText(L, mode, 1), /1/);
      assert.equal(P.hintText(L, mode, 0), L.hint0);
    }
    for (const k of Object.keys(I18N.en)) assert.ok(L[k], `${lang} missing ${k}`);
  }
});

t("safe site-relative destinations and browser-only projects", () => {
  for (const u of ["./usar.html#extrato-claro", "./usar.html#claude-autosend", "./jogar/arrumadinho/"]) assert.equal(P.safeUrl(u), u);
  for (const u of ["./../private", "./x/../secret", "./x/../../secret", "./x/%2e%2e/private", "./x//evil", "./x/..", "./x\\\\evil", "/private", "//evil.example", "./usar.html#<svg>"]) assert.equal(P.safeUrl(u), "", u);
  for (const id of ["qual-mon-movie", "blinkninja", "arrumadinho"]) {
    const p = catalog.projects.find(p => p.id === id);
    assert.ok(p, id); assert.equal(p.showCode, false); assert.equal(p.codeUrl, "");
    assert.deepEqual(P.linksFor(p).map(l => l.key), ["open"]);
  }
  assert.equal(catalog.projects.find(p => p.id === "financas-br").name, "Extrato Claro");
});

t("new products have four-language copy and art", () => {
  for (const tpl of ["qm", "bn", "ar"]) {
    for (const L of Object.values(I18N)) { assert.ok(L[tpl + "ln"]); assert.ok(L[tpl + "bd"]); }
    const p = catalog.projects.find(p => p.template === tpl);
    const card = P.render(doc, {projects:[p]}, I18N)[0];
    assert.equal(card.all(n => n.className === "shape").length, 3);
    assert.equal(card.all(n => n.className === "bd")[0].dataset.i18n, tpl + "bd");
  }
});

t("published download buttons match the release manifest and ZIPs stay out of Git", () => {
  const releases = JSON.parse(fs.readFileSync(path.join(root, "downloads/releases.json"), "utf8"));
  const guide = fs.readFileSync(path.join(root, "usar.html"), "utf8");
  assert.equal(releases.files.length, 2);
  for (const item of releases.files) {
    const repo = item.file.startsWith("Extrato") ? "financas-br" : "claude-autosend";
    assert.equal(item.url, `https://github.com/Rafaelrr5/${repo}/releases/download/v0.1.0-windows-preview/${item.file}`);
    assert.ok(guide.includes(`href="${item.url}"`));
    assert.match(item.sha256, /^[a-f0-9]{64}$/);
    assert.ok(Number.isSafeInteger(item.bytes) && item.bytes > 0);
  }
  assert.match(fs.readFileSync(path.join(root, ".gitignore"), "utf8"), /downloads\/\*\.zip/);
});

t("browser game uses executable .js assets instead of server-only .cjs MIME types", () => {
  const html = fs.readFileSync(path.join(root, "jogar/arrumadinho/index.html"), "utf8");
  const scripts = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(scripts, ["src/progression.js", "src/game-state.js"]);
  for (const script of scripts) new vm.Script(fs.readFileSync(path.join(root, "jogar/arrumadinho", script), "utf8"));
});

console.log(`${n} tests passed`);
