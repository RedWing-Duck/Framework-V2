/* =====================================================================
   ENGINE v2 — reuse as-is. Conditions, effects, commands and messages live
   in the COND, EFFECT, CMDS and MSG tables, which add-ons extend through
   addon({...}) and hooks (never by replacing engine functions).
   On load, validate() checks the game data and lists any problems on the
   start menu (and in the browser console) with the exact path.
   ===================================================================== */
const $ = id => document.getElementById(id), out = $("out"), inp = $("in");
const tbl = o => Object.assign(Object.create(null), o);   // no inherited keys: typing "constructor" finds nothing
const own = (o, k) => o && Object.hasOwn(o, k) ? o[k] : undefined;
const DIRS = tbl({ n: "north", s: "south", e: "east", w: "west", u: "up", d: "down", ne: "northeast", nw: "northwest", se: "southeast", sw: "southwest" });
const ALIAS = tbl({ z: "wait", l: "look", i: "inventory", inv: "inventory", x: "examine", get: "take", grab: "take",
  walk: "go", speak: "talk", put: "drop", h: "help", g: "again", q: "menu", quit: "menu" });
const PHRASAL = tbl({ "pick up": "take", "look at": "examine", "put down": "drop", "look around": "look" });
const FILLER = ["a", "an", "the", "to", "at", "with", "on"];
const PARTICLES = ["up", "down", "around", "under", "out", "off", "over", "through", "into", "in", "inside", "from", "behind", "beneath"];
const FREE = ["help", "menu", "restart", "again", "undo", "inventory"];   // commands that don't cost a turn
const ADDONS = [], CLASH = [], HOOKS = { input: [], before: [], afterTurn: [], start: [], end: [], text: [], tag: [], boot: [], validate: [] };
const REFS = tbl({}), META = ["if", "repeat", "every", "text", "next"], MAPS = tbl({ rooms: "def", items: "def", npcs: "def", kinds: "map",
  exits: "data", dialogue: "data", on: "data", verbs: "data", messages: "data", conds: "data", aliases: "data", phrasal: "data" });
let S, SAVE = null, UNDO = null, LAST = null, VERBS = new Set(), VER = "";
const LINE = { verb: "", said: "", it: null }, TURN = { free: false };   // the command being answered: for said:, {it} and free

// ---- messages: every line the engine prints. A game rewords any of them in G.messages (TEXT, variants and rotate work).
const MSG = tbl({
  huh: "I don't understand that. Type 'help'.", over: "The game is over. Type 'restart', 'undo' or 'menu'.",
  help: "Commands: {cmds}. Directions: n, s, e, w, u, d.\nFree actions: {free}.",
  cantGo: "You can't go that way.", blocked: "Something blocks the way.", goWhere: "Go where?",
  notHere: "You don't see that here.", notHave: "You don't have that.", what: "{Verb} what?", cant: "You can't {verb} that.",
  taken: "Taken: {it}", have: "You already have that.", fixed: "You can't take that.", dropped: "Dropped: {it}",
  carry: "You carry: {list}", carryNone: "You carry nothing.", nothing: "Nothing happens.", plain: "You see nothing special.",
  noOne: "No one by that name is here.", silent: "{it} doesn't respond.", choose: "Choose a number from the list.", wait: "Time passes.",
  see: "You see: {list}", people: "Here: {list}", exits: "Exits: {list}", received: "(Received: {it})", lost: "(Lost: {it})",
  noAgain: "There's nothing to do again yet.", noUndo: "There's nothing to undo.", undone: "Undone."
});
const msg = (k, vars) => txt(own(G.messages, k) ?? MSG[k], vars);

// ---- storage: localStorage when the browser allows it, namespaced by the game's title
const store = (k, v) => { try { v == null ? localStorage.removeItem(G.title + ":" + k) : localStorage.setItem(G.title + ":" + k, JSON.stringify(v)); } catch {} };
const load = k => { try { return JSON.parse(localStorage.getItem(G.title + ":" + k)); } catch { return null; } };

