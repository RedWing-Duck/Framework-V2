// Headless tests against the BUILT files, so bundling is tested too.
//   node tools/build.js damp-cell && node tools/build.js sundown && node tools/build.js big-footprint && node tests/run.js
// The word layer runs against tests/words/, game-local add-ons against tests/local-addon/; big-footprint's suite is tests/big-footprint.js.
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const { load, storage, downloads } = require("../tools/headless"), { build } = require("../tools/build");

const dist = name => fs.readFileSync(path.join(__dirname, `../dist/${name}.html`), "utf8");
const CELL = dist("damp-cell");
const SUN = dist("sundown").replace('title: "Sundown",', 'title: "Sundown", seed: 1,');   // seeded: the owl and the yard's sounds roll the same every run
const newGame = (h = CELL, opts) => { const g = load(h, opts).boot(); g.click("bs"); return g; };
const TO_KEY = ["d", "u", "e", "take lantern", "w", "d", "take bread", "u", "e", "talk guard", "1", "use key"];
const TO_BOARD = ["s", "e", "open toolbox", "take hammer", "take nails", "take plywood", "w", "n", "use plywood on window"];

for (const name of fs.readdirSync(path.join(__dirname, "../games")).filter(n => fs.existsSync(path.join(__dirname, `../games/${n}/game.js`))))   // every game, new ones too
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
  g.type("s", "e", "open toolbox", "eat hammer", "eat nails");
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
    .replace('if: { in: "yard" }', 'if: { in: "yard", inn: "yard" }')
    .replace('say: "The key turns', 'sey: "The key turns')
    .replace('title: "The Damp Cell",', 'title: "The Damp Cell", conds: { A: { flog: "x" } },')
    .replace('messages: { arrives:', 'messages: { nope: "x", arrives:');
  const g = load(broken).boot();
  assert.deepEqual(g.problems(), [
    'rooms.cell.exits.east: no room "corridr"',
    'items.key.on.use[0].sey: unknown effect "sey"',
    'conds.A.flog: unknown condition "flog"',
    'messages.nope: no engine message "nope"',
    'events[2].if.inn: unknown condition "inn"'
  ]);
  assert.equal(g.errors.length, 1, "problems are also logged to the console");
});

test("validator: verb names and data fields are names, not effects or conditions", () => {
  const ok = SUN.replace('food: { eat:', 'food: { take: "No.", give: "No.", set: "No.", in: "No.", eat:')
    .replace('rug: { name: "rug",', 'rug: { in: "nowhere", name: "rug",');
  assert.notEqual(ok, SUN);
  assert.deepEqual(load(ok).boot().problems(), []);
  for (const w of ["look", "x", "north", "listen"]) {   // a verb alias can't take over a command, a built-in alias, a direction or another verb
    const p = load(SUN.replace('aliases: ["ponder"]', `aliases: ["ponder", "${w}"]`)).boot().problems();
    assert.ok(p.some(l => l.startsWith("verbs.think.aliases") && l.includes(`"${w}"`)), w + ": " + p.join("; "));
  }
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
  delete s.seq; delete s.seed; delete s.journal; d.s = JSON.stringify(s); st.map.set(k, JSON.stringify(d));   // journal: as if the add-on came later
  const g2 = load(SUN, { storage: st }).boot();
  g2.click("bc");
  g2.type("listen radio", "s", "listen", "n", "drink mug", "journal");
  assert.equal(g2.errors.length, 0);
  assert.equal(g2.get("S.room"), "cabin");
  assert.deepEqual(g2.get("S.journal"), ["coffee"], "a missing add-on state starts fresh");
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
    'events[2].if.not: no condition "NOPE" in conds',
    'events[2].if.any[0]: no condition "NOPE2" in conds'
  ]);
});

