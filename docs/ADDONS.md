# Add-ons

The engine never changes for a game. New mechanics go in add-ons: one file each, registered with `addon({...})`.
A game switches add-ons on in its `build.json`:

```json
{ "addons": ["light", "craft", "./tour"] }
```

- A plain name is a shared add-on in `addons/<name>.js`.
- A name starting with `./` is the game's own add-on, in `games/<game>/<name>.js`. Use it for a mechanic only this game will ever have (a guided tour, a scripted chase). It follows the same contract. If a second game wants it, move it to `addons/`.

The build puts each add-on in its own `<script>` after the engine, in the order listed. Add-ons register while that script runs. The engine boots on `DOMContentLoaded`, after every script has loaded.

**Hook order.** Every hook runs in `build.json` order, shared and game-local add-ons alike. For `before`, the first hook that returns `true` stops the command: later add-ons' `before` hooks, replies and the built-in never see it. So list the add-on that should win first (light before anything that answers `look` or `take`). There are no priorities: the list is the order.

## Before writing one: is it data?

Most v1 add-ons turned out to be data the engine should read. Check these first. They are all in the core now:

| You want | Use |
|---|---|
| a new verb on things, rooms or the player | `on: { verb: REPLY }`, `self`, `G.on` |
| the same reply for a whole group of things | `kind` + `kinds` |
| rotating or escalating lines | TEXT `{ rotate: [...] }` / `{ ladder: [...] }` |
| a condition reused in many places | `conds` + `if: "NAME"` |
| what the player typed | `said:` |
| a free action, or a refund for one reply | `verbs.X.free`, effect `free: true` |
| reworded engine lines | `messages` |
| a timer | `every: n`, or `since` + `mark` |
| randomness | TEXT `{ random: [...] }`, condition `chance: n` |
| a score, health or clock always on screen | `status: TEXT` |
| undo, again, restart, save across reloads | built in |

## Contract

```
addon({
  name:       "id",                        required, unique
  state:      { ... },                     saved in S[name]; included in Continue and undo
  commands:   { verb(arg, ids) { ... } },  new commands (cost a turn); ids = the things the line names, in reach
  free:       ["verb"],                    commands that DON'T cost a turn
  aliases:    { word: "verb" },   phrasal: { "two words": "verb" },
  conditions: { key: value => true/false },  usable in any "if"
  effects:    { key: value => { ... } },   usable in events, replies, dialogue options
  messages:   { id: "default line" },      printed with msg(id, vars); games reword them in G.messages
  refs:       { key: (value, need) => need(ok, "problem") },  checks every use of a data key, wherever it is
  maps:       { key: "data" },             a top-level G key whose keys are names (journal entries...)
  meta:       ["key"],                     extra keys allowed next to effects (recipes: with, fail...)
  // hooks
  input(words, raw)     before a typed line is read: return new words, or true to stop (handled)
  before(verb, arg, ids)  before every command, including the engine's own (look on entering); true stops it.
                        Runs before the core asks "Which do you mean?", so an add-on can resolve names itself
  afterTurn()           after each turn's events, unless the game has ended
  start()               a new game was set up (S is fresh), before the intro prints
  enter(room)           the player just entered a room (after it was shown): encounters, room scripts
  end(text)             the game just ended
  text(line, cls)       every line about to print: return it changed, or "" to hide it
  tag(id)               a class name to add to [id]'s styled span (or nothing)
  boot()                the page is ready (after the engine's own boot); add menu lines, read storage
  validate(need)        need(ok, "path", "problem") checks this add-on's data
  changed(id, key, from, to)  a prop, counter or location changed: id is the thing (null for a game counter), key the
                        prop's name, the counter's, or "loc" for a move (to: a room, "player", a holder or null).
                        React here (death, weight limits, hostility) instead of checking every turn. A hook may change
                        things in turn; past 8 nested changes the engine stops calling hooks, to end a loop
})
```