// ---- things: items, npcs, and G.self (the player as a target: "smell me")
const thing = id => own(G.items, id) || own(G.npcs, id) || (id === "self" ? G.self : undefined);
const words = s => String(s).toLowerCase().replace(/-/g, " ").split(/\s+/).filter(Boolean);
const phrases = id => { const o = thing(id); return [id, o.name, ...(o.aliases || []), ...(id === "self" ? ["me", "myself", "self"] : [])].map(n => words(n).join(" ")); };
// every thing in ids that the text names, in order; the longest phrase wins, then any single word of a name
function named(a, ids) {
  const w = words(a), hits = [];
  for (let i = 0; i < w.length; i++) {
    let id, j = w.length;
    for (; j > i && !id; j--) { const p = w.slice(i, j).join(" "); id = ids.find(x => phrases(x).includes(p)); }
    if (!id) { id = ids.find(x => words(thing(x).name).includes(w[i])); j = i; }
    if (id) { if (!hits.includes(id)) hits.push(id); i = j; }
  }
  return hits;
}
const find = (a, ids) => named(a, ids)[0];
const at = (T, place = S.room) => Object.keys(T || {}).filter(id => S.loc[id] === place);
const inv = () => at(G.items, "player");
const reach = () => [...inv(), ...at(G.items), ...at(G.npcs), ...(G.self ? ["self"] : [])];
const names = ids => ids.map(i => `[${i}]`).join(", ");
const all = (o, f) => Object.entries(o || {}).every(([k, n]) => f(S.count[k] || 0, n, k));
const list = v => [].concat(v);

function print(t, c, plain) {
  for (const h of HOOKS.text) t = h(t, c);
  if (!t) return;                                     // an empty line prints nothing (a message reworded to "")
  const p = document.createElement("p"); if (c) p.className = c;
  (plain ? [t] : t.split(/\[(\w+)\]/)).forEach((s, i) => {   // odd parts are ids from [id]
    const o = i % 2 && thing(s);
    if (!o) return p.append(i % 2 ? `[${s}]` : s);   // unknown id stays visible for the author
    const sp = document.createElement("span");
    sp.className = [own(G.npcs, s) ? "npc" : "item", ...HOOKS.tag.map(h => h(s))].filter(Boolean).join(" ");
    sp.textContent = o.name; p.append(sp);
  });
  out.append(p);
  while (out.children.length > 500) out.firstElementChild.remove();   // very long sessions stay fast
  out.scrollTop = out.scrollHeight;
}

// ---- TEXT: a string, or a list of variants; the first whose "if" passes is shown.
// A variant can rotate through lines ({ rotate:[...] }) or climb them and stay on the last ({ ladder:[...] }).
const SEQ = new WeakMap();   // rotate/ladder object -> stable id, assigned by validate()'s walk so saves keep their place
function pick(v) {
  for (const x of list(v ?? [])) {
    if (typeof x === "string") return x;
    if (!x || !test(x.if)) continue;
    const L = x.rotate || x.ladder;
    if (!L) return pick(x.text);
    const k = SEQ.get(x) ?? JSON.stringify(L).slice(0, 80), n = S.seq[k] || 0;
    S.seq[k] = n + 1;
    return pick(L[x.rotate ? n % L.length : Math.min(n, L.length - 1)]);
  }
  return "";
}
const cap = s => s[0].toUpperCase() + s.slice(1);
const txt = (v, vars = {}) => pick(v).replace(/\{(\w+)\}/g, (m, k) => k in vars ? vars[k]   // {counter} shows its value, {it} the thing
  : k === "it" ? (LINE.it ? `[${LINE.it}]` : "it") : k === "verb" || k === "Verb" ? (k === "Verb" ? cap(LINE.verb || "do") : LINE.verb) : S.count[k] || 0);

