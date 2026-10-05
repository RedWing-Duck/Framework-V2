// This Place Has a Big Footprint, rebuilt on Framework v2: the original game's regression suite
// (QA rounds 1-4), run against the v2 build. Loaded by tests/run.js.
// Nine of these tests (15 assertions) had gone stale in the original repository: the Script changed after they were
// written (the run report joined every ending, Nando got a line for after you've run, xyzzy got an answer,
// graded wrong attempts replaced generic ones...). The original build fails them too, with the same output
// as this one. Each is updated to the shipped Script and marked "stale in the original suite".
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const { load } = require("../tools/headless"), { build } = require("../tools/build");

// ---- big-footprint (Week 01)
const BF = fs.readFileSync(path.join(__dirname, "../dist/big-footprint.html"), "utf8");
const bigfoot = () => { const g = load(BF).boot(); g.click("bs"); return g; };

test("big-footprint: dist is up to date and validates clean", () => {
  assert.equal(BF, build("games/big-footprint"), "run: node tools/build.js big-footprint");
  assert.deepEqual(load(BF).boot().problems(), []);
});

const TOUR = ["n", "w", "e", "e", "w", "n", "say both", "s", "u", "e", "say dog-eared page", "w", "w", "n", "n", "n"];
const ESCAPE = ["open giraffe gate", "s", "s", "use gold coin on hippo", "s", "run", "e", "d", "say giraffe", "push thirteenth step"];

test("big-footprint A: every room can be visited; help and quit work", () => {
  const g = bigfoot(), seen = new Set([g.get("S.room")]);
  for (const c of [...TOUR, "e"]) { g.type(c); seen.add(g.get("S.room")); }
  assert.equal(seen.size, 12, [...seen].join(","));
  g.type("help");
  assert.match(g.last(), /^Move: north/);
  g.type("quit");
  assert.equal(g.playing(), false, "quit returns to the start menu");
});

test("big-footprint B: critical path wins with 2 secrets and 6 turns to spare (W1)", () => {
  const g = bigfoot();
  g.type(...TOUR);
  assert.equal(g.get("S.count.clock"), 18, "the clock starts at 18 on entering R11");
  g.type(...ESCAPE, "s");
  assert.equal(g.get("S.count.clock"), 7);
  g.type("d");
  assert.match(g.last(), /^CLEAN GETAWAY[\s\S]*2\/3\.\n\nRUN REPORT\n/);   // stale in the original suite: the run report follows
  assert.equal(g.get("S.over"), true);
});

test("big-footprint B: the piano detour wins with all 3 secrets (W2)", () => {
  const g = bigfoot();
  g.type(...TOUR, ...ESCAPE, "e", "play cielito lindo", "w", "s", "d");
  assert.deepEqual(["ledger", "manifest", "photos"].map(i => g.get(`S.loc.${i}`)), ["player", "player", "player"]);
  assert.match(g.last(), /^CLEAN SWEEP[\s\S]*Perfect run\.\n\nRUN REPORT\n/);   // stale in the original suite: the run report follows
});