Engine helpers add-ons may use: `G`, `S`, `print(text, cls)`, `msg(id, vars)`, `txt(TEXT, vars)`, `test(COND)`,
`run(EFFECT)`, `reply(REPLY)`, `exec(verb, arg)`, `named(text, ids)`, `find(text, ids)`, `thing(id)`, `at(table, place)`,
`inv()`, `reach()` (everything the player can touch, through open holders), `nested(ids)` (those and what's visible in them),
`where(id)` (the room, or "player", around a thing), `holder(id)` ("in", "on" or undefined), `contents(ids)` (prints what's in them),
`names(ids)`, `list(v)`, `own(obj, key)`, `notHere(msgId)` (prints it, costs no turn), `MULTI` (verbs that take "all"),
`isFree(verb)`, `isDir(word)`, `words(text)`, `LINE` (the command being answered: `LINE.verb`, `LINE.said` (the words as
typed, filler dropped, particles kept), `LINE.it` (the thing answering), `LINE.what` and `LINE.with` (the two slots: "give WHAT
to WITH")), `nm(id)` (a thing's current name), `levelOf(id)` ("up", "down" or null: where it is in its room), `prop("guard.hp")` (a prop or counter now),
`setProp("guard.hp", 7)` / `setLoc(id, where)` (change one and tell the `changed` hooks: use these, not `S.props` or `S.loc`), `bySlot(ids)` (the order
replies are asked in: the second slot, the direct thing, then the rest), `the(id)` / `a1(id)` ("the [id]", "a [id]", or "[id]" for a proper name), `TURN` (`TURN.cost`: this command costs a turn; `TURN.free`: it was refunded),
`store(key, value)` / `load(key)` (browser storage, namespaced by the game's title), `rand(n)` (a whole number
from 0 to n-1, from the seeded generator in `S`: use it, never `Math.random`, so undo and saves stay honest), `$`, `out`.
Reusing a name that's already taken is reported as a problem on the start menu.

Rules:
- **Never replace an engine function** (`print = ...`, `act = ...`). Use a hook. If no hook fits, the engine is missing one; add it to the engine for every game, with a test.
- Look up anything the player typed with `own(table, key)`, never `table[key]`: "constructor" and "__proto__" are typable.
- Print through `msg()` with a default in `messages`, so games can reword every line.
- Validate with `refs` and `validate`. Don't walk `G` yourself: the engine's walker already knows which keys are names and which are data.

## Walkthrough: `addons/light.js`

**Goal:** some rooms are dark. In a dark room the player can't see unless they carry, or stand near, something that gives light.

1. **Data it reads.** `rooms.X.dark` and `items.X.light`, each `true` or a COND. The engine ignores keys it doesn't know, so games without the add-on aren't affected.
2. **Private helpers.** The file is wrapped in `{ ... }`, so `holds` and `inDark` don't leak:
   ```js
   const holds = v => v === true || (!!v && typeof v === "object" && test(v));
   const inDark = () => holds(G.rooms[S.room].dark) && ![...inv(), ...at(G.items)].some(id => holds(G.items[id].light));
   ```
3. **State.** `state: { room: null, dark: false }` records what the player last saw, saved in `S.light`.
4. **Messages.** `messages: { dark: "It's pitch dark...", darkFalls: "Everything goes dark." }` — a game rewords them in `G.messages`.
5. **Condition.** `conditions: { dark: v => inDark() === v }` lets any game write `if: { dark: true }`.
6. **Blocking commands.** `before(v, a)` stops `look`, `take` and `examine` of anything not carried. Entering a room runs `look` through `exec`, so walking into the dark is covered.
7. **Reacting to changes.** `afterTurn()` handles light changing while the player stands still.
8. **Checking data.** `validate(need)` reports a dark room when no item gives light.

## Writing a new add-on

1. Create `addons/<name>.js` (or `games/<game>/<name>.js` for a one-game mechanic). Start with a header comment: the data keys it reads, and the conditions, effects, commands and messages it adds. The header is the documentation.
2. Wrap private helpers in `{ }` and call `addon({ name: "<name>", ... })`.
3. List it in a game's `build.json`, build, and check the validator output.
4. Add a test to `tests/run.js` that plays through the mechanic in a built game. `tools/headless.js` can stand in for the
   browser's storage (`load(html, { storage: storage() })`) and file downloads (`load(html, { download: downloads() })`,
   whose `files` collects `{ name, text }` for each saved file).

Keep it small. Use the engine's helpers and tables instead of copying their logic.

## A full example

`games/big-footprint/` is a full game whose own mechanics (a guided tour, strikes, guard checkpoints, a
clock with sound bands, a run report) live in two game-local add-ons, `verbs.js` and `nouns.js`, using only hooks.
`games/big-footprint/PORT.md` explains how they map onto the contract.

## Shared add-ons

| File | Adds | Data it reads |
|---|---|---|
| `light.js` | dark rooms; a `dark` condition | `rooms.X.dark`, `items.X.light` |
| `craft.js` | `combine a and b` / `use a on b` | `G.recipes` |
| `journal.js` | `log`/`recap` effects, a `logged` condition, a free `journal` command | `G.journal` |
| `endings.js` | remembers found endings between plays; "Endings found: N of M" on the start menu | `G.endings` |
| `tags.js` | item colors: key, combinable/tool, usable, scenery; a free `colors` command | `items.X.tag`, recipes, `has:` in replies, `on` |
| `hints.js` | `hints:TEXT` effect: "Ideas:" for what changes something right here; `secret`, `hint` | `G.recipes`, `on` |

Order: `light` first (darkness should block sight before anything else answers), then `craft` before anything that handles `use`.