// ---- conditions: every key in an "if" must pass. "if" can also be a name from G.conds.
const COND = tbl({
  has: v => list(v).every(id => S.loc[id] === "player"),
  here: v => list(v).every(id => S.loc[id] === S.room),
  in: v => list(v).includes(S.room),                       // a list: any of these rooms
  flag: v => list(v).every(f => !!S.flags[f]),
  is: v => list(v).every(n => test(own(G.conds, n))),
  seen: v => list(v).every(id => !!S.seen[id]),            // examined at least once
  visited: v => list(v).every(r => !!S.been[r]),           // entered before (true from the first look's end)
  not: v => !test(v),
  any: l => l.some(c => test(c)),
  all: l => l.every(c => test(c)),
  min: o => all(o, (v, n) => v >= n),
  max: o => all(o, (v, n) => v <= n),
  eq: o => all(o, (v, n) => v === n),
  since: o => all(o, (v, n, k) => k in S.mark && S.count.turns - S.mark[k] >= n),
  said: p => list(p).every(q => q === "" ? !LINE.said : q.split("|").some(w => ` ${LINE.said} `.includes(` ${words(w).join(" ")} `)))
});
const test = c => !c ? true : typeof c === "string" ? COND.is(c) : Object.keys(c).every(k => !own(COND, k) || COND[k](c[k]));

// ---- effects: run in table order; say, do, goto and end always run last
const EFFECT = tbl({
  set: v => list(v).forEach(f => S.flags[f] = true),
  unset: v => list(v).forEach(f => delete S.flags[f]),
  add: o => { for (const k in o) S.count[k] = (S.count[k] || 0) + o[k]; },
  mark: v => list(v).forEach(m => S.mark[m] = S.count.turns),
  move: o => { for (const id in o) { const r = o[id];   // a list is a route: step to the next room
    S.loc[id] = Array.isArray(r) ? r[(r.indexOf(S.loc[id]) + 1) % r.length] : r; } },
  take: v => list(v).forEach(id => { S.loc[id] = null; print(msg("lost", { it: `[${id}]` }), "cmd"); }),
  give: v => list(v).forEach(id => { S.loc[id] = "player"; print(msg("received", { it: `[${id}]` }), "cmd"); }),
  free: v => { if (v && !TURN.free && TURN.cost) { TURN.free = true; S.count.turns--; } },   // this command costs no turn
  say: v => print(txt(v)),
  do: v => { const [c, ...r] = words(v); exec(c, r.join(" ")); },   // run a command: do:"look"
  goto: v => enter(v),
  end: v => { print(txt(v), "title"); S.over = true; HOOKS.end.forEach(h => h(v)); }
});
const LAST_FX = ["say", "do", "goto", "end"];
function run(e = {}) {
  if (typeof e === "string") e = { say: e };
  for (const k of [...Object.keys(EFFECT).filter(k => !LAST_FX.includes(k)), ...LAST_FX]) if (k in e && !S.over) EFFECT[k](e[k]);
}
// REPLY: a TEXT-like list of { if, ...EFFECT } entries (a string = { say }); the first that passes runs
function reply(r) {
  const e = list(r ?? []).find(x => typeof x === "string" || (x && test(x.if)));
  if (e === undefined) return false;
  run(e); return true;
}

function events() {
  const tick = S.count.turns !== S.tick; S.tick = S.count.turns;   // every: only on a turn that passed, not after free commands
  (G.events || []).forEach((e, i) => {
    if (S.over) return;
    const due = e.every ? tick && S.count.turns > 0 && S.count.turns % e.every === 0 : e.repeat || !S.fired[i];
    if (due && test(e.if)) { S.fired[i] = true; run(e); }
  });
}

function look() {
  const r = G.rooms[S.room], d = txt(r.desc), extra = T => at(T).filter(id => !T[id].hidden && !d.includes(`[${id}]`));
  const it = extra(G.items), np = extra(G.npcs), ex = Object.keys(r.exits || {}).filter(k => !r.exits[k].hidden);
  print(r.name, "title"); print(d);
  if (it.length) print(msg("see", { list: names(it) }));
  if (np.length) print(msg("people", { list: names(np) }));
  if (ex.length) print(msg("exits", { list: ex.join(", ") }));
}

function enter(id) { S.prev = S.room; S.room = id; exec("look"); S.been[id] = (S.been[id] || 0) + 1; }   // visited: true after the first look
const dest = x => typeof x === "string" ? x : x.to;
const notHere = (k = "notHere") => { EFFECT.free(true); print(msg(k)); };   // naming something that isn't here costs no turn

