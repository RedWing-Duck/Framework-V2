// Headless tests against the BUILT files, so bundling is tested too.
//   node tools/build.js damp-cell && node tools/build.js sundown && node tests/run.js
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const { load, storage } = require("../tools/headless"), { build } = require("../tools/build");

const dist = name => fs.readFileSync(path.join(__dirname, `../dist/${name}.html`), "utf8");
const CELL = dist("damp-cell");
const SUN = dist("sundown").replace('title: "Sundown",', 'title: "Sundown", seed: 1,');   // seeded: the owl and the yard's sounds roll the same every run
const newGame = (h = CELL, opts) => { const g = load(h, opts).boot(); g.click("bs"); return g; };
const TO_KEY = ["d", "u", "e", "take lantern", "w", "d", "take bread", "u", "e", "talk guard", "1", "use key"];
const TO_BOARD = ["s", "e", "take hammer", "take nails", "take plywood", "w", "n", "use plywood on window"];

for (const name of ["damp-cell", "sundown"])
  test(`dist/${name}.html is up to date with the sources`, () => assert.equal(dist(name), build(`games/${name}`), `run: node tools/build.js ${name}`));

test("damp-cell: escape through the gate", t => {
  const g = newGame();
  g.type(...TO_KEY, "n");
  const m = g.last().match(/^You escaped in (\d+) turns! THE END\.$/);
  assert.ok(m, `last line was: ${g.last()}`);
  t.diagnostic(`escaped in ${m[1]} turns`);
  assert.equal(Number(m[1]), g.get("S.count.turns"));
});

test("damp-cell: the cellar is pitch dark without a light (light add-on)", () => {
  const g = newGame();
  g.type("d", "look");
  assert.equal(g.last(), "It's pitch dark. You can't see a thing.");
});

