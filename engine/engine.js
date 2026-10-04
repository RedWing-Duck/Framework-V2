/* =====================================================================
   ENGINE — reuse as-is. Conditions, effects and commands live in the COND,
   EFFECT and CMDS tables, which add-ons extend (see ADD-ONS below).
   On load, validate() checks the game data and lists any problems on the
   start menu (and in the browser console) with the exact path.
   ===================================================================== */
const $ = id => document.getElementById(id), out = $("out"), inp = $("in");
const DIRS = { n: "north", s: "south", e: "east", w: "west", u: "up", d: "down" };
const ALIAS = { z: "wait", l: "look", i: "inventory", inv: "inventory", x: "examine", get: "take", grab: "take",
  walk: "go", move: "go", speak: "talk", h: "help", "?": "help" };
const FILLER = ["a", "an", "the", "to", "at", "with", "on"];
const FREE = ["help", "menu"];                    // commands that don't cost a turn
const ADDONS = [], HOOKS = { before: [], afterTurn: [], validate: [] }, CLASH = [];
let S, SAVE = null;   // SAVE = the continue slot: a text snapshot of S (a plug-in can persist it)

function print(t, c) {
  const p = document.createElement("p"); if (c) p.className = c;
  t.split(/\[(\w+)\]/).forEach((s, i) => {          // odd parts are ids from [id]
    const o = i % 2 && (G.npcs[s] || G.items[s]);
    if (!o) return p.append(i % 2 ? `[${s}]` : s);   // unknown id stays visible for the author
    const sp = document.createElement("span");
    sp.className = G.npcs[s] ? "npc" : "item"; sp.textContent = o.name; p.append(sp);
  });
  out.append(p); out.scrollTop = out.scrollHeight;
}
const names = ids => ids.map(i => `[${i}]`).join(", ");
const at = (T, place = S.room) => Object.keys(T).filter(id => S.loc[id] === place);
const inv = () => at(G.items, "player");
const all = (o, f) => Object.entries(o || {}).every(([k, n]) => f(S.count[k] || 0, n, k));
const find = (w, ids, T) => ids.find(id => { const n = T[id].name.toLowerCase();
  return id === w || n === w || n.split(" ").includes(w) || (T[id].aliases || []).includes(w); });
const txt = v => [].concat(v).map(x => typeof x === "string" ? { text: x } : x).find(x => test(x.if))?.text
  .replace(/\{(\w+)\}/g, (_, k) => S.count[k] || 0) || "";   // {counter} shows its value

// ---- conditions: every key in an "if" must pass
const COND = {
  has: v => S.loc[v] === "player",
  here: v => S.loc[v] === S.room,
  in: v => S.room === v,
  flag: v => !!S.flags[v],
  not: v => !test(v),
  min: o => all(o, (v, n) => v >= n),
  max: o => all(o, (v, n) => v <= n),
  since: o => all(o, (v, n, k) => k in S.mark && S.count.turns - S.mark[k] >= n)
};
const test = (c = {}) => Object.keys(c).every(k => !COND[k] || COND[k](c[k]));

// ---- effects: run in table order; say, goto and end always run last
const EFFECT = {
  set: v => S.flags[v] = true,
  unset: v => delete S.flags[v],
  add: o => { for (const k in o) S.count[k] = (S.count[k] || 0) + o[k]; },
  mark: v => S.mark[v] = S.count.turns,
  move: o => { for (const id in o) { const r = o[id];   // a list is a route: step to the next room
    S.loc[id] = Array.isArray(r) ? r[(r.indexOf(S.loc[id]) + 1) % r.length] : r; } },
  take: v => { S.loc[v] = null; print(`(Lost: [${v}])`, "cmd"); },
  give: v => { S.loc[v] = "player"; print(`(Received: [${v}])`, "cmd"); },
  say: v => { const t = txt(v); if (t) print(t); },
  goto: v => enter(v),
  end: v => { print(txt(v), "title"); S.over = true; }
};
const LAST = ["say", "goto", "end"];
function run(e = {}) {
  for (const k of [...Object.keys(EFFECT).filter(k => !LAST.includes(k)), ...LAST]) if (k in e) EFFECT[k](e[k]);
}

function events() {
  (G.events || []).forEach((e, i) => { if (!S.over && (e.repeat || !S.fired[i]) && test(e.if)) { S.fired[i] = true; run(e); } });
}