function go(a) {
  if (!a) return notHere("goWhere");
  const X = G.rooms[S.room].exits || {}, d = own(DIRS, a) || a;
  const k = own(X, d) ? d : Object.keys(X).find(k => {   // "go back", "go to the yard"
    const to = dest(X[k]); return a === "back" ? to === S.prev : to === a || (" " + words(G.rooms[to].name).join(" ")).endsWith(" " + a); });
  if (!k) return notHere("cantGo");
  const e = typeof X[k] === "string" ? { to: X[k] } : X[k];
  test(e.if) ? enter(e.to) : print(txt(e.fail) || msg("blocked"));
}

function node(npc, id) {
  const n = G.npcs[npc].dialogue[id], opts = (n.options || []).map((o, i) => i).filter(i => test(n.options[i].if));
  print(`[${npc}]: "${txt(n.text)}"`);
  S.talk = opts.length ? { npc, node: id, opts } : null;
  opts.forEach((o, i) => print(`${i + 1}. ${txt(n.options[o].text)}`, "cmd"));
}

// ---- commands: each gets the rest of the typed line and the things it names (in reach)
const CMDS = tbl({
  look(a) { if (a && !["around", "room", "here"].includes(a)) return exec("examine", a); look(); },
  go,
  take() {
    const id = LINE.it;
    if (!id) return notHere();
    if (S.loc[id] === "player") return notHere("have");
    if (thing(id).fixed || !own(G.items, id)) return print(msg("fixed"));
    S.loc[id] = "player"; print(msg("taken"));
  },
  drop() {
    const id = LINE.it;
    if (!id || S.loc[id] !== "player") return notHere("notHave");
    S.loc[id] = S.room; print(msg("dropped"));
  },
  inventory() { const i = inv(); print(i.length ? msg("carry", { list: names(i) }) : msg("carryNone")); },
  examine(a) {
    if (!a) return look();
    const id = LINE.it;
    if (!id) return notHere();
    print(txt(thing(id).desc) || msg("plain"));
  },
  use() { LINE.it ? print(msg("nothing")) : notHere(); },
  talk(a) {
    const n = a ? LINE.it : at(G.npcs)[0];
    if (!n) return notHere("noOne");
    own(G.npcs, n)?.dialogue ? node(n, "start") : print(msg("silent", { it: `[${n}]` }));
  },
  wait() { print(msg("wait")); },
  help() {
    const cmds = [...new Set([...Object.keys(CMDS), ...VERBS])].filter(c => !own(G.verbs, c)?.hidden);
    print(msg("help", { cmds: cmds.filter(c => !isFree(c)).join(", "), free: cmds.filter(isFree).join(", ") }));
  },
  again() { if (!LAST) return print(msg("noAgain")); print("> " + LAST.join(" "), "cmd", true); act(LAST); },
  undo() { if (!UNDO) return print(msg("noUndo")); S = JSON.parse(UNDO); UNDO = null; print(msg("undone")); look(); },
  restart: () => play(true),
  menu
});
const isFree = v => FREE.includes(v) || !!own(G.verbs, v)?.free;

// replies that can answer verb v: the named things' (last named first) and their kind's, then the room's,
// then (when nothing is named) the player's own (G.self: "think", "dance"), then the game's
function respond(v, ids) {
  for (const id of [...ids].reverse()) {
    const o = thing(id); LINE.it = id;
    if (reply(own(o.on, v)) || reply(own(own(G.kinds, o.kind), v))) return true;
  }
  LINE.it = ids.find(id => own(thing(id).on, v)) || ids[0] || null;
  return reply(own(G.rooms[S.room].on, v)) || (!ids.length && reply(own(G.self?.on, v))) || reply(own(G.on, v));
}

// run verb v on the text a: hooks, then replies, then the command itself, then the verb's fail line
function exec(v, a = "", said = a) {
  const keep = { ...LINE }, ids = named(a, reach());
  Object.assign(LINE, { verb: v, said: words(said).join(" "), it: ids.filter(id => own(thing(id).on, v)).at(-1) || ids[0] || null });
  try {
    if (HOOKS.before.some(h => h(v, a, ids))) return;
    if (respond(v, ids)) return;
    LINE.it = ids.filter(id => own(thing(id).on, v)).at(-1) || ids[0] || null;
    if (own(CMDS, v)) return CMDS[v](a, ids);
    if (a && !ids.length && named(a, Object.keys({ ...G.items, ...G.npcs })).length) return notHere();
    print(a ? txt(own(G.verbs, v)?.fail) || msg("cant") : msg("what"));
  } finally {
    if (v === "examine" && LINE.it) S.seen[LINE.it] = true;
    Object.assign(LINE, keep);
  }
}