test("containers and surfaces: closed toolbox, put in, contents listed, take all, take X and Y", () => {
  const g = newGame(SUN);
  assert.ok(g.lines().includes("On the shelf: can of coffee grounds, mug of coffee."), "a surface's things are listed with the room");
  g.type("s", "e", "take nails");
  assert.equal(g.last(), "You don't see that here.", "nothing in a closed box can be reached");
  g.type("open toolbox");
  assert.deepEqual(g.lines().slice(-2), ["You open the toolbox.", "In the toolbox: box of nails."]);
  const t = g.get("S.count.turns");
  g.type("take all");
  assert.deepEqual(g.lines().slice(-3), ["Taken: claw hammer", "Taken: box of nails", "Taken: plywood"]);
  assert.equal(g.get("S.count.turns"), t + 1, "take all is one turn");
  g.type("put nails in toolbox", "close toolbox");
  assert.deepEqual(g.lines().slice(-3), ["You put the box of nails in the toolbox.", "> close toolbox", "You close the toolbox."]);
  g.type("put hammer in toolbox");
  assert.equal(g.last(), "The toolbox is closed.");
  g.type("drop hammer and plywood");
  assert.deepEqual(g.lines().slice(-2), ["Dropped: claw hammer", "Dropped: plywood"]);
  g.type("take all");
  assert.equal(g.get("S.loc.nails"), "toolbox", "take all doesn't reach into a closed box");
});

test("put X on Y: a holder takes it; anything else is use X on Y (recipes answer)", () => {
  const g = newGame(SUN);
  g.type("s", "e", "open toolbox", "take all", "w", "n", "put mug on shelf");
  assert.deepEqual(g.lines().slice(-2), ["(first taking the mug of coffee)", "You put the mug of coffee on the shelf."], "put takes the thing first");
  g.type("put plywood on window");
  assert.equal(g.last(), "You nail the plywood over the window. Solid.");
});

test("disambiguation: Which do you mean? (free), then a word that picks one; take prefers what you don't carry", () => {
  const g = newGame(SUN);
  g.type("take coffee");
  assert.equal(g.last(), "Which do you mean: the can of coffee grounds or the mug of coffee?");
  assert.equal(g.get("S.count.turns"), 0);
  g.type("mug");
  assert.equal(g.last(), "Taken: mug of coffee");
  assert.equal(g.get("S.count.turns"), 1);
  g.type("take coffee");
  assert.equal(g.last(), "Taken: can of coffee grounds", "the one not carried");
  g.type("eat coffee", "s");
  assert.equal(g.get("S.room"), "yard", "a new command instead of an answer just runs");
});

test("pronouns: it is the last thing acted on", () => {
  const g = newGame(SUN);
  g.type("x radio", "listen to it");
  assert.equal(g.last(), "\"...stay indoors after dark...\"");
  g.type("x rug", "look under it");
  assert.equal(g.last(), "Under the rug: a crowbar.");
});

test("topics: ask/tell about; dialogue options can be picked by their words", () => {
  const g = newGame();
  g.type("e", "ask guard about the gate", "ask about keys", "tell him about the weather");
  assert.deepEqual(g.lines().filter(l => l.startsWith("\"") || l.startsWith("He")).slice(-3),
    ["\"Stays locked. Orders.\"", "He pats his belt. \"Mine.\"", "He shrugs. \"Don't know, don't care.\""]);
  g.type("talk guard", "let me out");
  assert.equal(g.lines().find((l, i, L) => L[i - 1] === "> let me out"), "Guard: \"Ha! Not a chance.\"");
});

test("chance: one roll per condition per command", () => {
  const g = newGame(SUN);
  assert.equal(g.run("[...Array(40)].every(() => { ROLLS.clear(); const c = { chance: 50 }; return test(c) === test(c); })"), true);
  assert.equal(g.run("ROLLS.clear(); [...Array(200)].map(() => test({ chance: 50 })).filter(Boolean).length > 60"), true, "fresh conditions still roll");
});

test("save version: G.version changes end runs in progress", () => {
  const st = storage(), g = newGame(CELL, { storage: st });
  g.type("e");
  assert.equal(load(CELL, { storage: st }).boot().$("bc").hidden, false);
  const v2 = CELL.replace('title: "The Damp Cell",', 'title: "The Damp Cell", version: 2,');
  assert.equal(load(v2, { storage: st }).boot().$("bc").hidden, true);
});

test("validator: holders, at chains and open/close/inside targets", () => {
  const bad = SUN.replace('holds: "in", closed: true', 'holds: "inside", closed: true')
    .replace('grounds: { name: "can of coffee grounds", at: "shelf"', 'grounds: { name: "can of coffee grounds", at: "plywood"')
    .replace('set: "lifted",', 'set: "lifted", open: "rug", inside: { crowbar: "rug" },');
  assert.deepEqual(load(bad).boot().problems(), [
    'items.grounds.at: no room or holder "plywood"',
    'items.toolbox.holds: must be "in" or "on"',
    'items.rug.on.search[0].inside: unknown effect "inside"',
    'items.rug.on.search[0].open: "rug" can\'t open or close (give it closed:true or false)',
    'items.rug.on.search[0].inside: "crowbar" in "rug": needs an item and a holder'
  ]);
});
require("./big-footprint");   // This Place Has a Big Footprint: the original regression suite

