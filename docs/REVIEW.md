# V2 review: what the games taught the framework

This is the first refinement pass. It started from three sources:
- **text-game-framework** (v1): the engine, `light.js`, and the damp-cell sample;
- **Code-Block-Reference**: 11 add-ons and `patterns.md`, harvested from *a-quick-nap*;
- **bigfoot-game**: *This Place Has a Big Footprint* (1,233 lines of data, 4 rounds of QA), plus four more add-ons (`verbs`, `nouns`, `messages`, `restart`).

The question was whether add-on calls repeat themselves, and whether anything ad hoc belongs in the framework itself.

## The headline

**The engine never changed, so every add-on had to work around it.** Neither game touched `engine/`. The rules held, but at a cost: 8 of the 15 add-ons replace an engine function (`print = ...`, `act = ...`, `parse = ...`, `run = ...`, `start = ...`, `EFFECT.end = ...`, `CMDS.look = ...`), because v1 had no hook for what they needed. Wrappers stack in load order, which is why the reference README had to fix a strict add-on order and explain why.

**About half the add-on code re-implements the same five or six things:**

| Duplicated logic | Copies in v1 add-ons | v2 |
|---|---|---|
| "run the first reply entry whose `if` passes" (string = say) | actions, verbs, hints, nouns (`pick`) | core `reply()` |
| walk all of `G` to validate the add-on's own key | quips, journal, endings, craft, nouns | core walker + `refs: { key: check }` |
| refund a turn (`S.count.turns--`) | actions, craft, nouns, plus ~20 `add: { turns: -1 }` in big-footprint's data | effect `free: true`, and "not here" costs nothing |
| keep the echo literal (`[` → `[​`) | actions, verbs (and `​` typed into big-footprint's help text) | core: the echo is printed plain |
| match multi-word names, longest first | actions (`LONGEST`), craft (`pair`), nouns (`scan`) | core `named()` |
| rotate / ladder lines | quips, messages (`rotate`), nouns (`rotate`, `ladder`) | TEXT `{ rotate }` / `{ ladder }` |
| "look at", "pick up", "look under", particles, punctuation | actions, verbs | core parser |
| reword the engine's lines | messages (matched by **exact string**, so any engine wording change breaks every game) | core `MSG` table, keyed by id |

**The game data worked around engine gaps.** Big-footprint's data shows where the engine fell short:
- Verbs capitalized as `Take`, `Say`, `Give`, because the v1 validator read any key named `take` as the take effect. Patterns.md has the same bug from the other side: "a room field named `in` is read as the `in` condition".
- `not: { not: X }` to fit a second `flag` into one `if`, and `{ min: { a: 1 }, max: { a: 1 } }` for "equals".
- `any:` and `said:` were defined in an add-on, but nearly every reply in the game uses them.
- `been_<room>` and `escbeen_<room>` flags set by hand to tell a first visit from a revisit.
- `keys: { TOUR: ..., ESCAPE: ... }` in nouns.js to name conditions. That is a core need, not a nouns feature.

**`nouns.js` is the game, not an add-on.** About 270 lines, it hard-codes the game's phases (`key("TOUR")`, `key("ESCAPE")`), strike rules (`STRIKE3_BY`), Big Tony's band line, "Through the doorway: " and its own LINES format `[key, text, obj, "free"]`. It's the clearest case for **game-local add-ons** (`"./tour"` in build.json): a home for one game's mechanics that doesn't pretend to be reusable and doesn't fill the shared `addons/` folder.

## What moved into the engine

| v1 add-on | v2 |
|---|---|
| `actions.js` (custom verbs, senses, particles, `go back`, `self`) | core: `on` replies on things, rooms, `self` and `G`; `verbs`; parser |
| `verbs.js` (room/global replies, `said`, `any`, `only`, phrasal, punctuation, bare words) | core: `on`, `said`, `any`/`all`, `phrasal`, punctuation stripping |
| `quips.js` (rotating fallbacks by kind, `$1`) | core: `kind` + `kinds` replies, TEXT `rotate`, `{it}` |
| `messages.js` (reword engine lines) | core: `G.messages` by id |
| `help.js` (free actions listed apart, hidden verbs) | core `help` |
| `history.js` (again, undo) | core `again`, `undo` (undo now also works after an ending) |
| `restart.js` | core `restart` |
| `save.js` (localStorage Continue, version check) | core, on by default; `store()`/`load()` helpers for add-ons |
| `craft.js`'s `carry: [...]` | core `has: [...]` |
| nouns.js `keys` / `key:` | core `conds` + `if: "NAME"` / `is:` |
| nouns.js `rotate`, `ladder` effects | TEXT `{ rotate }` / `{ ladder }` |
| `been_X` flags | core `visited: "room"`, `seen: "thing"` |
| `{ repeat, if: { since }, mark }` timers | event `every: n` |

Also new in the core:
- **Hooks** (`input`, `before`, `afterTurn`, `start`, `end`, `text`, `tag`, `boot`, `validate`), so no add-on needs to replace an engine function.
- **A validator that knows the data's shape.** Verb names, aliases, message ids and journal keys are treated as names, not as conditions or effects. It now reports **unknown effect keys** (`sey:`), unknown named conditions and message ids, and conditions inside `any`/`all`/`conds`.
- **Prototype-safe lookups** (`own()`, null-prototype tables). Typing `constructor` or `[__proto__]` is harmless everywhere, not only where an add-on remembered.
- **Diagonal directions**, `hidden` exits and items, `go <room name>`, `do: "command"`, `eq:`.

## What stays an add-on (ported to the v2 contract)

`light`, `craft`, `journal`, `endings`, `tags`, `hints`. They do the same job with less code (no G walks, no wrapped `print`). Every line they print has a message id.

## Lines of code

| | v1 + all add-ons the two games needed | v2 |
|---|---|---|
| engine | 239 | 410 |
| add-ons replaced by the core | 354 (actions 122, verbs 92, history 37, quips 35, messages 26, save 19, help 14, restart 9), plus the overlapping parts of nouns | 0 |
| shared add-ons kept | light, craft, journal, endings, tags, hints: 214 | 196 |

## Breaking changes from v1 (for porting a game)

| v1 | v2 |
|---|---|
| `items.X.use: [...]` | `items.X.on: { use: [...] }` |
| `carry: [...]` (craft) | `has: [...]` |
| `quips: { "eat.tool": [...] }`, `$1` | `kinds: { tool: { eat: { say: { rotate: [...] } } } }`, `{it}` |
| `messages: { "You can't go that way.": ... }` | `messages: { cantGo: ... }` (ids listed in AUTHORING.md) |
| `G.on` / `rooms.X.on` with `Take`, `Say` | lowercase verb names |
| `add: { turns: -1 }` to make a reply free | `free: true` |
| nouns.js `keys`, `key: "A&!B"` | `conds`, `if: { is: "A", not: "B" }` |
| `{ mark: "t" }` + `{ repeat: true, if: { since: { t: 2 } }, mark: "t" }` | `{ every: 2 }` |
| `move` as an alias of `go` | removed (it was a gotcha: "move the chair"); `put` is now `drop` |
| saves: in memory (or save.js) | in localStorage by default |

## Porting big-footprint: the plan for pass two

This pass doesn't port big-footprint. Its 796-line test suite pins exact wording from four QA rounds, and porting it is a project of its own. The mapping:

1. **Mechanical changes**: lowercase `Take`/`Say`/`Give`; `messages` keyed by id; `add: { turns: -1 }` → `free: true`; `{ min, max }` pairs → `eq`; `not: { not: }` → lists or `all`.
2. **`verbs.js` and `messages.js` are no longer needed.** `bare`, `oneAtATime` and `ways` are about 15 lines between them and can go in a game-local `./input.js` using the `input` hook. `only:` can become a core condition if a second game wants it.
3. **`nouns.js` splits:**
   - into the core: `keys` → `conds`; `rotate`/`ladder`/`note` (`note` becomes counters or flags); `categories` → `kinds`; `firstLook` → a `desc` variant on `not: { seen }`; `anywhere`/`alone` → `G.on`.
   - into a game-local `./tour.js`: TOUR/ESCAPE strikes, tails, bands, feedback, the checkpoint (`caught`), the run report.
   - candidates for new shared add-ons, if a second game wants them: `topics` (ask/tell about), `lookCloser` (examine a word from the room's text), and scenery nouns that are in several rooms at once (`at: "any"`).
4. Port the tests to the new message ids and run them as the regression suite.

## Open questions for the next pass

- **Scenery in many rooms.** An item lives in one place. Big-footprint's `at: "any"` nouns (floor, walls, ceiling) suggest `at: ["foyer", "landing"]` or `at: "*"`. It's a small engine change, but it touches `S.loc`, `move` and saves, so it waits for a second game that needs it.
- **Ask/tell topics.** Common in IF and used by big-footprint. A shared `topics.js` add-on is the likely shape.
- **Containers and surfaces** ("put coin in box"). No game has needed them yet.
- **Randomness.** Rotations are deterministic on purpose (tests stay exact). A seeded `random:` TEXT would keep that.