const isDir = w => !!own(DIRS, w) || Object.values(DIRS).includes(w);
function act(w) {
  if (S.talk) {
    if (/^\d+$/.test(w[0])) {
      const { npc, node: id, opts } = S.talk, i = opts[w[0] - 1], o = G.npcs[npc].dialogue[id].options?.[i];
      if (!o) return print(msg("choose"));
      S.talk = null; run(o); if (o.next && !S.over) node(npc, o.next); return;
    }
    S.talk = null; // any other command ends the conversation
  }
  const two = w.slice(0, 2).join(" "), ph = own(G.phrasal, two) || own(PHRASAL, two);
  if (ph) w = [...words(ph), ...w.slice(2)];
  w = w.filter(x => !FILLER.includes(x));
  if (!w.length) return print(msg("huh"));
  let [v, ...r] = w; v = own(ALIAS, v) || v;
  if (isDir(v)) { r = [v]; v = "go"; }
  if (v === "go" && r.length === 1) r = [own(DIRS, r[0]) || r[0]];   // "d" is "down", for said: too
  if (v === "look" && ["under", "behind", "beneath", "in", "inside"].includes(r[0]) && VERBS.has("search")) v = "search";   // "look under the rug"
  if (["menu", "restart", "undo"].includes(v)) return CMDS[v](), true;   // no turn, no events
  if (S.over) return print(msg("over"));
  if (!own(CMDS, v) && !VERBS.has(v)) return print(msg("huh"));
  if (v !== "again" && v !== "undo") LAST = w;
  while (v !== "go" && r.length > 1 && PARTICLES.includes(r[0])) r.shift();   // "feel around the wall", "look under the rug"
  while (v !== "go" && r.length && PARTICLES.includes(r.at(-1))) r.pop();      // "put the hammer down", "feel around"
  TURN.cost = !isFree(v);
  if (TURN.cost) { UNDO = JSON.stringify(S); S.count.turns++; }   // count before acting so marks stamp this turn
  exec(v, r.join(" "), w.slice(1).join(" "));
}