// ---- the word layer (tests/words): two slots, pointing by a word, pronouns by kind, articles, moves you can see
const WORDS = () => { const g = load(build("tests/words")).boot(); assert.deepEqual(g.problems(), []); g.click("bs"); return g; };

test("two slots: give X to Y and give Y X fill what and with; {the:what} and {The:with} read them", () => {
  const g = WORDS();
  g.type("take letter", "show the letter to tony");
  assert.equal(g.last(), "Big Tony reads the letter and goes pale.");
  g.type("show tony the lamp");
  assert.deepEqual(g.lines().slice(-2), ["(first taking the unlit lamp)", "Big Tony shrugs at the unlit lamp."], "a person named first is the second slot; carry:true takes it first");
  g.type("hit tony with lamp");
  assert.equal(g.last(), "You swing the unlit lamp at Big Tony.");
  g.type("hit tony");
  assert.equal(g.last(), "Hit it with what?", "with: fails when nothing fills the second slot");
  g.type("drop letter", "e", "show the letter to ana");
  assert.equal(g.last(), "You don't see that here.", "a first slot that names something out of reach");
});

test("slot order: the second slot answers first, whichever way the line is said", () => {
  const g = WORDS();
  g.type("take letter", "show the letter");
  assert.equal(g.last(), "You wave the letter around. Nobody reads it.", "no second slot: the letter's own reply");
  for (const c of ["show the letter to tony", "show tony the letter", "show him the letter"]) {
    g.type(c); assert.equal(g.last(), "Big Tony reads the letter and goes pale.", c); }
});

test("up and down: look up / look down show the room's view and the things at that level; level effect, condition, drop", () => {
  const g = WORDS();
  g.type("look up");
  assert.equal(g.last(), "Nothing special up there.");
  g.type("e", "look up");
  assert.deepEqual(g.lines().slice(-3), ["Cobwebs on the beams.", "The kite: Paper, torn, caught on a beam.", "The hook: Rusted iron."], "the room, then each thing up, named, hidden scenery too");
  g.type("look down");
  assert.equal(g.last(), "Bare boards.");
  g.type("shake beam", "look down");
  assert.deepEqual(g.lines().slice(-2), ["Bare boards.", "The kite: Paper, torn, caught on a beam."], "the level effect moved it");
  assert.equal(g.get("S.level.kite"), "down");
  g.type("yank hook", "look below");
  assert.equal(g.last(), "The hook: Rusted iron.", "a level can follow the state (TEXT variants); below = down");
  g.type("look up");
  assert.equal(g.last(), "Cobwebs on the beams.");
  g.type("take kite", "look down");
  assert.ok(!g.lines().slice(-2).includes("The kite: Paper, torn, caught on a beam."), "carried things aren't up or down");
  g.type("w", "drop kite", "look down");
  assert.equal(g.last(), "The kite: Paper, torn, caught on a beam.", "a thing with a level lands on the floor");
  g.type("look up at the ceiling");
  assert.equal(g.last(), "You don't see that here.", "look up at X examines X");
  const v = load(build("tests/words").replace('level: "up", desc: "Paper', 'level: "sideways", desc: "Paper')).boot().problems();
  assert.ok(v.some(p => p.startsWith("items.kite.level")), v.join("\n"));
});

test("pointing: a word narrows a name before asking, 'the other one', 'both', 'all except'", () => {
  const g = WORDS();
  g.type("take chipped cup");
  assert.equal(g.last(), "Taken: white cup", "'chipped' fits one cup, so 'cup' doesn't ask");
  g.type("take the other one");
  assert.equal(g.last(), "Taken: cup of tea");
  g.type("drop all", "take cup");
  assert.equal(g.last(), "Which do you mean: the white cup or the cup of tea?");
  const t = g.get("S.count.turns");
  g.type("both");
  assert.deepEqual(g.lines().slice(-2), ["Taken: white cup", "Taken: cup of tea"]);
  assert.equal(g.get("S.count.turns"), t + 1, "'both' is one turn");
  g.type("drop cup");
  assert.equal(g.last(), "Which do you mean: the white cup or the cup of tea?", "both carried: drop still asks");
  g.type("tea", "drop all", "take all except lamp and letter");
  assert.deepEqual(g.get("Object.keys(S.loc).filter(k => S.loc[k] === 'player')").sort(), ["tea", "white"]);
});