function look() {
  const r = G.rooms[S.room], d = txt(r.desc), extra = T => at(T).filter(id => !d.includes(`[${id}]`));
  const it = extra(G.items), np = extra(G.npcs), ex = Object.keys(r.exits || {});
  print(r.name, "title"); print(d);
  if (it.length) print("You see: " + names(it));
  if (np.length) print("Here: " + names(np));
  if (ex.length) print("Exits: " + ex.join(", "));
}

function enter(id) { S.room = id; exec("look"); }

function go(d) {
  d = DIRS[d] || d;
  const x = (G.rooms[S.room].exits || {})[d];
  if (!x) return print("You can't go that way.");
  const e = typeof x === "string" ? { to: x } : x;
  test(e.if) ? enter(e.to) : print(txt(e.fail || "Something blocks the way."));
}

function node(npc, id) {
  const n = G.npcs[npc].dialogue[id], opts = (n.options || []).filter(o => test(o.if));
  print(`[${npc}]: "${txt(n.text)}"`);
  S.talk = opts.length ? { npc, opts } : null;
  opts.forEach((o, i) => print(`${i + 1}. ${o.text}`, "cmd"));
}

// ---- commands: each gets the rest of the typed line (filler words removed)
const CMDS = {
  look,
  go,
  take(a) {
    const id = find(a, at(G.items), G.items);
    if (!id) return print("You don't see that here.");
    if (G.items[id].fixed) return print("You can't take that.");
    S.loc[id] = "player"; print(`Taken: [${id}]`);
  },
  drop(a) {
    const id = find(a, inv(), G.items);
    if (!id) return print("You don't have that.");
    S.loc[id] = S.room; print(`Dropped: [${id}]`);
  },
  inventory() { const i = inv(); print(i.length ? "You carry: " + names(i) : "You carry nothing."); },
  examine(a) {
    if (!a) return exec("look");
    const id = find(a, [...inv(), ...at(G.items)], G.items), n = find(a, at(G.npcs), G.npcs);
    print(id ? txt(G.items[id].desc) : n ? txt(G.npcs[n].desc) : "You don't see that.");
  },
  use(a) {
    const id = find(a, inv(), G.items);
    if (!id) return print("You don't have that.");
    const u = (G.items[id].use || []).find(u => test(u.if));
    u ? run(u) : print("Nothing happens.");
  },
  talk(a) {
    const l = at(G.npcs), n = a ? find(a, l, G.npcs) : l[0];
    if (!n) return print("No one by that name is here.");
    G.npcs[n].dialogue ? node(n, "start") : print(`[${n}] doesn't respond.`);
  },
  wait() { print("Time passes."); },
  help() { print("Commands: " + Object.keys(CMDS).join(", ") + ". Directions: n, s, e, w, u, d."); },
  menu
};

// a command runs unless a "before" hook handles it first
const exec = (v, a = "") => HOOKS.before.some(h => h(v, a)) || CMDS[v](a);

function act(w) {
  if (S.talk) {
    if (/^\d+$/.test(w[0])) {
      const o = S.talk.opts[w[0] - 1], npc = S.talk.npc;
      if (!o) return print("Choose a number from the list.");
      S.talk = null; run(o); if (o.next && !S.over) node(npc, o.next); return;
    }
    S.talk = null; // any other command ends the conversation
  }
  let [v, ...r] = w; v = ALIAS[v] || v;
  if (DIRS[v] || Object.values(DIRS).includes(v)) { r = [v]; v = "go"; }
  if (S.over && v !== "menu") return print("The game is over. Type 'menu' to return to the start menu.");
  if (!CMDS[v]) return print("I don't understand that. Type 'help'.");
  if (!FREE.includes(v)) S.count.turns++;   // count before acting so marks stamp this turn
  exec(v, r.join(" "));
}

function parse(raw) {
  const w = raw.toLowerCase().trim().split(/\s+/).filter(x => x && !FILLER.includes(x));
  if (!w.length) return;
  print("> " + raw, "cmd");
  act(w);
  if (!S.talk) { events(); HOOKS.afterTurn.forEach(h => S.over || h()); }
  save();
}

const save = () => SAVE = S.over ? null : JSON.stringify(S);   // finished games can't be continued

function start() {
  S = { room: G.start, loc: {}, flags: {}, count: { turns: 0 }, mark: {}, fired: {}, talk: null, over: false };
  for (const T of [G.items, G.npcs]) for (const id in T) S.loc[id] = T[id].at ?? null;
  for (const a of ADDONS) if (a.state) S[a.name] = JSON.parse(JSON.stringify(a.state));
  print(G.title, "title"); print(txt(G.intro)); enter(G.start); events(); save();
}

