// Shared sketch data: real public repos from github.com/Rafaelrr5 (fetched from the GitHub API).
window.PROJECTS = [
  {
    id: "agent-cortex", name: "Agent Cortex", year: "2026", lang: "Python", stars: 1,
    line: "Long-term memory for coding agents in one file.",
    body: "One SQLite file gives an agent memory that outlives the session, plus 22 skills that keep delegated work honest. Extracted from a setup I run every day.",
    tags: ["memory", "rag", "sqlite", "claude-code"], url: "https://github.com/Rafaelrr5/agent-cortex"
  },
  {
    id: "modpack", name: "Modpack Assistant", year: "2026", lang: "TypeScript", stars: 0,
    line: "An assistant for the whole Minecraft modpack lifecycle.",
    body: "Discovery, dependency resolution, conflict pre-flight, build, crash diagnosis, quests and packaging. A CLI and an Electron app on the same core.",
    tags: ["electron", "cli", "modrinth", "neoforge"], url: "https://github.com/Rafaelrr5/Minecraft-Modpack-Assistant"
  },
  {
    id: "alexa-hermes", name: "Alexa Hermes", year: "2026", lang: "Python", stars: 0,
    line: "You talk to Alexa, a local agent actually does the work.",
    body: "A voice bridge between Alexa and an AI agent running at home. Alexa-hosted skill plus ntfy.sh, zero running cost.",
    tags: ["voice", "alexa-skill", "serverless", "ntfy"], url: "https://github.com/Rafaelrr5/alexa-hermes"
  },
  {
    id: "financas-br", name: "Finanças BR", year: "2026", lang: "Python", stars: 0,
    line: "Brazilian personal finance, offline and in one database.",
    body: "Imports statements from Inter, Mercado Pago and B3 into local SQLite and shows them on an offline dashboard. Python standard library only.",
    tags: ["pdf-parser", "sqlite", "b3", "dashboard"], url: "https://github.com/Rafaelrr5/financas-br"
  },
  {
    id: "claude-autosend", name: "Claude Autosend", year: "2026", lang: "JavaScript", stars: 0,
    line: "Fire prompts into Claude Code at a chosen wall-clock time.",
    body: "Queue a prompt now and it lands in the running CLI session at the exact time you set. Small, Node-only, Windows only.",
    tags: ["scheduler", "claude-code", "windows", "node"], url: "https://github.com/Rafaelrr5/claude-autosend"
  }
];

// Candidate palettes. Pick with ?p=ink | night | cobalt | oxblood
window.PALETTES = {
  ink:     { bg: "#F1EEE7", fg: "#131313", mute: "#6E6A62", line: "#D6D1C6", acc: "#FF4A1C", acc2: "#131313", card: "#E8E4DA" },
  night:   { bg: "#0C0D0C", fg: "#ECEDE6", mute: "#7C8079", line: "#232622", acc: "#C6F432", acc2: "#ECEDE6", card: "#141614" },
  cobalt:  { bg: "#EDEEF2", fg: "#0A1030", mute: "#5D6380", line: "#CBCEDB", acc: "#1F3BFF", acc2: "#0A1030", card: "#E1E3EB" },
  oxblood: { bg: "#1B0B0C", fg: "#EFE6D6", mute: "#9A8577", line: "#3A2224", acc: "#E3A93B", acc2: "#EFE6D6", card: "#241113" }
};
(function applyPalette() {
  var key = new URLSearchParams(location.search).get("p") || document.documentElement.dataset.p || "ink";
  var p = window.PALETTES[key] || window.PALETTES.ink, s = document.documentElement.style;
  Object.keys(p).forEach(function (k) { s.setProperty("--" + k, p[k]); });
  document.documentElement.dataset.p = key;
})();