test("pronouns by kind: it is the last item, him/her the last person by npcs.X.pronoun, them the last thing", () => {
  const g = WORDS();
  g.type("x letter", "x tony", "x it");
  assert.equal(g.last(), "Sealed with red wax.", "it skips the person");
  g.type("x him");
  assert.equal(g.last(), "Big.");
  g.type("x her");
  assert.equal(g.last(), "You don't see that here.", "Tony is him, not her");
  g.type("show it to him");
  assert.ok(g.lines().includes("Big Tony reads the letter and goes pale."));
});

test("articles: proper names take none; {A} and {The}; a name can follow the state", () => {
  const g = WORDS();
  g.type("whistle", "z");
  assert.equal(g.last(), "Ana arrives.", "proper: no 'The Ana'");
  g.type("light lamp");
  assert.equal(g.last(), "The lit lamp flickers on.");
  g.type("take lit lamp", "i");
  assert.equal(g.last(), "You carry: lit lamp");
  const c = newGame();   // damp-cell: a silent event's move is narrated by messages.arrives / leaves
  c.type("z", "z");
  assert.ok(c.lines().includes("The rat scurries out."));
  c.type("e");
  assert.ok(c.lines().includes("Here: rat"));
});

test("moves you can see: an event that says nothing narrates things entering or leaving the room", () => {
  const g = WORDS();
  g.type("whistle", "z");
  assert.equal(g.last(), "Ana arrives.");
  g.type("z", "z");
  assert.equal(g.last(), "Ana leaves.");
  g.type("e");
  assert.ok(g.lines().includes("Here: Ana"));
  g.type("z");
  assert.equal(g.last(), "Ana leaves.", "wherever the player is");
});

test("oops replaces the unknown word of the last line; brief and verbose; the transcript keeps every line", () => {
  const st = storage(), g = load(build("tests/words"), { storage: st }).boot(); g.click("bs");
  g.type("x lettr", "oops letter");
  assert.equal(g.last(), "Sealed with red wax.");
  g.type("tkae cup of tea", "oops take");
  assert.equal(g.last(), "Taken: cup of tea");
  g.type("oops");
  assert.equal(g.last(), "There's nothing to correct.");
  g.type("brief", "e", "w");
  assert.ok(!g.lines().slice(-6).includes("A small kitchen."), "brief: a room seen before skips its description");
  assert.equal(load(build("tests/words"), { storage: st }).boot().get("PREF.brief"), true, "a player setting: kept after a reload");
  const t = g.get("S.count.turns");
  g.type("verbose", "undo");
  assert.equal(g.get("S.count.turns"), t - 1, "verbose is free (undo steps back past it)");
  assert.equal(g.get("PREF.brief"), false, "undo doesn't change a setting");
  for (let i = 0; i < 300; i++) g.type("z");
  assert.equal(g.get("LOG[0]"), "Words", "the transcript keeps what the screen dropped");
  assert.ok(g.get("LOG.length") > 600);
  g.type("transcript");
  assert.equal(g.last(), "This browser won't save files, so the transcript can't be saved here.");
});

// ---- the word layer, fifth pass: each test is named after the fix it covers (docs/REVIEW.md, "Fifth pass")
test("implicit take obeys add-ons and replies: in the dark, or refused, the command stops", () => {
  const cell = CELL.replace('bread: { name: "stale bread",', 'crate: { name: "crate", at: "cellar", holds: "in", fixed: true }, bread: { name: "stale bread",');
  const g = newGame(cell);
  g.type("d", "take bread");
  assert.equal(g.last(), "It's pitch dark. You can't see a thing.");
  g.type("put bread in crate");
  assert.equal(g.last(), "It's pitch dark. You can't see a thing.", "the light add-on refuses the implicit take too");
  assert.equal(g.get("S.loc.bread"), "cellar");
  g.type("u", "e", "take lantern", "w", "d", "put bread in crate");
  assert.deepEqual(g.lines().slice(-2), ["(first taking the stale bread)", "You put the stale bread in the crate."], "with a light, it works");
  const w = WORDS();
  w.type("n", "show sugar to rex");
  assert.deepEqual(w.lines().slice(-2), ["> show sugar to rex", "The sugar is caked to the shelf."], "a reply on take refuses it, and show never runs");
  assert.equal(w.get("S.loc.sugar"), "study");
});

