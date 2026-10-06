// Builds the full Script from game.js, so the Script always matches the shipped game.
//   node games/big-footprint/design/make-script.js   writes design/SCRIPT_week01_rev6.txt
// Every player-facing line in G, in data order, with the condition that shows it. Logic-only data is skipped.
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const OUT = path.join(__dirname, "SCRIPT_week01_rev6.txt");

const SECTIONS = { title: "TITLE", intro: "INTRO", messages: "SYSTEM MESSAGES (help, errors, movement)", status: "STATUS LINE",
  verbs: "GAME-WIDE VERBS", rooms: "ROOMS", items: "ITEMS AND THINGS", kinds: "KINDS (the loose animals)", npcs: "PEOPLE",
  on: "GAME-WIDE REPLIES", events: "EVENTS AND ENDINGS", nouns: "SCENERY (examine, smell, listen... by room)",
  strike: "STRIKES", categories: "CATEGORY REPLIES (anything of that type)", anywhere: "REPLIES ANYWHERE", alone: "BARE VERBS (no object)",
  caught: "CAUGHT", tails: "ROOM TAILS (after a move)", spoken: "SPOKEN LINES", npcLines: "NPC LINES", warnings: "WARNINGS",
  bands: "BIGFOOT CLOCK BANDS", feedback: "TURN FEEDBACK", nowhere: "NOT HERE", reactions: "THE DON'S REACTIONS",
  firstLook: "FIRST CLOSE LOOK AT EACH SECRET", oneAtATime: "ONE THING AT A TIME", report: "RUN REPORT", lookCloser: "LOOK CLOSER", throughDoor: "THROUGH A DOOR" };
const LOGIC = new Set(["if", "said", "aliases", "words", "phrasal", "bare", "conds", "groups", "strikeVerbs", "strikeWith", "tourFree",
  "reactIf", "start", "at", "move", "route", "level", "kind", "cat", "pronoun", "exits", "key", "flag", "set", "unset", "give", "take",
  "note", "next", "counted", "proper", "every", "ending", "by", "name"]);

const cond = c => {
  if (c == null) return "always";
  if (typeof c === "string") return c;
  const part = ([k, v]) => {
    if (k === "not") return `not(${cond(v)})`;
    if (k === "any") return `any(${v.map(cond).join(" | ")})`;
    if (k === "min") return Object.entries(v).map(([a, n]) => `${a}>=${n}`).join(" & ");
    if (k === "max") return Object.entries(v).map(([a, n]) => `${a}<=${n}`).join(" & ");
    if (k === "eq") return Object.entries(v).map(([a, n]) => `${a}=${n}`).join(" & ");
    if (k === "said") return `said "${v}"`;
    if (k === "in") return `in ${v}`;
    if (k === "here") return `${v} here`;
    if (k === "has") return `carrying ${v}`;
    if (k === "what" || k === "with") return `${k} ${v}`;
    return typeof v === "object" ? `${k}(${cond(v)})` : `${k} ${v}`;
  };
  return Object.entries(c).map(part).join(" & ") || "always";
};
const isText = s => typeof s === "string" && /\p{Ll}/u.test(s) && (/\s/.test(s) || /[.!?"]$/.test(s));
const tuple = a => Array.isArray(a) && a.length >= 2 && typeof a[1] === "string" && (a[0] === null || (typeof a[0] === "string" && !/\s/.test(a[0])));
const clean = s => s.replace(/\u200b/g, "").split("\n").map((l, i) => i && l ? "      " + l : l).join("\n");

function script() {
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../game.js"), "utf8") + "\n;globalThis.__G = G;", ctx);
  const G = ctx.__G, out = [], seen = new Map();
  let block = "", lastWhere = "";
  const line = (label, text, where) => {
    const t = clean(text);
    if (where !== lastWhere) { if (where !== block) out.push(`  ${where.slice(block.length + 1)}:`); lastWhere = where; }
    if (seen.has(t)) { const same = `    [${label}] (same as ${seen.get(t)})`; return out.at(-1) === same || out.push(same); }
    seen.set(t, where); out.push(`    [${label}] ${t}`);
  };
  const walk = (o, where, label = "always") => {
    if (typeof o === "string") { if (isText(o)) line(label, o, where); return; }
    if (Array.isArray(o)) {
      if (tuple(o)) return walk(o[1], where, o[0] === null ? label : label === "always" ? o[0] : `${label} & ${o[0]}`);
      return o.forEach((x, i) => walk(x, where, label));
    }
    if (!o || typeof o !== "object") return;
    const here = o.if ? (label === "always" ? cond(o.if) : `${label} & ${cond(o.if)}`) : label;
    for (const k in o) {
      if (LOGIC.has(k)) continue;
      const v = o[k], sub = `${where}.${k}`;
      if (["text", "say", "finish", "rotate", "random", "ladder"].includes(k)) walk(v, where, here);
      else walk(v, sub, here);
    }
  };
  out.push(`${G.title}`, "Week 01 · Full Script, rev 6 (generated from games/big-footprint/game.js; do not edit by hand)", "",
    "How to read it: each line is [condition] text. \"always\" is the fallback. [id] tags are names the game highlights;",
    "{name} slots are filled in at play time. A line already printed elsewhere shows (same as <where>).",
    "Regenerate after any text change: node games/big-footprint/design/make-script.js", "");
  for (const k in G) {
    if (LOGIC.has(k) || k === "aliases") continue;
    const before = out.length;
    out.push("", "=".repeat(78), SECTIONS[k] || k.toUpperCase(), "=".repeat(78));
    if (typeof G[k] === "string") { if (isText(G[k])) line("always", G[k], k); }
    else for (const [id, v] of Array.isArray(G[k]) ? G[k].map((v, i) => [String(i), v]) : Object.entries(G[k])) {
      const head = out.length; out.push("", `-- ${k}.${id}${v && v.name ? `: ${v.name}` : ""}`); block = lastWhere = `${k}.${id}`;
      walk(v, `${k}.${id}`);
      if (out.length === head + 2) out.splice(head);
    }
    if (out.length === before + 4) out.splice(before);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
}

if (require.main === module) { fs.writeFileSync(OUT, script()); console.log(`Wrote ${path.relative(process.cwd(), OUT)}`); }
module.exports = { script, OUT };