function addon(a) {
  ADDONS.push(a);
  for (const [T, R] of [[a.commands, CMDS], [a.conditions, COND], [a.effects, EFFECT]])
    for (const k in T || {}) { if (k in R) CLASH.push(`addon ${a.name}: "${k}" is already defined`); R[k] = T[k]; }
  Object.assign(ALIAS, a.aliases); FREE.push(...(a.free || []));
  for (const h in HOOKS) if (a[h]) HOOKS[h].push(a[h]);
}

function validate() {
  const E = [...CLASH], room = r => r in G.rooms, thing = t => t in G.items || t in G.npcs;
  const need = (ok, path, msg) => ok || E.push(`${path}: ${msg}`);
  const used = { flag: {}, mark: {}, counter: {} }, made = { flag: {}, mark: {}, counter: { turns: 1 } };
  const walk = (v, p) => {
    if (typeof v === "string") return [...v.matchAll(/\[(\w+)\]/g)].forEach(m => need(thing(m[1]), p, `[${m[1]}] is not an item or NPC`));
    if (!v || typeof v !== "object") return;
    for (const k in v) {
      const x = v[k], q = Array.isArray(v) ? `${p}[${k}]` : p ? `${p}.${k}` : k;
      if (k === "if" || k === "not") for (const c in x) need(c in COND, `${q}.${c}`, `unknown condition "${c}"`);
      if (["has", "give", "take"].includes(k)) need(x in G.items, q, `no item "${x}"`);
      if (k === "here") need(thing(x), q, `no item or NPC "${x}"`);
      if (["in", "goto", "to"].includes(k)) need(room(x), q, `no room "${x}"`);
      if (k === "move") for (const id in x) { need(thing(id), q, `no item or NPC "${id}"`);
        [].concat(x[id]).forEach(r => need(r === null || r === "player" || room(r), q, `no room "${r}"`)); }
      if (k === "flag") used.flag[x] = q;
      if (k === "set" || k === "unset") made.flag[x] = 1;
      if (k === "mark") made.mark[x] = 1;
      if (k === "since") for (const m in x) used.mark[m] = q;
      if (k === "add") for (const c in x) made.counter[c] = 1;
      if (k === "min" || k === "max") for (const c in x) used.counter[c] = q;
      walk(x, q);
    }
  };
  need(room(G.start), "start", `no room "${G.start}"`);
  for (const r in G.rooms) for (const d in G.rooms[r].exits || {}) { const x = G.rooms[r].exits[d];
    if (typeof x === "string") need(room(x), `rooms.${r}.exits.${d}`, `no room "${x}"`); }
  for (const T of ["items", "npcs"]) for (const id in G[T]) { const a = G[T][id].at;
    need(a == null || a === "player" || room(a), `${T}.${id}.at`, `no room "${a}"`); }
  for (const id in G.items) need(!(id in G.npcs), `items.${id}`, "same id as an NPC");
  for (const n in G.npcs) { const D = G.npcs[n].dialogue; if (!D) continue;
    need(D.start, `npcs.${n}.dialogue`, `no "start" node`);
    for (const id in D) (D[id].options || []).forEach((o, i) =>
      need(!o.next || o.next in D, `npcs.${n}.dialogue.${id}.options[${i}].next`, `no node "${o.next}"`)); }
  walk(G, "");
  for (const t in used) for (const k in used[t]) need(made[t][k], used[t][k], `${t} "${k}" is checked but never set`);
  HOOKS.validate.forEach(h => h(need));
  return E;
}

function menu() { document.body.classList.remove("playing"); $("bs").hidden = false; $("bc").hidden = !SAVE; $("ask").hidden = true; }

function play(fresh) {
  document.body.classList.add("playing"); out.innerHTML = "";
  if (fresh) start(); else { S = JSON.parse(SAVE); S.talk = null; exec("look"); }
  inp.focus();
}

// boot runs after every script (including add-ons) has loaded
document.addEventListener("DOMContentLoaded", () => {
  $("f").onsubmit = e => { e.preventDefault(); parse(inp.value); inp.value = ""; };
  $("bs").onclick = () => SAVE ? ($("bs").hidden = $("bc").hidden = true, $("ask").hidden = false, $("bn").focus()) : play(true);
  $("by").onclick = () => play(true);
  $("bn").onclick = menu;
  $("bc").onclick = () => play(false);
  $("mt").textContent = document.title = G.title;
  const problems = validate();
  if (problems.length) { $("err").hidden = false; $("err").textContent = `Game data problems (${problems.length}):\n` + problems.join("\n"); console.error(problems); }
  menu();
});
