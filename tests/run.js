// Headless tests against the BUILT file, so bundling is tested too.
//   node tools/build.js damp-cell && node tests/run.js
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const { load } = require("../tools/headless"), { build } = require("../tools/build");

const DIST = path.join(__dirname, "../dist/damp-cell.html");
const html = fs.readFileSync(DIST, "utf8");
const newGame = (h = html) => { const g = load(h).boot(); g.click("bs"); return g; };
const TO_KEY = ["d", "u", "e", "take lantern", "w", "d", "take bread", "u", "e", "talk guard", "1", "use key"];

test("dist/damp-cell.html is up to date with the sources", () => {
  assert.equal(html, build("games/damp-cell"), "run: node tools/build.js damp-cell");
});

test("1. win: escape through the gate", t => {
  const g = newGame();
  g.type(...TO_KEY, "n");
  const m = g.last().match(/^You escaped in (\d+) turns! THE END\.$/);
  assert.ok(m, `last line was: ${g.last()}`);
  t.diagnostic(`escaped in ${m[1]} turns`);
  assert.equal(Number(m[1]), g.get("S.count.turns"));
});

test("2. darkness: the cellar is pitch dark without a light", () => {
  const g = newGame();
  g.type("d", "look");
  assert.equal(g.last(), "It's pitch dark. You can't see a thing.");
});

test("3. caught: wait after opening the gate", t => {
  const g = newGame();
  g.type(...TO_KEY);
  for (let i = 0; i < 10 && !g.get("S.over"); i++) g.type("z");
  assert.ok(g.lines().includes("Shouts echo from somewhere above. Someone heard the gate."));
  assert.match(g.last(), /^Guards flood the corridor\. You're caught after \d+ turns\. THE END\.$/);
  t.diagnostic(g.last());
  g.type("look");
  assert.equal(g.last(), "The game is over. Type 'menu' to return to the start menu.");
});

test("4. continue: menu and back keeps room, inventory and turns", () => {
  const g = newGame();
  g.type("e", "take lantern", "w", "d");
  const before = g.get("S");
  g.type("menu");
  assert.equal(g.playing(), false);
  assert.equal(g.$("bc").hidden, false, "Continue button is shown");
  g.click("bc");
  assert.equal(g.playing(), true);
  const after = g.get("S");
  assert.equal(after.room, "cellar");
  assert.deepEqual(after.loc, before.loc);
  assert.equal(after.loc.lantern, "player");
  assert.equal(after.count.turns, 4);
  assert.deepEqual(after, before);
  assert.equal(g.lines()[0], "Cellar", "continue shows the room again");
});

test("5. validator: sample is clean; a broken copy reports both problems", () => {
  assert.deepEqual(load(html).boot().problems(), []);
  const broken = html.replace('east: "corridor", down', 'east: "corridr", down')
    .replace('if: { in: "yard" }', 'if: { in: "yard", inside: "yard" }');
  assert.notEqual(broken, html);
  const g = load(broken).boot();
  assert.deepEqual(g.problems(), [
    'rooms.cell.exits.east: no room "corridr"',
    'events[4].if.inside: unknown condition "inside"'
  ]);
  assert.equal(g.errors.length, 1, "problems are also logged to the console");
});

test("6. template builds, validates clean, and can be finished", () => {
  const g = load(build("template")).boot();
  assert.deepEqual(g.problems(), []);
  g.click("bs");
  g.type("take coin", "talk keeper", "1");
  assert.equal(g.last(), "You're through in 2 turns. THE END.");
});