test("damp-cell: caught after opening the gate; then the game is over", () => {
  const g = newGame();
  g.type(...TO_KEY);
  for (let i = 0; i < 10 && !g.get("S.over"); i++) g.type("z");
  assert.ok(g.lines().includes("Shouts echo from somewhere above. Someone heard the gate."));
  assert.match(g.last(), /^Guards flood the corridor\. You're caught after \d+ turns\. THE END\.$/);
  g.type("look");
  assert.equal(g.last(), "The game is over. Type 'restart', 'undo' or 'menu'.");
});

test("damp-cell: the rat moves every 2 turns (every:)", () => {
  const g = newGame();
  g.type("z");
  assert.equal(g.get("S.loc.rat"), "cell");
  g.type("z");
  assert.equal(g.get("S.loc.rat"), "corridor");
  g.type("help", "inventory");   // free commands don't move it again
  assert.equal(g.get("S.loc.rat"), "corridor");
});

test("continue: menu and back keeps the game", () => {
  const g = newGame();
  g.type("e", "take lantern", "w", "d");
  const before = g.get("S");
  g.type("menu");
  assert.equal(g.playing(), false);
  assert.equal(g.$("bc").hidden, false, "Continue button is shown");
  g.click("bc");
  assert.deepEqual(g.get("S"), before);
  assert.equal(g.lines()[0], "Cellar", "continue shows the room again");
});

test("save: the game survives a page reload; a finished game or another version doesn't", () => {
  const st = storage();
  const g = newGame(CELL, { storage: st });
  g.type("e", "take lantern");
  const g2 = load(CELL, { storage: st }).boot();
  assert.equal(g2.$("bc").hidden, false, "Continue after reload");
  g2.click("bc");
  assert.equal(g2.get("S.loc.lantern"), "player");
  assert.equal(load(CELL.replace('yard: { name: "Courtyard"', 'yard2: { name: "Courtyard"').replace('"yard" }', '"yard2" }').replace('to: "yard"', 'to: "yard2"'), { storage: st }).boot().$("bc").hidden, true, "other version ignored");
  st.map.set("The Damp Cell:save", "{not json");
  assert.equal(load(CELL, { storage: st }).boot().$("bc").hidden, true, "garbage ignored");
});

test("undo, again and restart", () => {
  const g = newGame();
  g.type("e", "take lantern");
  assert.equal(g.get("S.count.turns"), 2);
  g.type("undo");
  assert.equal(g.get("S.loc.lantern"), "corridor");
  assert.equal(g.get("S.count.turns"), 1);
  g.type("undo");
  assert.equal(g.last(), "There's nothing to undo.");
  g.type("z", "again");
  assert.equal(g.get("S.count.turns"), 3);
  assert.deepEqual(g.lines().slice(-3), ["> again", "> z", "Time passes."], "again echoes what it repeats");
  g.type(...TO_KEY, "n", "undo");
  assert.equal(g.get("S.over"), false, "undo works after an ending");
  g.type("restart");
  assert.equal(g.get("S.count.turns"), 0);
  assert.equal(g.lines()[0], "The Damp Cell");
});

test("parser: punctuation, ?, phrasal verbs, particles, go back / go to", () => {
  const g = newGame();
  g.type("east.");
  assert.equal(g.get("S.room"), "corridor");
  g.type("pick up the lantern!");
  assert.equal(g.get("S.loc.lantern"), "player");
  g.type("put the lantern down");
  assert.equal(g.get("S.loc.lantern"), "corridor");
  g.type("go back");
  assert.equal(g.get("S.room"), "cell");
  g.type("go to the corridor");
  assert.equal(g.get("S.room"), "corridor");
  g.type("look at the guard");
  assert.equal(g.lines().at(-1 - (g.last() === "A rat scurries in.")), "Bored and clearly hungry.");
  g.type("?");
  assert.match(g.last(), /^Commands: /);
});

test("parser: typos and missing things cost no turn", () => {
  const g = newGame();
  g.type("take unicorn", "go sideways", "drop lantern", "xyzzy");
  assert.equal(g.get("S.count.turns"), 0);
});

test("robustness: [id] echo stays literal; prototype names, huge input", () => {
  const g = newGame();
  g.type("[guard]");
  assert.ok(g.lines().includes("> [guard]"));
  g.type("constructor", "__proto__", "take constructor", "examine __proto__", "talk toString");
  assert.equal(g.errors.length, 0);
  const t = Date.now();
  g.type("take " + "lantern bread key ".repeat(500));
  assert.ok(Date.now() - t < 500, "long input stays fast");
  assert.ok(g.lines().at(-1).length < 300);
});

test("sundown: board up, arm yourself, and see the dawn ending", () => {
  const st = storage();
  const g = newGame(SUN, { storage: st });
  g.type(...TO_BOARD, "look under the rug", "take crowbar");
  assert.equal(g.get("S.flags.boarded"), true);
  for (let i = 0; i < 40 && !g.get("S.over"); i++) g.type("z");
  assert.match(g.last(), /THE END: Dawn\. \(Endings found: 1 of 3\.\)$/);
  assert.ok(g.lines().includes("You boarded up the window. You were inside when they came. You had a crowbar in your hand."));
  assert.match(load(SUN, { storage: st }).boot().$("menu").textContent, /Endings found: 1 of 3 · Dawn/);
});

test("sundown: replies, kinds, self, rotate, free verbs and named conditions", () => {
  const g = newGame(SUN);
  g.type("smell", "listen", "smell me", "think");
  assert.equal(g.get("S.count.turns"), 0, "free verbs");
  assert.equal(g.lines().at(-2), "You take stock.");
  g.type("listen to the radio", "listen to radio", "listen radio", "listen radio");
  assert.deepEqual(g.lines().filter((l, i, L) => L[i - 1]?.startsWith("> listen")).slice(-4),
    ["\"...stay indoors after dark...\"", "Static, then a hymn.", "\"...repeat, stay indoors...\"", "\"...stay indoors after dark...\""]);
  g.type("s", "e", "eat hammer", "eat nails");
  assert.deepEqual(g.lines().slice(-3).filter(l => !l.startsWith(">")), ["You consider eating the claw hammer. Your dentist sits bolt upright in bed.", "The box of nails is not food. You checked. With your teeth."]);
  g.type("take window");
  assert.equal(g.last(), "You don't see that here.");
  g.type("w", "n", "take window", "board window", "nail window", "sleep");
  assert.deepEqual(g.lines().filter(l => !l.startsWith(">")).slice(-4, -1), ["It's part of the cabin.", "You need plywood, a hammer and nails.", "You need plywood, a hammer and nails."]);
  assert.equal(g.last(), "You're not tired. You're terrified.");
  g.run("S.count.turns = 25");
  g.type("sleep", "foo", "foo");
  assert.deepEqual(g.lines().filter(l => !l.startsWith(">") && !l.startsWith("The sun")).slice(-3), ["Not now. Not with the light going.", "Huh?", "Say that again, slower."]);
});

test("sundown: tags color items; hints suggest what changes things", () => {
  const g = newGame(SUN);
  g.type(...TO_BOARD.slice(0, -1), "think");
  assert.match(g.last(), /^Ideas: .*combine the plywood and the window/);
  assert.ok(!/hammer and the nails/.test(g.last()), "secret recipes stay out");
  const spans = g.$("out").children.flatMap(p => p.children).filter(s => typeof s !== "string" && s.className.startsWith("item"));
  assert.ok(spans.some(s => s.textContent === "claw hammer" && s.className === "item combine"));
  assert.ok(spans.some(s => s.textContent === "rug" && s.className === "item use"));
  assert.ok(spans.some(s => s.textContent === "radio" && s.className === "item flavor"));
});

test("validator: both samples are clean", () => {
  assert.deepEqual(load(CELL).boot().problems(), []);
  assert.deepEqual(load(SUN).boot().problems(), []);
});

test("validator: reports broken references, typos in effects and unknown names", () => {
  const broken = CELL.replace('east: "corridor", down', 'east: "corridr", down')
    .replace('if: { in: "yard" }', 'if: { in: "yard", inside: "yard" }')
    .replace('say: "The key turns', 'sey: "The key turns')
    .replace('title: "The Damp Cell",', 'title: "The Damp Cell", messages: { nope: "x" }, conds: { A: { flog: "x" } },');
  const g = load(broken).boot();
  assert.deepEqual(g.problems(), [
    'rooms.cell.exits.east: no room "corridr"',
    'items.key.on.use[0].sey: unknown effect "sey"',
    'conds.A.flog: unknown condition "flog"',
    'messages.nope: no engine message "nope"',
    'events[3].if.inside: unknown condition "inside"'
  ]);
  assert.equal(g.errors.length, 1, "problems are also logged to the console");
});

test("validator: verb names and data fields are names, not effects or conditions", () => {
  const ok = SUN.replace('food: { eat:', 'food: { take: "No.", give: "No.", set: "No.", in: "No.", eat:')
    .replace('rug: { name: "rug",', 'rug: { in: "nowhere", name: "rug",');
  assert.notEqual(ok, SUN);
  assert.deepEqual(load(ok).boot().problems(), []);
});

test("template builds, validates clean, and can be finished", () => {
  const g = load(build("template")).boot();
  assert.deepEqual(g.problems(), []);
  g.click("bs");
  g.type("bite coin", "take coin", "talk keeper", "1");
  assert.ok(g.lines().includes("Real copper. Tastes like a penny."));
  assert.equal(g.last(), "You're through in 3 turns. THE END.");
});

test("game-local add-ons (\"./name\") build, and the input, text and start hooks work", () => {
  const g = load(build("tests/local-addon")).boot();
  assert.deepEqual(g.problems(), []);
  g.click("bs");
  g.type("shout hello there");
  assert.equal(g.last(), "HELLO THERE!");
  g.type("loud", "x coin");
  assert.equal(g.last(), "WORN SMOOTH. ENOUGH FOR A TOLL.");
  assert.equal(g.get("S.count.turns"), 2, "a line the input hook handles costs no turn");
  assert.equal(g.get("S.shout.rooms"), 1, "the enter hook ran for the start room");
  g.type("restart");
  assert.equal(g.lines()[0], "My Game");
});

test("light: Continue and undo don't reveal a dark room", () => {
  let g = newGame();
  g.type("d", "menu");
  g.click("bc");
  assert.deepEqual(g.lines(), ["It's pitch dark. You can't see a thing."]);
  g = newGame();
  g.type("d", "z", "undo");
  assert.equal(g.last(), "It's pitch dark. You can't see a thing.");
});

test("continue: a save missing newer state keys still loads", () => {
  const st = storage(), g = newGame(SUN, { storage: st });
  g.type("listen radio");
  const k = "Sundown:save", d = JSON.parse(st.map.get(k)), s = JSON.parse(d.s);
  delete s.seq; delete s.seed; d.s = JSON.stringify(s); st.map.set(k, JSON.stringify(d));
  const g2 = load(SUN, { storage: st }).boot();
  g2.click("bc");
  g2.type("listen radio", "s", "listen");
  assert.equal(g2.errors.length, 0);
  assert.equal(g2.get("S.room"), "yard");
});

test("random: seeded rolls repeat exactly, and undo can't re-roll", () => {
  const seeded = SUN.replace("seed: 1,", "seed: 7,");
  const play = () => { const g = newGame(seeded); g.type("s", "listen", "z", "listen", "z", "listen", "z", "z", "z"); return g.lines(); };
  const a = play();
  assert.deepEqual(play(), a, "same seed, same game");
  const heard = a.filter((l, i) => a[i - 1] === "> listen");
  assert.ok(heard.length === 3 && heard.every(l => /trees|cracks|breathing/.test(l)));
  const g = newGame(seeded);
  g.type("s", "listen");
  const first = g.last();
  g.type("undo", "s", "listen");
  assert.equal(g.last(), first, "undo restores the seed");
});

test("status line: shown while playing, refreshed every command", () => {
  const g = newGame(SUN);
  assert.equal(g.$("st").hidden, false);
  assert.equal(g.$("st").textContent, "Turn 0 of 30");
  g.type("s", "smell");
  assert.equal(g.$("st").textContent, "Turn 1 of 30");
  assert.equal(newGame().$("st").hidden, true, "no G.status, no line");
});

test("validator: aliases and phrasal verbs must lead somewhere; named conditions in not/any", () => {
  const bad = CELL.replace('title: "The Damp Cell",', 'title: "The Damp Cell", aliases: { press: "pushh" }, phrasal: { "kick over": "take" },')
    .replace('if: { in: "yard" }', 'if: { in: "yard", not: "NOPE", any: ["NOPE2"] }');
  assert.deepEqual(load(bad).boot().problems(), [
    'aliases.press: no command "pushh"',
    'events[3].if.not: no condition "NOPE" in conds',
    'events[3].if.any[0]: no condition "NOPE2" in conds'
  ]);
});