test("big-footprint B: tour rules: the Don blocks other exits and the elevator; free commands cost nothing", () => {
  const g = bigfoot();
  g.type("d");
  assert.match(g.last(), /Leaving before dessert/);
  g.type("n", "n");
  assert.match(g.last(), /Private, amigo/);
  assert.equal(g.get("S.room"), "foyer");
  const t = g.get("S.count.turns");
  g.type("look", "examine staircase", "inventory", "status", "hint", "help");
  assert.equal(g.get("S.count.turns"), t);
  g.type("xyzzy");
  assert.equal(g.get("S.count.turns"), t, "unrecognized commands cost nothing");
  g.type("w", "e", "e", "w", "n", "s");
  assert.match(g.last(), /Sunday gravy\?"$/, "the Don won't move on until Q1 is answered");
  assert.equal(g.get("S.room"), "dining");
});

test("big-footprint B: three strikes blow your cover (L1); examine is safe", () => {
  const g = bigfoot();
  g.type("n", "w", "examine rifle", "take gold rifle");
  assert.match(g.last(), /smile tightens/);
  g.type("touch rifle");
  assert.match(g.last(), /smile is gone/);
  g.type("e", "e", "w", "n", "say pozole");
  assert.match(g.last(), /^COVER BLOWN/);
});

test("big-footprint B: a wrong answer at a checkpoint gets you caught (L2)", () => {
  const g = bigfoot();
  g.type(...TOUR, "s", "s", "s", "status", "hint");
  assert.equal(g.get("S.over"), false, "free commands are safe at a checkpoint");
  g.type("say jaguar");
  assert.match(g.last(), /^CAUGHT/);
});

test("big-footprint B: second run is not allowed (L2); restart starts over", () => {
  const g = bigfoot();
  g.type(...TOUR, "open jaguar gate", "s", "s", "s", "run", "e", "d", "run");
  assert.match(g.last(), /^CAUGHT/);
  g.type("look");
  assert.equal(g.get("S.over"), true);
  g.type("restart");
  assert.equal(g.get("S.over"), false);
  assert.equal(g.get("S.room"), "elevator");
});

test("big-footprint B: the Bigfoot clock runs out (L3) with warnings at 6, 3 and 1", () => {
  const g = bigfoot();
  g.type(...TOUR);
  for (let i = 0; i < 18; i++) g.type("open giraffe gate");
  for (const w of ["a thud rattles the chandeliers", "A roar, closer now", "The floor shakes"]) assert.ok(g.lines().some(l => l.includes(w)), w);
  assert.match(g.last(), /^BIG FOOTPRINT[\s\S]*RESTART to try again/);
});

test("big-footprint B: puzzles: wrong attempts keep the item; elevator needs 2 secrets", () => {
  const g = bigfoot();
  g.type(...TOUR, "s", "s", "open hippo", "use card on hippo");
  assert.ok(g.lines().includes("Pepita keeps her mouth shut. She only opens up for one thing."));   // stale in the original suite: E2 graded lines
  assert.ok(g.lines().includes("Pepita doesn't read."));
  assert.equal(g.get("S.loc.card"), "player");
  g.type("s", "run", "e", "d", "say peacocks");
  assert.match(g.last(), /^CAUGHT/, "an unreleased animal is no alibi");
  const h = bigfoot();
  h.type(...TOUR, "s", "open aviary", "s", "use coin on hippo", "s", "run", "e", "d", "say peacocks", "s", "d");
  assert.match(h.last(), /One secret isn't a case/);   // stale in the original suite: PT-14 split the 0- and 1-secret lines
  assert.equal(h.get("S.over"), false);
});

test("big-footprint C: Script text: intro, unknown-command rotation, game-over prompt, escape exits by landmark", () => {
  const g = bigfoot();
  assert.equal(g.lines()[0], "THIS PLACE HAS A BIG FOOTPRINT");
  assert.match(g.lines()[1], /^A Retroment Gaming production\./);
  g.type("xyzzy", "frobnicate", "blarg", "zork");
  assert.deepEqual(g.lines().filter(l => !l.startsWith("> ")).slice(-4).map(l => l.slice(0, 12)),
    ["A hollow voi", "You try that", "That doesn't", "Nice try, de"]);   // stale in the original suite: xyzzy has its own line
  assert.ok(g.lines().some(l => l.startsWith("Exits: ")), "the tour shows compass exits");
  g.type(...TOUR, "s");
  assert.match(g.lines().at(-2), /the other smells of chlorine\.$/);   // stale in the original suite: a band line follows
  assert.ok(!g.lines().slice(-3).some(l => l.startsWith("Exits: ")), "the escape names exits by landmark only");
  g.type("s", "s", "look", "say peacocks");
  g.type("look");
  assert.equal(g.last(), "The story's over, detective. RESTART or QUIT.");
});

// ---- Regression: the verified walkthrough from Critical Path QA, step by step. Rerun every week.
// [command, expected Bigfoot clock after it (null = tour, clock off), text the step must print]
const WALKTHROUGH = [
  ["north", null], ["west", null], ["east", null], ["east", null], ["west", null],
  ["north", null, "Sunday gravy?"], ["say both", null, "Both!"], ["south", null], ["up", null],
  ["east", null, "bookstore called"], ["say dog-eared page", null, "He flips you a GOLD COIN."],
  ["west", null], ["west", null], ["north", null], ["north", null], ["north", 18],
  ["open giraffe gate", 17, "Perfect alibi: GIRAFFE."], ["south", 16], ["south", 15],
  ["use gold coin on hippo", 14, "You fish out the SHIPPING MANIFEST. Secrets: 1 of 3."], ["south", 13, "Why are you up here?"],
  ["run", 12, "You bolt."], ["east", 11], ["down", 10, "Why are you down here this time?"] /* stale in the original suite: greet2ran */, ["say giraffe", 9, "sprints up the stairs shouting into his radio."] /* stale in the original suite: E4, the foyer's own alibi line */,
  ["push thirteenth step", 8, "holds the DEAL PHOTOS. Secrets: 2 of 3."], ["south", 7]
];
const walk = (g, steps) => steps.forEach(([cmd, clock, says], i) => {
  const n = g.lines().length; g.type(cmd);
  const out = g.lines().slice(n).join("\n");
  assert.equal(g.get("S.over"), false, `step ${i + 1} (${cmd}) ended the game:\n${out}`);
  if (clock !== null) assert.equal(g.get("S.count.clock"), clock, `step ${i + 1} (${cmd}): clock`);
  else assert.equal(g.get("S.flags.escape || false"), false, `step ${i + 1} (${cmd}): still on the tour`);
  if (says) assert.ok(out.includes(says), `step ${i + 1} (${cmd}) should print "${says}", got:\n${out}`);
  assert.equal(g.get("S.count.strikes || 0"), 0, `step ${i + 1} (${cmd}): no strikes`);
});

test("regression: verified walkthrough, steps 1-28, ends CLEAN GETAWAY 2/3", () => {
  const g = bigfoot();
  walk(g, WALKTHROUGH);
  g.type("down");
  assert.match(g.last(), /^CLEAN GETAWAY[\s\S]*Secrets recovered: 2\/3\.\n\nRUN REPORT\n/);   // stale in the original suite: the run report follows
});

test("regression: W2 branch (26a-26c) ends CLEAN SWEEP 3/3", () => {
  const g = bigfoot();
  walk(g, [...WALKTHROUGH.slice(0, 26), ["east", 7], ["play cielito lindo", 6, "holding a LEDGER bound in rubber bands. Secrets: 3 of 3."], ["west", 5], ["south", 4]]);
  assert.ok(g.lines().includes("Somewhere behind you, a thud rattles the chandeliers."), "clock 6 warning");
  g.type("down");
  assert.match(g.last(), /^CLEAN SWEEP[\s\S]*3\/3\. Perfect run\.\n\nRUN REPORT\n/);   // stale in the original suite: the run report follows
});

test("BR-01: punctuation in typed input is ignored", () => {
  const g = bigfoot();
  g.type("north.", "west!", "east", "east", "west", "north");
  assert.equal(g.get("S.room"), "dining");
  g.type('say "both."');
  assert.ok(g.get("S.flags.q1"), "Q1 accepts say \"both.\"");
  assert.equal(g.get("S.count.strikes || 0"), 0);
  const h = bigfoot();
  h.type(...TOUR);
  h.type("open giraffe gate", "s", "s", "s", "run", "e", "d", "say giraffe!");
  assert.equal(h.get("S.over"), false, "Nando accepts the alibi");
  h.type("push 13th step.");
  assert.equal(h.get("S.loc.photos"), "player");
  h.type("e", "play cielito lindo...");
  assert.equal(h.get("S.loc.ledger"), "player");
  h.type("w", "s", "restart!");
  assert.equal(h.get("S.room"), "elevator", "restart works with punctuation");
});

test("P2s: BR-02 free 'already have', ED-01 escalating quiz lines, ED-02/03 state text, ED-05 secret count", () => {
  const g = bigfoot();
  g.type("n", "w", "e", "e", "w", "n", "say pozole");
  assert.match(g.last(), /His smile tightens/);
  g.type("say gravy");
  assert.match(g.last(), /^The smile is gone\. "Twice now, Walter/);
  const h = bigfoot();
  h.type(...TOUR.slice(0, 11));
  const t = h.get("S.count.turns");
  h.type("take coin");
  assert.equal(h.last(), "You already have that.");
  assert.equal(h.get("S.count.turns"), t, "costs no turn");
  h.type(...TOUR.slice(11), "open jaguar gate", "look");
  assert.match(h.lines().at(-2), /giraffe peers over[\s\S]*JAGUAR GATE swings in the wind/);   // stale in the original suite: a band line follows
  h.type("s", "s", "use coin on hippo");
  assert.match(h.last(), /Secrets: 1 of 3\.$/);
  h.type("look");
  assert.ok(h.lines().slice(-3).some(l => /jaw hanging open/.test(l)));   // stale in the original suite: ESC_REVISIT text, then tails and band
  h.type("help");
  assert.match(h.last(), /In a tight spot: run \(works once\)\./);
});

test("P3s: parser (BR-03/05/06/09/10/11), nudges (BR-08, CP-02/03), no confused line before CAUGHT (CP-01)", () => {
  const g = bigfoot();
  g.type("[don]");
  assert.ok(g.lines().includes("> [don]"), "BR-11: the echo stays literal");
  g.type("n", "look at staircase");
  assert.match(g.last(), /twelve steps up/, "BR-05, ED-19");
  g.type("w", "e", "e", "w", "n", "say");
  assert.equal(g.get("S.count.strikes || 0"), 0, "BR-03: an empty say is no strike");
  g.type("talk to don");
  assert.match(g.last(), /Sunday gravy\?"$/, "BR-09");
  g.type("say definitely not both");
  assert.equal(g.get("S.count.strikes"), 1, "BR-04");
  g.type("say both", "s", "go upstairs");
  assert.equal(g.get("S.room"), "landing", "BR-06");
  g.type("e", "say dog-eared page", "give coin to don");
  assert.match(g.last(), /A dividend is not a loan/, "BR-10, then PT-02: give works like show");   // stale in the original suite
  g.type("w", "w", "n", "n", "n");
  const t = g.get("S.count.turns");
  g.type("run", "open gate", "x lemurs");
  assert.equal(g.get("S.count.turns"), t, "BR-08, CP-02: nudges are free");
  assert.equal(g.last(), "A troop of lemurs sprinting along the hedges, stealing anything shiny. One of them is wearing the Don's reading glasses.", "BR-07, then Script rev 3's noun line");   // stale in the original suite
  g.type("s", "s", "s", "say jaguar");
  assert.match(g.lines().at(-1), /^CAUGHT/);
  assert.ok(!g.lines().at(-2).startsWith("You try that"), "CP-01");
});

test("QA-01: 'say peacock' (singular) is accepted at a checkpoint", () => {
  const g = bigfoot();
  g.type(...TOUR, "s", "open aviary", "s", "s", "say peacock");
  assert.equal(g.get("S.over"), false);
  assert.match(g.last(), /Nando sprints toward it\./);   // stale in the original suite: E4 alibi lines by checkpoint
});

// ---- Polish (Script rev 3). Milestone A: coverage, built from the game's own noun data.
const BAD = [/^I don't understand/, /^You try that\. The universe/, /^That doesn't make sense, even/, /^Nice try, detective/,
  /^Nothing like that around here\.$/, /^You don't see that/];
const TIER1 = ["take", "touch", "push", "pull", "open", "close", "knock", "sit on", "climb"];
const STATE = { P1: "S.flags.p1 = true", P2: "S.flags.p2 = true", P3: "S.flags.p3 = true", CP7_DONE: "S.flags.cp7_done = true" };
test("Polish A: coverage: every noun, every word, both phases, examine + Tier 1 verbs never get a confused line", t => {
  const g = bigfoot(), nouns = g.get("G.nouns"), rooms = Object.keys(g.get("G.rooms")), fails = [];
  let tried = 0;
  for (const phase of ["TOUR", "ESCAPE"]) for (const [id, n] of Object.entries(nouns)) {
    const keys = (n.examine || []).map(l => l[0]);
    if (!keys.some(k => !k || k === phase || k.startsWith(phase + "&") || k in STATE)) continue;
    const where = n.at === "any" ? rooms.filter(r => phase === "ESCAPE" || !["terrace", "enclosure"].includes(r)) : [n.at];
    if (phase === "TOUR" && ["terrace", "enclosure"].includes(n.at)) continue;
    const setup = keys.filter(k => k in STATE && !keys.some(x => !x || x === phase)).map(k => STATE[k]).join(";");
    for (const room of where) {
      g.run(`S.over = false; S.room = ${JSON.stringify(room)}; S.flags = {}; S.count = { turns: 5, strikes: 0, clock: 18, secrets: 0 };
        S.loc.don = ${phase === "TOUR" ? JSON.stringify(room) : "null"}; S.loc.nando = null;
        ${phase === "ESCAPE" ? "S.flags.escape = true; S.mark.tick = 5;" : ""} ${setup}; globalThis.__snap = JSON.stringify(S);`);
      for (const cmd of [...n.words.map(w => "examine " + w), ...TIER1.map(v => `${v} ${n.words[0]}`)]) {
        g.run("S = JSON.parse(__snap)");
        const k = g.lines().length; g.type(cmd); tried++;
        const out = g.lines().slice(k + 1);
        if (!out.length || out.some(l => BAD.some(b => b.test(l)))) fails.push(`${phase} ${room} ${id}: "${cmd}" -> ${out.join(" / ") || "(nothing)"}`);
      }
    }
  }
  t.diagnostic(`${tried} commands tried`);
  assert.deepEqual(fails, []);
});

test("Polish A: x lemur, smell humidor, look under table answer in voice; strike verbs only on strike objects", () => {
  const g = bigfoot();
  g.type("n", "w", "e", "e", "w", "n", "look under table");
  assert.match(g.last(), /Gum\? In this house\?/);
  g.type("say both", "s", "u", "e", "smell humidor");
  assert.equal(g.last(), "Cedar, tobacco, and a little bit of money.");
  const h = bigfoot();
  h.type(...TOUR, "s", "s", "s", "s", "s", "d", "say jaguar");   // nothing released: CAUGHT is fine, we only need ESCAPE text
  const e = bigfoot();
  e.type(...TOUR, "s", "s", "s", "run", "e", "d");
  e.run("S.flags.checkpoint = false"); e.type("n", "x lemur");
  assert.match(e.last(), /eats another grape, slowly, at you/);
  const s = bigfoot();
  s.type("n", "touch banister", "sit on piano bench", "w", "e", "e", "sit on bench", "pull keys");
  assert.equal(s.get("S.count.strikes"), 1, "banister and bench are no strike; the piano keys are");
  const t0 = s.get("S.count.turns");
  s.type("smell", "listen", "search bench", "dance");
  assert.equal(s.get("S.count.turns"), t0, "info verbs are free; new verbs on the tour cost no turn");
});

// ---- Polish B: state (one test per state key that changes text)
const toEscape = () => { const g = bigfoot(); g.type(...TOUR); return g; };
test("Polish B: OUT_GIRAFFE, P2, COIN_HELD, Q1: nouns follow state", () => {
  const g = toEscape();
  g.type("open giraffe gate", "s", "s", "x hippo");
  assert.match(g.last(), /The coin in your pocket suddenly feels heavy/, "COIN_HELD");
  g.type("use coin on hippo", "x hippo");
  assert.match(g.last(), /jaw hangs open/, "P2");
  g.type("s", "run", "e", "d", "say giraffe", "x banister");
  assert.match(g.last(), /giraffe's head rests on the upper banister/, "OUT_GIRAFFE");
  const q = bigfoot();
  q.type("n", "w", "e", "e", "w", "n", "x pots");
  assert.match(q.last(), /^On the sideboard, two pots/);
  q.type("say both", "x pots");
  assert.equal(q.last(), "Two pots, one family. You get it now.", "Q1");
});

test("Polish B: GDD 12.1 D3: talk, ask and examine Nando at a checkpoint are free and keep it open", () => {
  const g = toEscape();
  g.type("s", "s", "s");
  const clock = g.get("S.count.clock");
  g.type("talk to nando", "ask nando about peacocks", "x nando", "talk", "x guard");
  assert.equal(g.get("S.over"), false);
  assert.equal(g.get("S.flags.checkpoint"), true, "still stopped");
  assert.equal(g.get("S.count.clock"), clock, "no turn spent");
  assert.ok(g.lines().some(l => l === "\"Not a conversation, friend. Why are you here?\""), "repeat lines rotate");
  g.type("run");
  assert.equal(g.get("S.flags.checkpoint || false"), false, "run clears it");
});

test("Polish B: CAUGHT_BY openers (D4) and STRIKE3_BY is recorded", () => {
  const cases = [["say jaguar", /No animal\. No noise/], ["e", /hand the size of a skillet/], ["dance", /doesn't wait for you to finish/], ["give card to nando", /zip-ties you anyway/]];
  for (const [cmd, opener] of cases) {
    const g = toEscape(); g.type("s", "s", "s", cmd);
    assert.match(g.last(), /^CAUGHT\n\n/, cmd); assert.match(g.last(), opener, cmd);
    assert.equal(g.lines().at(-2), "> " + cmd, "nothing prints between the command and CAUGHT");
  }
  const u = toEscape(); u.type("open jaguar gate", "s", "s", "s", "say jaguar", "e", "d", "say jaguar");
  assert.match(u.last(), /I just put that thing back/, "USED");
  const r = toEscape(); r.type("s", "s", "s", "run", "e", "d", "run");
  assert.match(r.last(), /this time nothing lands on his head/, "RUN2");
  const s = bigfoot(); s.type("n", "w", "take rifle", "kick rifle", "pull rifle");
  assert.equal(s.get("S.nouns.notes.STRIKE3_BY"), "RIFLE");
  const q = bigfoot(); q.type("n", "w", "take rifle", "e", "e", "touch piano", "w", "n", "say neither");
  assert.equal(q.get("S.nouns.notes.STRIKE3_BY"), "Q1");
});

test("Polish B: STRIKES tiers: the Don's pass, talk, examine and topics cool off", () => {
  const g = bigfoot();
  g.type("n", "talk to don");
  assert.equal(g.last(), "\"Look around, Walter. Every stone in this floor, I earned.\"");
  g.type("w", "touch rifle", "talk to don");
  assert.match(g.last(), /We talk later, Walter/, "STRIKES=1");
  g.type("push rifle", "e");
  assert.equal(g.last(), "The Don doesn't slow down or look back. \"Keep up.\"", "PASS at STRIKES=2");
  g.type("x don");
  assert.match(g.last(), /He's looking at you\.$/);
  g.type("ask don about piano", "ask don about hippo");
  assert.deepEqual(g.lines().slice(-3).filter(l => !l.startsWith(">")), ["\"No more questions.\"", "He doesn't answer. He just keeps walking."]);
});

test("Polish B: ESC_REVISIT, tails, foreshadowing and Nando's traces", () => {
  const g = toEscape();
  g.type("s", "s");
  assert.ok(g.lines().includes("Past the fountain, a flashlight beam slides along the portraits in the gallery. Someone's waiting."));
  g.type("s", "run", "n");
  assert.ok(g.lines().some(l => l.startsWith("Pepita the HIPPO again, mouth shut")), "ESC_REVISIT");
  g.type("s");
  assert.ok(g.lines().some(l => l.startsWith("Nando's cap lies upside down")), "CP7_DONE trace");
  g.type("e");
  assert.ok(g.lines().includes("Below, a flashlight beam sweeps the foyer, back and forth, back and forth. Someone's down there."), "CP2 foreshadow");
});

test("Polish B: clock bands and turn feedback never repeat back to back; bands follow the clock", () => {
  const g = toEscape(), bands = [], fb = g.get("G.feedback");
  for (let i = 0; i < 6; i++) { g.type("look"); bands.push(g.last()); }
  for (let i = 1; i < bands.length; i++) assert.notEqual(bands[i], bands[i - 1]);
  const said = [];
  for (let i = 0; i < 6; i++) { g.type("dance"); said.push(g.last()); }
  assert.ok(said.every(l => fb.includes(l)), "feedback follows a reply that changed nothing");
  for (let i = 1; i < said.length; i++) assert.notEqual(said[i], said[i - 1]);
  g.run("S.count.clock = 3"); g.type("look");
  assert.ok(!g.lines().slice(-3).some(l => /Footsteps on the stairs|A shadow on the terrace/.test(l)), "PT-05: no band line on a warning turn");
  g.type("look");
  assert.ok(g.lines().slice(-4).some(l => ["Footsteps on the stairs below, and every step shakes the roof.", "A shadow on the terrace that isn't yours. It moves when you don't."].includes(l)), "BAND_C on the roof");
});

// ---- Polish C: feel (one test per ending variant, plus the run report)
const play = (...cmds) => { const g = bigfoot(); g.type(...cmds); return g; };
const report = g => Object.fromEntries(g.last().split("RUN REPORT\n")[1].split("\n").filter(l => l.includes(": ")).map(l => l.split(/: (.*)/s).slice(0, 2)));
const BASE = ["open giraffe gate", "s", "s", "use gold coin on hippo", "s", "run", "e", "d", "say giraffe", "push thirteenth step"];

test("Polish C: W1 names the secret left behind; the run report matches the run", () => {
  const noLedger = play(...TOUR, ...BASE, "s", "d");
  assert.match(noLedger.last(), /a notebook full of rubber bands keeps its secrets[\s\S]*THE END\. Secrets recovered: 2\/3\.\n\nRUN REPORT/);
  const r = report(noLedger);
  assert.equal(r.Secrets, "2 of 3 (manifest, photos)");
  assert.equal(r["Turns to spare"], String(noLedger.get("S.count.clock")));
  assert.equal(r.Strikes, "0 of 3");
  assert.equal(r["Alibis used"], "giraffe. Run: used.");
  assert.match(noLedger.last(), /One secret stayed home\. Mama would know where\.$/);
  const noManifest = play(...TOUR, "open giraffe gate", "s", "s", "s", "run", "e", "d", "say giraffe", "push thirteenth step", "e", "play cielito lindo", "w", "s", "d");
  assert.match(noManifest.last(), /Pepita is still sitting on a shipping schedule/);
  assert.match(noManifest.last(), /Pepita has expensive taste\.$/);
  const noPhotos = play(...TOUR, "s", "open aviary", "s", "use coin on hippo", "s", "say peacock", "e", "d", "run", "e", "play cielito lindo", "w", "s", "d");
  assert.match(noPhotos.last(), /the thirteenth step is still keeping the Don's best pictures/);
  assert.match(noPhotos.last(), /Count the steps\.$/);
});

test("Polish C: W2 with and without the run; things examined counts first looks", () => {
  const ran = play(...TOUR, ...BASE, "e", "play cielito lindo", "w", "s", "d");
  assert.match(ran.last(), /One sprint, one good story, three secrets/);
  const talker = play(...TOUR, "open giraffe gate", "s", "open aviary", "s", "use coin on hippo", "x manifest", "x hippo", "x hippo", "s", "say peacocks",
    "e", "d", "say giraffe", "push thirteenth step", "e", "play cielito lindo", "w", "s", "d");
  assert.match(talker.last(), /You never ran once/);
  const r = report(talker), [x, y] = r["Things examined"].split(" of ").map(Number);
  assert.equal(x, 2, "manifest and hippo, each counted once");
  assert.equal(y, Object.keys(talker.get("G.nouns")).length + talker.get("G.report.counted.length") - 6, "BG-01: the six escape-only nouns are bonus finds");   // rev4: counted from data (four nouns became items)
  assert.equal(r["Bonus finds"], "0 of 6");
  assert.match(talker.last(), /Every secret\. Not every corner\./);
});

test("Polish C: L1 opens with what caused the third strike (STRIKE3_BY)", () => {
  const cases = {
    RIFLE: [["n", "w", "take rifle", "touch rifle", "pull rifle"], /The rifle, Walter\? In my house\?/],
    PIANO: [["n", "w", "e", "e", "touch piano", "push piano", "play piano"], /Nobody touches Mama's piano/],
    STEP: [["n", "touch thirteenth step", "push thirteenth step", "pull thirteenth step"], /You were listening\. Too well\./],
    HIPPO: [[...TOUR.slice(0, 14), "touch hippo", "push hippo", "pull hippo"], /You put your hands on my Pepita\?/],
    Q1: [["n", "w", "e", "e", "w", "n", "say pozole", "say gravy", "say neither"], /Choose between my mother and my nonna/],
    Q2: [[...TOUR.slice(0, 10), "say books", "say more books", "say the book place"], /You don't know the name of your own bookstore/] };
  for (const [k, [cmds, opener]] of Object.entries(cases)) {
    const g = play(...cmds);
    assert.match(g.last(), /^COVER BLOWN\n\n/, k); assert.match(g.last(), opener, k);
    assert.match(g.last(), /Strikes: 3 of 3/, k);
    assert.match(g.last(), /RESTART to try again, or QUIT to walk away\.$/, k);
  }
});

test("Polish C: L3's first line follows the room type; the tail needs a secret", () => {
  const open = play(...TOUR, ...Array(18).fill("dance"));
  assert.match(open.last(), /^BIG FOOTPRINT\n\nThe rain stops hitting you\./);
  assert.doesNotMatch(open.last(), /Big Tony keeps things/);
  const glass = play(...TOUR, "s", "s", "use coin on hippo", ...Array(15).fill("dance"));
  assert.match(glass.last(), /^BIG FOOTPRINT\n\nEvery pane in the room goes dark at once\./);
  assert.match(glass.last(), /Big Tony keeps things\.\n\nGAME OVER\./);
  assert.match(glass.last(), /Secrets: 1 of 3 \(manifest\)/);
  const marble = play(...TOUR, "s", "s", "s", "run", ...Array(14).fill("dance"));
  assert.match(marble.last(), /^BIG FOOTPRINT\n\nA shadow the size of a delivery truck fills the doorway\./);
  assert.doesNotMatch(marble.last(), /Turns to spare/, "only W1, W2 and L2 report turns to spare");
});

test("Polish C: hint ladders keep their own places; close-ups show once; after the ending lines rotate", () => {
  const g = play(...TOUR, "hint", "hint", "s", "s", "hint", "n", "hint");
  const h = g.lines().filter((l, i, a) => a[i - 1] === "> hint");
  assert.deepEqual(h, ["Walk the tour backward. Grab what you can.", "The guards chase animals first.", "Pepita has a price.",
    "The gates are on the roof and the aviary is right below it. Open one before you meet a guard. Two secrets gets you out."]);
  g.type("s", "use coin on hippo", "x manifest");
  assert.match(g.last(), /^Dates, ports, container numbers/);
  g.type("x manifest");
  assert.match(g.last(), /^A waterproof tube/);
  const e = play(...TOUR, ...Array(18).fill("dance"), "look", "look", "look", "look");
  assert.deepEqual(e.lines().slice(-8).filter(l => !l.startsWith(">")), ["The story's over, detective. RESTART or QUIT.",
    "The Don's house is quiet now. RESTART or QUIT.", "Case closed. RESTART to reopen it, or QUIT.", "The story's over, detective. RESTART or QUIT."]);
});

test("Polish C: graded wrong attempts (E2) and alibi lines by checkpoint (E4)", () => {
  const g = play(...TOUR, "open giraffe gate", "s", "s", "s", "run", "e", "d", "say giraffe");
  assert.match(g.last(), /You just point up\. The giraffe's head hangs over the banister/, "R2 alibi line");
  g.type("push fifth step");
  assert.ok(g.lines().includes("That's step 5. It's just a step. Keep counting."));
  g.type("push 13th step", "push 13th step");
  assert.equal(g.last(), "It's already down. The panel is already open.");
  g.type("e", "play mama's song");
  assert.ok(g.lines().includes("Right song. Wrong words. What was it called? She sang it every Sunday."));
  const p = play(...TOUR, "s", "open aviary", "s", "s", "say peacocks");
  assert.match(p.last(), /As if on cue, a scream echoes down the hall/, "R7 alibi line");
});

// ---- Playtest QA (PT-xx): the wider coverage the playtest asked for
test("Playtest: extended coverage: bare verbs, social verbs, prepositions, nouns from other rooms", t => {
  const g = bigfoot(), nouns = g.get("G.nouns"), rooms = g.get("G.rooms"), fails = [];
  const place = (room, phase, extra = "") => g.run(`S.over = false; S.room = ${JSON.stringify(room)}; S.flags = {}; S.count = { turns: 5, strikes: 0, clock: 18, secrets: 0 };
    S.loc.don = ${phase === "TOUR" ? JSON.stringify(room) : "null"}; S.loc.nando = null; S.loc.coin = "player"; S.count.leg = 14;
    G.events.forEach((e, i) => { if (!e.repeat) S.fired[i] = true; });   // arrivals, greetings and endings already done: we test the reply only
    ${phase === "ESCAPE" ? "S.flags.escape = true; S.mark.tick = 5; S.loc.don = null;" : "S.flags.q1 = true; S.flags.q2 = true;"} ${extra}; globalThis.__snap = JSON.stringify(S);`);
  const tryIt = (label, cmd, ok = out => !out.some(l => BAD.some(b => b.test(l)))) => {
    g.run("S = JSON.parse(__snap)"); const k = g.lines().length, t0 = g.get("S.count.turns"); g.type(cmd);
    const out = g.lines().slice(k + 1);
    if (!out.length || !ok(out, g.get("S.count.turns") - t0)) fails.push(`${label}: "${cmd}" -> ${out.join(" / ") || "(nothing)"}`);
  };
  const phases = room => ["terrace", "enclosure"].includes(room) ? ["ESCAPE"] : ["TOUR", "ESCAPE"];
  for (const room of Object.keys(rooms)) for (const phase of phases(room)) {
    place(room, phase);
    // 1. every info and Tier 1 verb with no noun
    for (const v of ["search", "smell", "listen", "take", "touch", "push", "pull", "open", "close", "knock", "sit", "climb"]) tryIt(`${phase} ${room}`, v);
    // 2. Tier 2 verbs on the NPC who's here
    if (phase === "TOUR") for (const c of ["show don", "show card to don", "give card to don", "give don", "show plaque to don", "ask don", "ask don about piano", "tell don about family", "talk to don"])
      tryIt(`${phase} ${room}`, c);
    // 4. nouns from other rooms: the free not-here line
    const here = Object.entries(nouns).filter(([, n]) => n.at === room || n.at === "any").flatMap(([, n]) => n.words);
    const next = Object.values(rooms[room].exits || {}).map(x => typeof x === "string" ? x : x.to).flatMap(r => rooms[r].words || []);
    for (const [id, n] of Object.entries(nouns)) {
      if (n.at === room || n.at === "any") continue;
      const w = [...n.words].sort((a, b) => b.length - a.length)[0];
      if ([...here, ...next, "stairs", "staircase", "staircases", "step", "steps", "door", "fountain", "coins", "coin", "card", "photos", "gate"].some(x => ` ${w} `.includes(` ${x} `) || ` ${x} `.includes(` ${w} `))) continue;
      for (const v of ["examine", "open"]) tryIt(`${phase} ${room} (${id} is elsewhere)`, `${v} ${w}`, (out, cost) => out.length === 1 && (out[0] === "Nothing like that around here." || out[0].startsWith("You look closer. ")) && cost === 0);   // F-01: unless this room's text used the word
    }
  }
  // 2. Nando at a checkpoint: talk, ask, tell, examine are free and never confused
  for (const room of ["gallery", "foyer"]) {
    place(room, "ESCAPE", `S.flags.checkpoint = true; S.mark.stop = 5; S.loc.nando = ${JSON.stringify(room)};`);
    for (const c of ["talk to nando", "ask nando", "tell nando", "x nando", "talk", "say"]) tryIt(`checkpoint ${room}`, c, (out, cost) => cost === 0 && !out.some(l => BAD.some(b => b.test(l)) || l.startsWith("CAUGHT")));
  }
  // 3. prepositional forms
  for (const [room, cmds] of [["atrium", ["drop coin in fountain", "put coin in hippo"]], ["dining", ["put card in bowl", "look under table", "look behind portraits"]],
    ["gallery", ["look behind portraits"]], ["office", ["look in humidor", "look under desk"]]])
    for (const phase of ["TOUR", "ESCAPE"]) { place(room, phase); for (const c of cmds) tryIt(`${phase} ${room}`, c); }
  // 5. every WORDS entry as "look at <words>"
  for (const [id, n] of Object.entries(nouns)) {
    const phase = (n.examine || []).some(l => !l[0] || l[0] === "TOUR" || l[0].startsWith("TOUR&")) && !["terrace", "enclosure"].includes(n.at) ? "TOUR" : "ESCAPE";
    if (!(n.examine || []).some(l => !l[0] || l[0] === phase || l[0].startsWith(phase + "&"))) continue;
    place(n.at === "any" ? "foyer" : n.at, phase);
    for (const w of n.words) tryIt(`${phase} ${id}`, `look at ${w}`);
  }
  assert.deepEqual(fails, []);
});

test("Playtest P2s: PT-01 to PT-06", () => {
  const g = bigfoot();
  g.type("listen");
  assert.equal(g.last(), "Violins, very softly. The music of people who have never once had to hurry.", "PT-01");
  g.type(...TOUR.slice(0, 11), "show coin to don");
  assert.equal(g.last(), "He folds your fingers back over it. \"A dividend is not a loan.\"", "PT-02");
  g.type("w", "x stairs");
  assert.match(g.last(), /^Twelve steps on the family side/, "PT-06");
  g.type("w", "n", "drop coin in fountain");
  assert.equal(g.get("S.count.strikes"), 1, "PT-03: a strike on the tour");
  const e = toEscape(); e.type("e");
  const t0 = e.get("S.count.turns"); e.type("open jaguar gate");
  assert.equal(e.last(), "Nothing like that around here.", "PT-04"); assert.equal(e.get("S.count.turns"), t0, "PT-04: free");
  const r = toEscape(); r.type("open giraffe gate", "s", "s");
  const extras = r.lines().slice(r.lines().lastIndexOf("Atrium") + 2);
  assert.equal(extras.length, 2, "PT-05: at most two extra lines: " + extras.join(" / "));
  const w = toEscape(); for (let i = 0; i < 12; i++) w.type("dance");
  assert.equal(w.last(), "Somewhere behind you, a thud rattles the chandeliers.", "PT-05: no feedback or band on a warning turn");
});

test("Playtest P3s: PT-07 to PT-15", () => {
  const g = bigfoot();
  g.type("smell");
  assert.equal(g.last(), "Cologne, brass polish, and your own nerves.", "PT-07");
  g.type("n", "x family photos");
  assert.match(g.last(), /^Christenings, weddings/, "PT-09");
  g.type("w", "e", "e", "w", "n", "x cards");
  assert.ok(g.lines().some(l => l.startsWith("Every name in the same looping hand")), "PT-08");
  g.type("say both", "s", "u", "e", "say dog-eared page", "x card");
  assert.match(g.last(), /At the bottom: "Smile\. Don't touch anything\." You smiled\. He liked the name\. So far, so good\.$/, "PT-10");
  g.type("w", "w", "n", "take coins");
  assert.equal(g.last(), "The Don's smile tightens. \"Those are Pepita's, Walter. Hands to yourself.\"", "PT-11");
  g.type("n", "n", "x coin");
  assert.match(g.last(), /^The eagle, the winged figure/, "PT-10: COIN_HELD in ESCAPE");
  g.type("open jaguar gate", "x garden");
  assert.match(g.last(), /^Clipped hedges[\s\S]*A single paw print/, "PT-15: base line, then the mark");
  g.type("x jaguar");
  assert.match(g.last(), /^Gone\./, "PT-15: a state change still replaces");
  g.type("e", "eat banana peels");
  assert.ok(g.lines().includes("You're hungry, not desperate."), "PT-12");
  const w = toEscape(); w.type("open giraffe gate", "s", "s", "use coin on hippo", "s", "run", "e", "d", "say giraffe", "s", "d");
  assert.equal(w.last(), "Your thumb hovers over the button. One secret isn't a case. It's a rumor. Go get another.", "PT-14");
  w.type("n", "push 13th step", "e", "w");
  assert.ok(!w.lines().slice(-6).some(l => l.startsWith("You see:")), "PT-13: no engine item list under the revisit");
});

test("Playtest round 2 P2s: NB-01 to NB-04", () => {
  const cp = toEscape(); cp.type("s", "s", "s");
  const t0 = cp.get("S.count.turns");
  cp.type("say", "tell nando", "where am i", "exits", "map", "what now", "help me", "undo");
  assert.equal(cp.get("S.over"), false, "NB-01, NB-04: free at a checkpoint");
  assert.equal(cp.get("S.count.turns"), t0);
  cp.type("go back");
  assert.match(cp.last(), /^CAUGHT/, "NB-04: going back at a checkpoint is still a move");
  const q = play("n", "w", "e", "e", "w", "n", "say this smells amazing");
  assert.equal(q.last(), "The Don smiles. \"Compliments later, Walter. Pozole or gravy?\"", "NB-02");
  assert.equal(q.get("S.count.strikes || 0"), 0);
  q.type("say gravy");
  assert.equal(q.get("S.count.strikes"), 1, "NB-02: an answer still counts");
  const a = toEscape(); a.type("open giraffe gate", "s", "s", "s", "tell nando the giraffe is loose");
  assert.equal(a.get("S.flags.checkpoint || false"), false, "NB-03: tell = say");
  const b = toEscape(); b.type("open jaguar gate", "s", "s", "s", "shout jaguar!");
  assert.equal(b.get("S.flags.checkpoint || false"), false, "NB-03: shout = say");
  const m = play("n", "where am i", "exits");
  assert.match(m.lines().at(-3), /^Grand Foyer\nThe twin staircases/, "NB-04 where");
  assert.equal(m.last(), "Exits: south, west, east, north, up", "NB-04 exits (tour)");
  const e = toEscape(); e.type("back");
  assert.equal(e.last(), "Back which way? Name a direction, or a landmark.", "NB-04 back (escape)");
});

test("Playtest round 2 P3s: NB-05 to NB-09", () => {
  const g = play("n", "say hello, don chava");
  assert.equal(g.last(), "\"Look around, Walter. Every stone in this floor, I earned.\"", "NB-05: say = talk with the Don here");
  g.type("tell don i love the marble");
  assert.equal(g.last(), "\"Tell me something I don't know.\" He's delighted.", "NB-09");
  g.type("ask don about the palace");
  assert.equal(g.last(), "\"Every stone, I picked. Every stone, I paid for. Mostly.\"", "NB-09 topic");
  const n = toEscape(); n.type("say hello?");
  assert.equal(n.last(), "You say it out loud. The house doesn't answer.", "NB-05: nobody here");
  const h = play("n", "w", "e", "e", "w", "n", "hint", "hint", "hint", "say both", "s", "u", "e", "hint");
  assert.equal(h.last(), "He's asking you something. Answer with \"say\".", "NB-06: Q2's ladder starts at step 1");
  const p = toEscape(); p.type("open giraffe gate", "s", "s", "use coin on hippo", "s", "run", "e", "d", "say giraffe", "push 13");
  assert.equal(p.get("S.loc.photos"), "player", "NB-07");
  const a = toEscape(); a.type("open giraffe gate and jaguar gate");
  assert.equal(a.last(), "One thing at a time, detective.", "NB-08");
  assert.deepEqual([a.get("S.count.giraffe"), a.get("S.count.jaguar || 0")], [1, 0]);
  const q = play("n", "w", "e", "e", "w", "n", "say pozole and gravy");
  assert.equal(q.get("S.flags.q1"), true, "NB-08 doesn't split what's said out loud");
});

test("Playtest round 3 P2s: BG-01 to BG-06", () => {
  const x = play("x violins", "x speaker");
  assert.ok(!/Nothing like that/.test(x.lines().slice(-2).join("\n")), "BG-02");
  const a = play(...TOUR.slice(0, 14), "talk to pepita");
  assert.match(a.last(), /dignified bronze silence[\s\S]*She likes you\. Maybe\./, "BG-03");
  const z = toEscape(); z.type("talk to giraffe");
  assert.equal(z.last(), "She lowers her head, listens politely, and eats a hedge.", "BG-03");
  const l = toEscape(); l.type("s", "s", "s", "tell nando about the lemurs");
  assert.match(l.last(), /^CAUGHT[\s\S]*"The lemurs\?" Nando snorts\./, "BG-04");
  const k = play("n", "threaten don");
  assert.equal(k.last(), "He laughs, but his eyes don't. \"Walter. We were getting along so well.\"", "BG-05");
  assert.equal(k.get("S.count.strikes || 0"), 0, "BG-05: provoke is no strike");
  k.type("kill don");
  assert.ok(!/penthouse is unimpressed|don't know how/.test(k.last()), "BG-05: kill = hit");
  const p = toEscape(); p.type("open giraffe gate", "s", "s", "use coin on hippo");
  const t0 = p.get("S.count.turns"); p.type("use coin on hippo");
  assert.equal(p.last(), "Pepita's already open, and already empty.", "BG-06");
  assert.equal(p.get("S.count.turns"), t0, "BG-06: free");
});

test("Playtest round 3 P3s: BG-07 to BG-13", () => {
  const r = toEscape(); r.type("s", "s", "n", "s");
  assert.ok(r.lines().slice(-4).some(l => l.startsWith("Pepita the HIPPO again")) && !r.lines().some(l => /^You see: (HIPPO|AVIARY)/.test(l)), "BG-07");
  const s = toEscape(); s.type("open giraffe gate", "s", "s", "use gold coin on hippo", "s", "run", "e", "d", "say giraffe", "x step");
  assert.match(s.last(), /^A hair taller than its neighbors/, "BG-08");
  assert.match(play("n", "kick step").last(), /Those stairs are older than you/, "BG-09");
  assert.equal(play("n", "w", "e", "e", "kick piano").last(), "The Don's smile tightens. \"Hands off Mama's piano, Walter.\"", "BG-09");
  assert.equal(play("n", "ask don about dinner").last(), "\"Patience. Business first, then the table.\"", "BG-10");
  assert.equal(play("n", "ask don about his wife").last(), "\"Family is not for strangers, Walter. Not yet.\"", "BG-10");
  assert.match(play("n", "ask don about reina").last(), /Reina is the loudest/, "BG-10 alias");
  const l = play("listen to the xyzzy", "swim");
  assert.equal(l.lines().at(-3), "Violins, very softly. The music of people who have never once had to hurry.", "BG-11");
  assert.equal(l.last(), "No pool. Not even for you.", "BG-11");
  const t = toEscape(), t0 = t.get("S.count.turns"); t.type("take all", "drop all");
  assert.equal(t.last(), "One thing at a time, detective.", "BG-12");
  assert.equal(t.get("S.count.turns"), t0, "BG-12: free");
  assert.equal(play("x don").last(), "You'll meet him in a second. You can already hear him.", "BG-13");
});

test("Playtest round 4: F-01 coverage: every word read in a room, two levels deep, can be examined", t => {
  const NOT = "Nothing like that around here.";
  const wordsOf = lines => [...new Set(lines.filter(l => !l.startsWith(">") && !l.startsWith("Through the doorway: ")).join(" ").replace(/You look closer\. /g, "").toLowerCase().match(/[\p{L}']{4,}/gu) || [])]
    .map(w => w.replace(/'s$|'$/, "")).filter(w => w.length >= 4);
  let n = 0;
  const sweep = (g, where) => {
    const arrived = g.lines().slice(g.lines().findLastIndex(l => l.startsWith(">")));
    const level = words => words.flatMap(w => { const k = g.lines().length; g.type("x " + w); n++;
      const out = g.lines().slice(k); assert.notEqual(out.at(-1), NOT, `${where}: x ${w}`); return out; });
    level(wordsOf(level(wordsOf(arrived))));
    assert.equal(g.get("S.over"), false, where);
  };
  const tour = bigfoot();
  sweep(tour, "elevator (tour)");
  TOUR.forEach((c, i) => { tour.type(c); if (!c.startsWith("say")) sweep(tour, `tour step ${i + 1} (${c})`); });
  const esc = toEscape();
  for (const c of [...BASE, "w", "e", "e", "w", "n", "s"]) { esc.type(c); if (["s", "n", "e", "w", "d", "run"].includes(c)) sweep(esc, `escape (${c}) in ${esc.get("S.room")}`); }
  t.diagnostic(`${n} examine commands`);
});

test("Playtest round 4 P2s: F-01 to F-03", () => {
  assert.equal(play("n", "w", "e", "e", "x pencil").last(), "You look closer. Someone wrote on the frame in pencil: \"Los domingos.\"", "F-01");
  const s = play("n", "introduce myself", "greet the don");
  assert.equal(s.lines().at(-3), "He smiles. \"I know who you are, Walter. I checked.\"", "F-02");
  assert.match(s.last(), /Every stone in this floor/, "F-02: greet = talk");
  const w = toEscape(); w.type("open giraffe gate", "s", "s", "s", "whisper giraffe");
  assert.equal(w.get("S.flags.checkpoint || false"), false, "F-02: whisper = say");
  const k = play("n", "scream at don");
  assert.match(k.last(), /We were getting along so well/, "F-03: scream at = provoke");
  assert.equal(play("n", "slap don").last(), play("n", "hit don").last(), "F-03: slap = hit");
  assert.match(play("n", "w", "e", "e", "w", "n", "poison the pozole").last(), /bad intentions/, "F-03");
  assert.match(play("n", "w", "e", "e", "w", "n", "say both", "s", "u", "e", "set fire to humidor").last(), /^No matches, no lighter/, "F-03");
  assert.match(play("n", "w", "e", "e", "w", "n", "say both", "s", "u", "knock over vase").last(), /before the pieces stopped bouncing/, "F-03: knock over = break");
});

test("Playtest round 4 P3s: F-04 to F-09", () => {
  assert.equal(play("n", "say thank you").last(), "\"Thank me with a plaque.\"", "F-04");
  assert.equal(play("n", "say you have a beautiful home").last(), "\"Tell me something I don't know.\" He's delighted.", "F-04");
  assert.match(play("n", "ask don about me").last(), /bookstore man who sweats/, "F-04: about me");
  for (const [q, a] of [["his father", /My father's town/], ["god", /needs a saint/], ["the photos", /Two families/], ["the lion", /needs a saint/], ["hippos", /A lady/]])
    assert.match(play("n", "ask don about " + q).last(), a, "F-05 " + q);
  assert.match(play(...TOUR.slice(0, 14), "pet pepita").last(), /Pepita doesn't like strangers/, "F-06");
  assert.match(play(...TOUR.slice(0, 14), "take coins").last(), /Those are Pepita's/, "F-06: the coins keep theirs");
  for (const c of ["ask don", "talk to don"]) assert.equal(play(c).last(), "You'll meet him in a second. You can already hear him.", "F-07 " + c);
  const b = toEscape(), t0 = b.get("S.count.turns"); b.type("show", "give");
  assert.deepEqual(b.lines().slice(-3), ["Show what, to whom?", "> give", "Give what, to whom?"], "F-08");
  assert.equal(b.get("S.count.turns"), t0, "F-08: free");
  const f = toEscape(); f.type("s", "s", "s", "x flashlight");
  assert.equal(f.last(), "The beam is pointed straight at your face. That's the point of it.", "F-09");
  assert.equal(f.get("S.over"), false, "F-09: free, the checkpoint stays open");
});

test("Wording sweep: every noun, every common verb, tour and escape; doorways never say 'again' before you've been there", t => {
  const BAD = /^(Nothing happens\.|Nobody by that name|You see: )|In escape, it hums|Through the doorway: .*\bagain\b/;
  let n = 0;
  const stop = (g, where) => {
    const saved = JSON.stringify(g.get("S"));
    const nouns = g.get(`Object.entries(G.nouns).filter(([id, n]) => n.at === S.room).map(([id, n]) => [n.words[0], n.cat])`);
    const doors = g.get(`Object.values(G.rooms[S.room].exits || {}).map(x => typeof x === "string" ? x : x.to).map(r => (G.rooms[r].words || [r])[0])`);
    const cmds = [...doors.map(d => "examine " + d), ...nouns.flatMap(([w, cat]) =>
      ["examine", "search", "take", "touch", "open", "push", "smell", "listen", ...(["PERSON", "ANIMAL"].includes(cat) ? ["talk to"] : [])].map(v => `${v} ${w}`))];
    for (const c of cmds) { const k = g.lines().length; g.type(c); n++;
      for (const l of g.lines().slice(k + 1)) assert.ok(!BAD.test(l), `${where}: "${c}" -> ${l}`);
      g.run(`S = JSON.parse(${JSON.stringify(saved)})`); }
  };
  const tour = bigfoot();
  stop(tour, "tour elevator");
  assert.equal(tour.lines().filter(l => l.startsWith("Through the doorway: ")).at(-1), "Through the doorway: White marble floors, gold banisters, and two staircases that curve up to the same landing like arms around a hug you didn't ask for.", "the foyer before you've seen it");
  TOUR.forEach((c, i) => { tour.type(c); if (!c.startsWith("say")) stop(tour, `tour step ${i + 1}`); });
  for (const route of [["open giraffe gate", "open jaguar gate", "e", "w", "s", "s", "use gold coin on hippo", "s", "say giraffe", "e", "e", "w", "d", "say jaguar", "s"],
    ["open giraffe gate", "s", "s", "use gold coin on hippo", "s", "run", "e", "d", "say giraffe", "w", "e", "e", "w", "n"]]) {
    const esc = toEscape();
    for (const c of route) { esc.type(c); assert.equal(esc.get("S.over"), false, c);
      if (!/^(say|use|open)/.test(c)) stop(esc, `escape (${c}) in ${esc.get("S.room")}`); } }
  t.diagnostic(`${n} commands`);
});

// ---- Scripted playthroughs (rev4: these replace the differential test against the v1 build; release/v1 stays as history)
// Each ending, with the clock the GDD's critical paths promise (section 9: W1 with 7 turns to spare, W2 with 4).
const ending = g => g.get("S.nouns.notes.ENDING");
const seeded = n => { const g = load(BF).boot(); g.run(`G.seed = ${n}`); g.click("bs"); return g; };   // the same rolls every time
const W1 = [...TOUR, ...ESCAPE, "s"], W2 = [...TOUR, ...ESCAPE, "e", "play cielito lindo", "w", "s"];
test("playthrough: TOUR ends on the roof with the escape begun, no strikes, the clock at 18", () => {
  const g = play(...TOUR);
  assert.equal(g.get("S.room"), "terrace");
  assert.equal(g.get("S.flags.escape"), true);
  assert.equal(g.get("S.count.clock"), 18);
  assert.equal(g.get("S.count.strikes || 0"), 0);
  assert.equal(g.get("S.loc.don"), null, "the Don has fled");
});
test("playthrough: ESCAPE, W1: two secrets, 7 turns to spare, CLEAN GETAWAY", () => {
  const g = play(...W1);
  assert.equal(g.get("S.count.clock"), 7);
  g.type("d");
  assert.equal(ending(g), "W1"); assert.match(g.last(), /^CLEAN GETAWAY\n/);
  assert.equal(g.get("S.count.secrets"), 2);
});
test("playthrough: W2: three secrets, 4 turns to spare, CLEAN SWEEP", () => {
  const g = play(...W2);
  assert.equal(g.get("S.count.clock"), 4);
  g.type("d");
  assert.equal(ending(g), "W2"); assert.match(g.last(), /^CLEAN SWEEP\n/);
});
test("playthrough: each loss: L1 COVER BLOWN, L2 CAUGHT, L3 BIG FOOTPRINT", () => {
  const l1 = play("n", "w", "take rifle", "kick rifle", "pull rifle");
  assert.equal(ending(l1), "L1"); assert.match(l1.last(), /^COVER BLOWN\n/);
  const l2 = play(...TOUR, "s", "s", "s", "say jaguar");
  assert.equal(ending(l2), "L2"); assert.match(l2.last(), /^CAUGHT\n/);
  const l3 = play(...TOUR, ...Array(18).fill("wait"));
  assert.equal(ending(l3), "L3"); assert.match(l3.last(), /^BIG FOOTPRINT\n/);
  assert.equal(l3.get("S.count.clock"), 0);
});

// ---- Seeded random commands from the game's own words: no exceptions, no validator problems, turns never negative,
// and from wherever a run stops, following the Don (then waiting out the clock) always reaches an ending.
test("random commands: consistent state, and an ending is always reachable", t => {
  const g0 = bigfoot(), D = g0.get("{ n: G.nouns, i: G.items, p: G.npcs, r: G.rooms, a: G.aliases, c: G.categories, y: G.anywhere, legs: G.events }");
  const name = o => g0.get(`(${JSON.stringify(o)})`) && (typeof o.name === "string" ? o.name : o.name.at(-1));
  const objs = [...Object.values(D.n).flatMap(n => n.words), ...[...Object.values(D.i), ...Object.values(D.p)].flatMap(o => [name(o).toLowerCase(), ...(o.aliases || [])]),
    ...Object.values(D.r).flatMap(r => r.words || []), "coin on hippo", "coin to don", "card to don", "photos to nando", "both", "dog-eared page", "cielito lindo", "giraffe", "jaguar", "peacocks", "13th step", "the right one", "the other one"];
  const verbs = [...new Set(["look", "x", "take", "drop", "use", "give", "show", "put", "talk to", "ask don about", "ask nando about", "push", "open", "search", "smell", "say", "play", "run", "hint", "status", "brief", "oops",
    ...Object.keys(D.a), ...Object.values(D.c).flatMap(Object.keys), ...Object.keys(D.y)].map(v => v.toLowerCase()).filter(v => !["*", "handle", "save", "undo", "load", "restore", "quit", "transcript", "menu"].includes(v)))];
  const dirs = ["n", "s", "e", "w", "u", "d", "back", "go upstairs"];
  let seed = 7; const rnd = n => (seed = (seed * 1103515245 + 12345) % 2147483648) % n;
  const cmd = () => { const k = rnd(10); return k < 3 ? dirs[rnd(dirs.length)] : k < 4 ? verbs[rnd(verbs.length)] : verbs[rnd(verbs.length)] + " " + objs[rnd(objs.length)]; };
  // the rescue: answer a pending question, else walk toward the Don's next stop; in the escape, wait
  const LEGS = [["foyer"], ["trophy"], ["foyer"], ["salon"], ["foyer"], ["dining"], ["foyer"], ["landing"], ["office"], ["landing"], ["gallery"], ["atrium"], ["aviary"], ["terrace"]].map(l => l[0]);
  const exits = Object.fromEntries(Object.entries(D.r).map(([r, R]) => [r, Object.entries(R.exits || {}).map(([d, x]) => [d, typeof x === "string" ? x : x.to])]));
  const step = (from, to) => { const seen = { [from]: null }, q = [from];
    while (q.length) { const r = q.shift(); if (r === to) break; for (const [d, x] of exits[r]) if (!(x in seen)) { seen[x] = [r, d]; q.push(x); } }
    let r = to, d = null; while (seen[r]) { [r, d] = [seen[r][0], seen[r][1]]; } return d; };
  const rescue = g => {
    for (let i = 0; i < 200 && !g.get("!!S.over"); i++) {
      if (g.get("!!S.flags.escape")) { g.type("wait"); continue; }
      const room = g.get("S.room");
      if (room === "dining" && !g.get("!!S.flags.q1")) { g.type("say both"); continue; }
      if (room === "office" && !g.get("!!S.flags.q2")) { g.type("say dog-eared page"); continue; }
      g.type(step(room, LEGS[Math.min(g.get("S.count.leg || 0"), LEGS.length - 1)]) || "look");
    }
    return g.get("!!S.over");
  };
  let n = 0;
  for (let r = 0; r < 45; r++) {
    const g = seeded(r + 1);
    g.type(...(r % 3 === 0 ? [] : r % 3 === 1 ? TOUR : TOUR.slice(0, rnd(TOUR.length))));
    for (let i = 0; i < 40 && !g.get("!!S.over"); i++) {
      const c = cmd(); n++;
      assert.doesNotThrow(() => g.type(c), `run ${r}: ${c}`);
      assert.ok(g.get("S.count.turns") >= 0, `run ${r}: "${c}" took the turns below zero`);
    }
    assert.deepEqual(g.problems(), [], `run ${r}`);
    assert.ok(rescue(g), `run ${r}: no ending reached from ${g.get("S.room")}`);
  }
  t.diagnostic(`${n} random commands`);
});

// ---- Rev 4: one test per Framework v2 feature the game shows off (games/big-footprint/design/GDD_week01_rev4.md)
test("feature two slots: give/show/put with what: and with:, {the:what}/{The:with}, carry", () => {
  const g = play("n", "show card to don");
  assert.match(g.last(), /^He glances at it and hands it back/, "the Don's reply, by what:");
  g.type("give the don the card");
  assert.match(g.last(), /^He glances at it and hands it back/, "slot order: the Don, not the card's own line, whichever way it's said");
  g.type("use card");
  assert.equal(g.last(), "That won't help. The card is for reading, not for handing to anyone.", "the card's own reply, with no one in the second slot");
  g.type("drop card", "show the card to the don");
  assert.equal(g.lines().at(-2), "(first taking the BRIEFING CARD)", "carry: picked up first");
  const q = play(...TOUR.slice(0, 10), "show card to don");
  assert.equal(q.get("S.flags.q2"), true, "the card answers Q2");
  assert.match(q.last(), /^Don Chava takes the BRIEFING CARD, finds the name/, "{The:with} {the:what}, a proper name with no article");
  assert.equal(q.get("S.loc.coin"), "player");
  for (const c of ["give gold coin to hippo", "put coin in hippo's mouth", "feed pepita the coin"]) {
    const p = play(...TOUR, "open giraffe gate", "s", "s", c);
    assert.equal(p.get("S.flags.p2"), true, c);
  }
  const n = play(...TOUR, "open giraffe gate", "s", "s", "use gold coin on hippo", "s"), clock = n.get("S.count.clock");
  n.type("show the manifest to nando");
  assert.match(n.last(), /^The Don's own guard, and the SHIPPING MANIFEST\? Not in this lifetime/);
  assert.equal(n.get("S.flags.checkpoint"), true, "the checkpoint stays open"); assert.equal(n.get("S.count.clock"), clock, "free");
  assert.equal(n.get("S.loc.manifest"), "player");
});
test("feature Which do you mean?: the two staircases, 'the right one', 'the other one'; the two gates", () => {
  const g = play(...W1.slice(0, -2));   // the foyer, checkpoint cleared, the step not pressed yet
  assert.equal(g.get("S.room"), "foyer");
  g.type("push the stairs");
  assert.equal(g.last(), "Which do you mean: the left staircase or the right staircase?");
  g.type("the right one");
  assert.ok(g.lines().includes("Thirteen steps. You need one in particular."));
  g.type("push the other one");
  assert.ok(g.lines().includes("The family side. Twelve honest steps. Nothing to hide there, apparently."));
  g.type("push the thirteenth step");
  assert.equal(g.get("S.flags.p3"), true, "the step still works");
  assert.match(play("n", "look at the staircase").last(), /twelve steps up/, "both at once, as before (BR-05)");
  const roof = play(...TOUR), t0 = roof.get("S.count.turns");
  roof.type("open gate");
  assert.equal(roof.last(), "Which do you mean: the GIRAFFE GATE or the JAGUAR GATE?");
  assert.equal(roof.get("S.count.turns"), t0, "free (CP-02)");
  roof.type("jaguar");
  assert.equal(roof.get("S.count.jaguar"), 1);
});
test("feature proper names and pronouns: Don Chava, Nando and Big Tony are him", () => {
  const P = bigfoot().get("Object.fromEntries(['don', 'nando', 'tony'].map(id => [id, [G.npcs[id].proper, G.npcs[id].pronoun]]))");
  assert.deepEqual(P, { don: [true, "him"], nando: [true, "him"], tony: [true, "him"] });
  const g = play("n", "x don", "give him the card");
  assert.match(g.last(), /^He glances at it and hands it back/, "him = the Don");
  g.type("ask him about the hippos");
  assert.match(g.last(), /A lady/);
  assert.match(play("n", "touch tony").last(), /^Whatever Big Tony is, he isn't here/, "[tony] in the text");
  const r = play(...TOUR, "open giraffe gate", "s", "open aviary", "s", "x reina", "x it");
  assert.equal(r.lines().filter(l => /^Reina /.test(l)).length >= 1, true, "Reina, no article");
});
test("feature topics: ask and tell the Don about the tour's clues; Nando's few; each has a '*'", () => {
  for (const [q, a] of [["the piano", /Nobody plays her but me/], ["mama", /She deserves a table/], ["sunday dinner", /Business first/], ["pepita", /She has a price/],
    ["the staircases", /Twelve for family/], ["the plaque", /Brass\. My name/], ["the animals", /a family that bites/], ["the weather", /Ask me something interesting/]])
    assert.match(play("n", "ask don about " + q).last(), a, q);
  assert.match(play("n", "tell the don about the giraffe").last(), /Mariposa/, "tell works like ask");
  const t = play(...TOUR.slice(0, 4), "take piano", "ask don about the piano");
  assert.equal(t.last(), "\"Don't look at the piano like that.\"", "one strike: the cold line");
  const n = play(...TOUR, "s", "s", "s"), clock = n.get("S.count.clock");
  for (const [q, a] of [["the don", /The boss is busy/], ["tony", /Not my department/], ["the giraffe", /Say it\./], ["his flashlight", /found one/], ["the moon", /I asked you a question/]]) {
    n.type("ask nando about " + q); assert.match(n.last(), a, q); }
  assert.equal(n.get("S.count.clock"), clock, "free"); assert.equal(n.get("S.flags.checkpoint"), true, "and the checkpoint stays open");
});
test("feature names follow state: the gates and the aviary", () => {
  const g = play(...TOUR, "open giraffe gate", "look");
  assert.match(g.lines().at(-2) + g.last(), /The OPEN GIRAFFE GATE creaks on its hinges/);
  g.type("open gate");
  assert.equal(g.last(), "Which do you mean: the OPEN GIRAFFE GATE or the JAGUAR GATE?");
  g.type("giraffe", "s", "open aviary", "look");
  assert.ok(g.lines().some(l => l.startsWith("The EMPTY AVIARY again")));
});
test("feature events every n: loose animals roam, the core says when they come and go, and it costs nothing", () => {
  const g = play(...TOUR, "open giraffe gate", "open jaguar gate", "s", "open aviary", "s");
  assert.equal(g.get("[S.loc.giraffe, S.loc.jaguar, S.loc.reina].every(Boolean)"), true, "released animals are in the house");
  const before = g.get("S.count.clock"); let moves = 0;
  for (let i = 0; i < 6; i++) { const k = g.lines().length; g.type("wait"); moves += g.lines().slice(k).filter(l => / (comes in from|slips away to) the (north|south|east|west)\.$/.test(l)).length; }
  assert.ok(moves >= 1, "Reina came or went in the atrium");
  assert.equal(g.get("S.count.clock"), before - 6, "only the waits cost turns");
  const e = g.get("G.events").filter(x => x.every && x.move);
  assert.equal(e.length, 3); assert.ok(e.every(x => !("say" in x)), "no say: the core narrates");
});
test("feature holders: the hippo's mouth and the piano's tray open with their puzzles; secrets go straight to the jacket", () => {
  const g = play(...TOUR, "open giraffe gate", "s", "s");
  assert.deepEqual(g.get("[S.loc.manifest, !!S.shut.mouth]"), ["mouth", true]);
  g.type("take manifest"); assert.equal(g.last(), "Nothing like that around here.", "inside a closed holder");
  g.type("put coin in hippo's mouth");
  assert.deepEqual(g.get("[S.loc.manifest, !!S.shut.mouth]"), ["player", false]);
  g.type("x mouth"); assert.match(g.last(), /^Wide open/);
  g.type("close mouth"); assert.match(g.last(), /keeps her mouth open now/);
  g.type("drop manifest"); assert.equal(g.get("S.loc.manifest"), "player", "secrets can't be dropped");
  const p = play(...W2.slice(0, -2));
  assert.deepEqual(p.get("[S.loc.tray, !!S.shut.tray, S.loc.ledger]"), ["salon", false, "player"]);
  p.type("x tray"); assert.match(p.last(), /^Velvet-lined/);
});
test("feature random: escape waits vary, and G.seed repeats them", () => {
  const run = s => { const g = seeded(s); g.type(...TOUR, ...Array(5).fill("wait")); return g.lines().filter(l => l.startsWith("You ") && /wait|breath|count/.test(l)); };
  const a = run(3);
  assert.deepEqual(run(3), a, "same seed, same lines");
  assert.ok(a.every(l => ["You wait. The thudding doesn't.", "You hold your breath. The house doesn't hold its.", "You count to three. Big Tony counts faster."].includes(l)));
  assert.ok(new Set([...a, ...run(4), ...run(5)]).size > 1, "they vary");
});
test("feature help names brief, oops and transcript; brief makes escape revisits short", () => {
  const g = play("help");
  for (const w of ["give or show", "ask [", "oops", "brief", "transcript"]) assert.ok(g.last().replace(/​/g, "").includes(w), w);
  const b = play(...TOUR, "brief", "s", "n");
  assert.equal(b.lines().at(b.lines().lastIndexOf("> n") + 1), "Zoo Terrace");
  assert.notEqual(b.lines().at(b.lines().lastIndexOf("> n") + 2)?.startsWith("Wind and alarms"), true, "no description on a revisit");
  const o = play("n", "x the danc", "oops don");
  assert.match(o.last(), /Salvatore Bellandi-Reyes/, "oops fixes the last line");
});
test("feature kinds: every loose animal refuses take, eat, ride and pet, and hears you out", () => {
  const g = play(...TOUR, "s", "open aviary", "s"), k = g.get("G.kinds.animal");
  assert.equal(g.get("S.loc.reina"), "atrium");
  while (g.get("S.loc.reina !== S.room || S.count.turns % 5 !== 0")) g.type("wait");   // she just came in: four turns before she roams on
  const said = c => { const n = g.lines().length; g.type(c); return g.lines().slice(n + 1); };
  assert.ok(said("take reina").includes(k.take));
  assert.ok(said("eat reina").includes(k.eat));
  assert.ok(said("ride reina").some(l => ["You picture riding Reina out of here. Reina pictures something else.", "Reina gives you a look. You'd make it about one step."].includes(l)));
  assert.ok(said("pet reina").includes("Reina gives you a look that ends the idea."), "pet = touch");
  const t = g.get("S.count.turns");
  assert.ok(said("talk to reina").includes("You make your case. Reina hears you out, then goes back to being somebody else's problem."));
  assert.equal(g.get("S.count.turns"), t, "talking is free");
  assert.notEqual(g.get("S.loc.reina"), "player");
});
test("feature up and down: look up / look down in every room; the giraffe is up, Reina flies up and lands", () => {
  const rooms = bigfoot().get("Object.keys(G.rooms).filter(r => G.rooms[r].up && G.rooms[r].down)");
  assert.equal(rooms.length, 12, "every room has a view up and down");
  assert.equal(play("look down").last(), "Gold carpet with the Don's initials woven in. You're standing on his name.");
  const g = play(...TOUR, "s", "open aviary", "s"), t = g.get("S.count.turns");
  assert.equal(g.get("S.level.reina"), "up", "released: up in the palms");
  g.type("look up");
  assert.equal(g.lines().slice(-2)[1], "Reina: Up in the palms, tail hanging down like a stolen chandelier. She screams at you from above.", "named, then described");
  assert.equal(g.get("S.count.turns"), t, "looking is free");
  while (g.get("S.loc.reina === 'atrium'")) g.type("wait");
  assert.equal(g.get("S.level.reina ?? null"), null, "she lands when she moves: back to her data level");
  const l = play(...TOUR, "open giraffe gate", "s", "s", "s", "run", "e");
  while (l.get("S.loc.giraffe !== 'landing'")) l.type("wait");
  l.type("look up");
  assert.ok(l.lines().some(x => /^The giraffe: (Six meters of eyelashes|She looks down at you from the ceiling)/.test(x)), "the giraffe is up, named");
  // wording: a thing's line never repeats its own name ("Reina: Reina, up in...")
  const named = [...g.lines(), ...l.lines()].map(x => /^(?:The )?([^:]+): (.*)$/i.exec(x)).filter(m => m && ["Reina", "giraffe", "jaguar"].includes(m[1]));
  assert.ok(named.length >= 2);
  for (const [line, who, text] of named) assert.ok(!text.toLowerCase().startsWith(who.toLowerCase()) && !text.toLowerCase().startsWith("the " + who.toLowerCase()), line);
});