test("'the other one' is forgotten on leaving the room or naming something else", () => {
  const g = WORDS();
  g.type("take cup", "white", "e", "w", "take the other one");
  assert.equal(g.get("S.loc.tea"), "kitchen", "after leaving and coming back, 'the other one' points at nothing");
  assert.equal(g.last(), "You don't see that here.");
  g.type("drop cup", "take cup", "white", "x letter", "take the other one");
  assert.equal(g.get("S.loc.tea"), "kitchen", "naming the letter ended the old pair");
  g.type("drop all", "take cup", "white", "take the other one");
  assert.equal(g.last(), "Taken: cup of tea", "right after the question it still works");
});

test("a role word inside a name doesn't split the line: 'the letter to Ana'", () => {
  const g = WORDS();
  g.type("n", "x letter to ana");
  assert.equal(g.last(), "Addressed in pencil.");
  g.type("take the letter to ana");
  assert.equal(g.last(), "Taken: letter to Ana", "'to' and 'the' inside the name stay");
  g.type("s", "show letter to ana to tony");
  assert.equal(g.last(), "Big Tony shrugs at the letter to Ana.", "the second 'to' is the role word");
  g.type("show tony the letter to ana");
  assert.equal(g.last(), "Big Tony shrugs at the letter to Ana.");
});

test("messages: {dir} in arrives/leaves; article an/some through {a}/{A}; proper names in 'Which do you mean?'", () => {
  const html = build("tests/words").replace('title: "Words",', 'title: "Words", messages: { arrives: "{The} comes in from the {dir}.", leaves: "{The} goes out to the {dir}." },');
  const g = load(html).boot(); g.click("bs");
  g.type("whistle", "z");
  assert.equal(g.last(), "Ana comes in from the east.");
  g.type("z", "z");
  assert.equal(g.last(), "Ana goes out to the east.");
  const w = WORDS();
  w.type("n", "weigh map");
  assert.equal(w.last(), "You weigh an honest map. An honest map is lighter than it looks.", "article: an");
  w.type("weigh sugar");
  assert.equal(w.last(), "You weigh some sugar. Some sugar is lighter than it looks.", "article: some");
  w.type("x dog");
  assert.equal(w.last(), "Which do you mean: the toy dog or Rex?", "proper: no article in the list");
  w.type("rex");
  assert.equal(w.last(), "A real dog.");
});

test("transcript: saves '<title> transcript.txt' with every line printed, then says how many", () => {
  const d = downloads(), g = load(build("tests/words"), { download: d }).boot(); g.click("bs");
  for (let i = 0; i < 300; i++) g.type("z");
  const before = g.lines();
  g.type("transcript");
  assert.equal(d.files.length, 1);
  assert.equal(d.files[0].name, "Words transcript.txt");
  assert.equal(d.files[0].text, [...before, "> transcript"].join("\n") + "\n", "every line, including what the screen dropped");
  assert.equal(g.last(), `Transcript saved: ${before.length + 1} lines.`);
  assert.equal(g.get("S.count.turns"), 300, "free");
});

test("hook order: before hooks run in build.json order, and the first that answers stops the command", () => {
  const g = WORDS();
  g.type("ring");
  assert.equal(g.last(), "First.", "./first is listed before ./second");
  assert.ok(!g.lines().includes("Second."));
  const html = build("tests/words"), [a, b] = [/<script>\n\/\* ---- GAME-LOCAL ADD-ON \(test fixture\): answers[\s\S]*?<\/script>/, /<script>\n\/\* ---- GAME-LOCAL ADD-ON \(test fixture\): also[\s\S]*?<\/script>/].map(r => html.match(r)[0]);
  const h = load(html.replace(a, "\0").replace(b, a).replace("\0", b)).boot(); h.click("bs");   // the same add-ons, the other way round
  h.type("ring");
  assert.equal(h.last(), "Second.");
});