function parse(raw) {
  raw = String(raw).slice(0, 200);
  let w = words(raw.replace(/[^\p{L}\p{N}'\s-]+/gu, " "));   // punctuation goes: "north." and "hello!" work
  if (!w.length && raw.trim() === "?") w = ["help"];
  if (!w.length) return;
  print("> " + raw, "cmd", true);                             // the echo stays literal: "[key]" is not a tag
  TURN.free = TURN.cost = false;
  for (const h of HOOKS.input) { const r = h(w, raw); if (r === true) return save(); if (Array.isArray(r)) w = r; }
  if (act(w) === true) return save();
  if (!S.talk) { events(); HOOKS.afterTurn.forEach(h => S.over || h()); }
  save();
}

// the continue slot: a snapshot after every command, kept in the browser too. A finished game can't be continued.
const save = () => { SAVE = S.over ? null : JSON.stringify(S); store("save", SAVE && { ver: VER, s: SAVE }); };

function start() {
  S = { room: G.start, prev: null, loc: {}, flags: {}, count: { turns: 0 }, mark: {}, fired: {}, seen: {}, been: {}, seq: {}, talk: null, over: false };
  for (const T of [G.items, G.npcs]) for (const id in T) S.loc[id] = T[id].at ?? null;
  for (const a of ADDONS) if (a.state) S[a.name] = JSON.parse(JSON.stringify(a.state));
  UNDO = LAST = null;
  HOOKS.start.forEach(h => h());
  print(G.title, "title"); print(txt(G.intro)); enter(G.start); events(); save();
}

function addon(a) {
  ADDONS.push(a);
  for (const [T, R] of [[a.commands, CMDS], [a.conditions, COND], [a.effects, EFFECT], [a.messages, MSG], [a.refs, REFS]])
    for (const k in T || {}) { if (k in R) CLASH.push(`addon ${a.name}: "${k}" is already defined`); R[k] = T[k]; }
  Object.assign(ALIAS, a.aliases); Object.assign(PHRASAL, a.phrasal); Object.assign(MAPS, a.maps);
  FREE.push(...(a.free || [])); META.push(...(a.meta || []));
  for (const h in HOOKS) if (a[h]) HOOKS[h].push(a[h]);
}

function validate() {
  const E = [...CLASH], room = r => !!own(G.rooms, r), isThing = t => !!thing(t);
  const need = (ok, path, m) => ok || E.push(`${path}: ${m}`);
  const used = { flag: {}, mark: {}, counter: {} }, made = { flag: {}, mark: {}, counter: { turns: 1 } };
  const conds = (c, p) => { if (c && typeof c === "object" && !Array.isArray(c)) for (const k in c) need(own(COND, k), `${p}.${k}`, `unknown condition "${k}"`); };
  const fx = (e, p) => { if (e && typeof e === "object") for (const k in e) need(own(EFFECT, k) || META.includes(k), `${p}.${k}`, `unknown effect "${k}"`); };
  let seq = 0;
  // mode: "def" (a definition: its keys are fields), "data" (keys are conditions and effects), "map:<child mode>" (keys are names)
  const walk = (v, p, mode) => {
    if (typeof v === "string") return [...v.matchAll(/\[(\w+)\]/g)].forEach(m => need(isThing(m[1]), p, `[${m[1]}] is not an item or NPC`));
    if (!v || typeof v !== "object") return;
    if (v.rotate || v.ladder) SEQ.set(v, "s" + seq++);
    for (const k in v) {
      const x = v[k], q = Array.isArray(v) ? `${p}[${k}]` : p ? `${p}.${k}` : k;
      if (mode.startsWith("map:")) { walk(x, q, mode.slice(4) === "map" ? "map:data" : mode.slice(4)); continue; }
      if (mode === "def") { walk(x, q, own(MAPS, k) ? "map:" + MAPS[k] : k === "self" ? "def" : "data"); continue; }
      {
        if (k === "if") typeof x === "string" ? need(own(G.conds, x), q, `no condition "${x}" in conds`) : conds(x, q);
        if (k === "not") conds(x, q);
        if (k === "any" || k === "all") list(x).forEach((c, i) => conds(c, `${q}[${i}]`));
        if (["has", "give", "take"].includes(k)) list(x).forEach(id => need(own(G.items, id), q, `no item "${id}"`));
        if (k === "here" || k === "seen") list(x).forEach(id => need(isThing(id), q, `no item or NPC "${id}"`));
        if (["in", "goto", "to", "visited"].includes(k)) list(x).forEach(r => need(room(r), q, `no room "${r}"`));
        if (k === "is") list(x).forEach(n => need(own(G.conds, n), q, `no condition "${n}" in conds`));
        if (k === "move") for (const id in x) { need(isThing(id), q, `no item or NPC "${id}"`);
          list(x[id]).forEach(r => need(r === null || r === "player" || room(r), q, `no room "${r}"`)); }
        if (k === "flag") list(x).forEach(f => used.flag[f] = q);
        if (k === "set" || k === "unset") list(x).forEach(f => made.flag[f] = 1);
        if (k === "mark") list(x).forEach(m => made.mark[m] = 1);
        if (k === "since") for (const m in x) used.mark[m] = q;
        if (k === "add") for (const c in x) made.counter[c] = 1;
        if (["min", "max", "eq"].includes(k)) for (const c in x) used.counter[c] = q;
        if (own(REFS, k)) REFS[k](x, (ok, m) => need(ok, q, m));
      }
      if (!["add", "min", "max", "eq", "since", "move"].includes(k)) walk(x, q, "data");   // their keys are names
    }
  };
  need(room(G.start), "start", `no room "${G.start}"`);
  for (const r in G.rooms) for (const d in G.rooms[r].exits || {}) need(room(dest(G.rooms[r].exits[d])), `rooms.${r}.exits.${d}`, `no room "${dest(G.rooms[r].exits[d])}"`);
  for (const T of ["items", "npcs"]) for (const id in G[T]) { const a = G[T][id].at;
    need(a == null || a === "player" || room(a), `${T}.${id}.at`, `no room "${a}"`);
    need(typeof G[T][id].name === "string", `${T}.${id}.name`, "needs a name"); }
  for (const id in G.items) need(!(id in (G.npcs || {})), `items.${id}`, "same id as an NPC");
  for (const n in G.npcs) { const D = G.npcs[n].dialogue; if (!D) continue;
    need(D.start, `npcs.${n}.dialogue`, `no "start" node`);
    for (const id in D) (D[id].options || []).forEach((o, i) => { const p = `npcs.${n}.dialogue.${id}.options[${i}]`;
      need(!o.next || o.next in D, `${p}.next`, `no node "${o.next}"`); fx(o, p); }); }
  // replies and events: every key must be an effect (catches typos like "sey")
  const replies = (on, p) => { for (const v in on || {}) list(on[v]).forEach((e, i) => fx(e, `${p}.${v}[${i}]`)); };
  for (const T of ["rooms", "items", "npcs"]) for (const id in G[T]) replies(G[T][id].on, `${T}.${id}.on`);
  replies(G.on, "on"); replies(G.self?.on, "self.on");
  for (const k in G.kinds || {}) replies(G.kinds[k], `kinds.${k}`);
  (G.events || []).forEach((e, i) => fx(e, `events[${i}]`));
  for (const c in G.conds || {}) conds(G.conds[c], `conds.${c}`);
  for (const k in G.messages || {}) need(k in MSG, `messages.${k}`, `no engine message "${k}"`);
  for (const v in G.verbs || {}) for (const w of G.verbs[v].aliases || []) need(!own(ALIAS, w) || ALIAS[w] === v, `verbs.${v}.aliases`, `"${w}" is already a command or alias`);
  walk(G, "", "def");
  for (const t in used) for (const k in used[t]) need(made[t][k], used[t][k], `${t} "${k}" is checked but never set`);
  HOOKS.validate.forEach(h => h(need));
  return E;
}

function menu() { document.body.classList.remove("playing"); $("bs").hidden = false; $("bc").hidden = !SAVE; $("ask").hidden = true; }

function play(fresh) {
  document.body.classList.add("playing"); out.innerHTML = "";
  if (fresh) start(); else { S = JSON.parse(SAVE); S.talk = null; UNDO = LAST = null; look(); }
  inp.focus();
}

// boot runs after every script (including add-ons) has loaded
document.addEventListener("DOMContentLoaded", () => {
  // every verb named in a reply map or G.verbs is a command; G.aliases and verbs.X.aliases are more words for one
  const ons = [G, G.self, ...Object.values(G.rooms), ...Object.values(G.items || {}), ...Object.values(G.npcs || {})].map(o => o?.on);
  for (const o of [...ons, ...Object.values(G.kinds || {}), G.verbs]) for (const v in o || {}) VERBS.add(v);
  for (const v in G.verbs || {}) for (const w of G.verbs[v].aliases || []) if (!own(ALIAS, w)) ALIAS[w] = v;
  for (const w in G.aliases || {}) ALIAS[w] = G.aliases[w];
  VER = [Object.keys(G.rooms), Object.keys(G.items || {}), Object.keys(G.npcs || {}), (G.events || []).length].join("|");
  inp.maxLength = 200;
  $("f").onsubmit = e => { e.preventDefault(); parse(inp.value); inp.value = ""; };
  $("bs").onclick = () => SAVE ? ($("bs").hidden = $("bc").hidden = true, $("ask").hidden = false, $("bn").focus()) : play(true);
  $("by").onclick = () => play(true);
  $("bn").onclick = menu;
  $("bc").onclick = () => play(false);
  $("mt").textContent = document.title = G.title;
  const problems = validate();
  if (problems.length) { $("err").hidden = false; $("err").textContent = `Game data problems (${problems.length}):\n` + problems.join("\n"); console.error(problems); }
  const d = load("save");   // a save from another version of the game (different rooms, items or events) is ignored
  if (d?.ver === VER && typeof d.s === "string") try { const s = JSON.parse(d.s); if (own(G.rooms, s.room) && s.loc && s.count && !s.over) SAVE = d.s; } catch {}
  HOOKS.boot.forEach(h => h());
  menu();
});
