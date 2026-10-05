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

## Porting big-footprint

Done in the third pass: see `games/big-footprint/PORT.md`. The game kept its Script data formats. The core replaced `restart`, `messages` and most of `verbs`, and the game's own mechanics went into two game-local add-ons that use only hooks. The original 43 tests pass, and a differential test checks every command's output and state against the original build.

## Open questions for the next pass

- **Scenery in many rooms.** An item lives in one place. Big-footprint's `at: "any"` nouns (floor, walls, ceiling) suggest `at: ["foyer", "landing"]` or `at: "*"`. It touches `S.loc`, `move` and saves, so it waits for a second game that needs it.
- Ask/tell topics and containers were open questions here; the third pass added both to the core.

## Second pass: a cold read of v2

A review of v2 on its own terms: is the logic sound, is the syntax right, is the code explained, and can it stretch to any genre?

**Bugs fixed**
- Continue and `undo` showed the room without asking the add-ons, so the light add-on was bypassed: continuing in a dark cellar showed what was on its shelf. Both now go through `exec("look")`, like entering a room.
- `go back` on the first turn pointed at the starting room itself. `S.prev` now starts empty.
- A save missing a state key that a newer engine added (rotation places, the random seed) could crash. Continue now lays the save over a fresh state.
- The validator now checks named conditions written as strings anywhere (`not: "X"`, `any: ["X"]`), not only in `if`; reports an `aliases` or `phrasal` entry that leads to no command; and compares ids without tripping on `constructor`.

**Clarity**
- `engine.js` opens with how a typed line flows through `parse → act → exec → events` and a list of its sections; every section has a header.
- The one-line `{name}` expansion in TEXT is now a small `fill()` function, and name matching (`named()`) builds each thing's phrases once per call, with comments on the matching rules.
- Every piece of engine state (`S`, `SAVE`, `UNDO`, `LAST`, `VERBS`, `VER`, `LINE`, `TURN`) and every validator table is explained where it's declared.

**Gaps found for other kinds of game**
The cold read found three small gaps that games outside the classic adventure hit early, and added them:
- **Randomness**: a seeded `rand(n)` for add-ons, TEXT `{ random: [...] }` and condition `chance: n`. The seed lives in `S`, so saves, undo and `again` can't re-roll a result, and `G.seed` makes tests exact.
- **A status line**: `G.status`, a TEXT refreshed after every command (score, health, a clock).
- **Room-entry scripts**: an `enter(room)` hook for add-ons.

These are building blocks, not genres. The third pass (below) corrects how this section first described them.

## Third pass: answering an outside review

An outside reviewer read the package (docs and the two compiled games). Their verdict: the hook-and-table design is right and the samples prove it can carry a real scene, but the package overclaimed. "A real parser" was a verb-plus-remainder tokenizer, "any genre" mapped vocabulary onto systems that don't exist, and the review zip had no source or tests. They asked for a containment model and disambiguation before anything else. Each point, and what changed:

| Review point | Change |
|---|---|
| "A real parser" is not accurate | The docs now call it a command reader, say how it reads a line, and list what it doesn't understand (AUTHORING.md, "How a command is read"). |
| No `put X in Y` / `on Y`; "put plywood on window" drops the plywood | **Containers and surfaces in the core**: `holds: "in"/"on"`, `closed`, built-in `put`, `open`, `close`, contents shown in look, examine and inventory, `has`/`here` see through holders, new `inside`/`open` conditions and `open`/`close` effects. `put X on Y` on a non-holder means `use X on Y`, so sundown's plywood now goes on the window. |
| No disambiguation | **"Which do you mean: the can of coffee grounds or the mug of coffee?"**, free, answered by a word that picks one; `take` and `drop` rule out the obvious wrong one first. Sundown has the coffee clash on purpose. |
| No pronouns | `it`, `them`, `him`, `her` mean the last thing acted on. |
| No `all`, no multiple objects | `take all`, `drop all`, `take X and Y`: one turn for the lot. `all` skips fixed and hidden things and closed boxes. |
| Conversation is only a numbered menu | **Topics in the core**: `ask/tell X about Y`, `npcs.X.topics: { "gate\|door": REPLY, "*": REPLY }`. A dialogue option can also be picked by its words ("let me out"). |
| "Stretches to any genre" | Withdrawn. README.md now says what the framework is for and what it isn't; the genre list is gone. Combat, economies, schedules and spatial models are named as things you'd build as add-ons, none of which exist yet. |
| Item names look like links | No underline; items are colored and bold. The tags add-on marks its classes with a border instead of underline styles. |
| `chance` rolls every time it's tested | One roll per condition per command: testing the same `if` twice in a turn gives one answer. |
| `go back` is one room, unstated | The help line says it: "or back (one step: the room you just left)". |
| Save identity ignores text and flags | Documented as a choice (fix wording without wiping saves), and `G.version` ends old runs when a content patch should. |
| Offline page requests a web font | The font link is gone; the page makes no network requests. |
| The zip has no source or tests | The review package now ships the whole repository: source, tools, tests and built games. |

Then *This Place Has a Big Footprint*, the largest game made with v1, was rebuilt on the framework: see `games/big-footprint/PORT.md`. The port found eight general engine problems, all fixed for every game (listed there). The biggest: `game.js` and the engine shared one scope, so a game's helper could collide with an engine function. The build now gives each `game.js` its own scope.

## Fourth pass: the word layer

A second outside review asked what the command reader still couldn't say. Its answer: no genre is missing, but one sentence
shape and one way of pointing are. A follow-up read of `engine.js` found a bug behind the second, and six smaller gaps at the
same layer. All are in the core now, with tests (`tests/words/` is a small game that uses each one).

| Gap | Change |
|---|---|
| **The second slot.** "give the bread to the guard" threw the role word away; `said:` couldn't tell "to the guard" from "the guard" | The first role word (`to with on at about in from...`) splits the line. `LINE.what` / `LINE.with`, conditions `what:` / `with:`, TEXT `{what}` / `{with}`. With no role word the first and last things fill the slots ("use key door"), and a person named first is the second slot ("give the guard the bread"). `put` and the craft add-on read the slots. |
| **Pointing: a bug.** With "red" an alias of one mug, "red mug" matched "red" to that mug, then "mug" to both, and asked "Which do you mean?" anyway | `named()` reads words next to each other as one noun and narrows: each word keeps only the candidates that still fit. A word that fits none starts a new noun, as do "and" and role words. |
| Pointing: "the other one", "both", "all except" | "other" is a pronoun for the last question (or the last narrowed name); "both" answers a question or means both of an ambiguous name; `take`/`drop all except X` (or `but X`). A word elsewhere in the line that fits one choice settles the question before it's asked. |
| Pronouns pointed at one thing | `it` is the last item, `him`/`her` the last person (or `npcs.X.pronoun`), `them` the last thing. "x key, x guard, give it to him" works. |
| "the Big Tony" | `proper: true` and `article`, and `{the}`/`{The}`/`{a}`/`{A}` (also `{the:with}`). Every engine message that said "the {it}" uses them now. |
| A name couldn't change | `name` is TEXT: `[{ if: { flag: "lit" }, text: "lit lamp" }, "unlit lamp"]`. Matching uses the current name. |
| Silent moves | An event that moves something into or out of view and says nothing prints `arrives` / `leaves` (`{dir}` available). damp-cell's rat went from two events to one. |
| "You don't have that." for a key on the floor | `put`, and any verb with `verbs.X.carry: true`, takes the direct thing first: "(first taking the key)". |
| Typos | `oops <word>` replays the last line with its unknown word replaced. |
| Playtest logs lost past 500 lines | `transcript` saves the whole session as a text file. The screen still trims; the log doesn't. |
| Revisits reprint everything | `brief` / `verbose`, a player setting kept in the browser and untouched by undo. |

**Breaking changes for a game written for the third pass**
- `it` no longer means a person. If a game relied on "talk to the guard", "x it", give the person `pronoun: "it"` (as damp-cell's rat has).
- An event that moves a visible thing silently now prints a line. Set `messages: { arrives: "", leaves: "" }` to keep the old behavior; big-footprint did, so the differential test against v1 still passed, because its Don and Nando have their own lines. (Its rev 4 gives every one of their moves a line instead, and uses the core's lines for its roaming animals; scripted playthroughs replaced the differential test.)
- `put X in Y` with X on the floor now takes it first instead of failing.
- Default messages use `{the}` instead of "the {it}". A game that reworded them is unaffected; the output only changes for a `proper` thing.

**Still not in the reader, on purpose:** several commands on one line, a third slot, orders to people ("guard, open the gate"), adjectives that aren't in a name. Each is an `input` hook or a `said:` reply in the game that needs it.

## Fifth pass: finishing the word layer

A read of the fourth pass found places where the word layer stepped around the rest of the engine. Each fix has a test in
`tests/run.js`, using the `tests/words/` game (now with a study, two game-local add-ons, and a name with "to" in it).

| Item | Change | Test |
|---|---|---|
| Implicit take skipped add-ons: in the dark, "put coin in box" picked the coin up though "take coin" was refused | `carry()` runs `exec("take")`: `before` hooks, replies on `take`, then the built-in, which prints `firstTake` instead of `taken`. If the thing isn't carried afterwards, the command stops | implicit take obeys add-ons and replies: in the dark, or refused, the command stops |
| Stale "the other one" / "both": `S.pick` outlived its room and later commands | Cleared on entering a room, and when a command names something outside the pair | 'the other one' is forgotten on leaving the room or naming something else |
| Role words inside names: "the letter to Ana" split into two slots | `roles()` skips a role word inside a multi-word name or alias in reach, and filler words inside such a name are kept | a role word inside a name doesn't split the line: 'the letter to Ana' |
| Untested: `{dir}`, `article: "an"`/`"some"`, `proper` in "Which do you mean?" | Tests only; the code already worked | messages: {dir} in arrives/leaves; article an/some through {a}/{A}; proper names in 'Which do you mean?' |
| Transcript download untested | `tools/headless.js` gets opt-in `downloads()` (Blob, URL, a link's click); the old no-download fallback test stays | transcript: saves '<title> transcript.txt' with every line printed, then says how many |
| Hook order undocumented | `docs/ADDONS.md`: hooks run in `build.json` order; the first `before` that returns true stops the command | hook order: before hooks run in build.json order, and the first that answers stops the command |
| Design files mixed into the release pack | GDD, Scripts (rev 1-3), build brief and QA focus moved to `games/big-footprint/design/`; links updated. `release/v1/big-footprint.html` stays (the differential test read it; since the game's rev 4 it is history) | (none: the whole suite, including the differential, still passes) |

## Sixth pass: slot order and up/down

Two engine changes, asked for after the big-footprint showcase, for every game. Tests in `tests/run.js` use the `tests/words/` game.

| Item | Change | Test |
|---|---|---|
| Replies went last-named first, so "give the guard the bread" asked the bread before the guard ("give the bread to the guard" didn't) | `bySlot()`: the second slot answers first, then the direct thing, then the rest (last named first). `LINE.it` follows the same order. big-footprint's `not: { with: "don" }` guards on the card and coin are gone | slot order: the second slot answers first, whichever way the line is said |
| No sense of up and down in a room | `rooms.X.up` / `down` (TEXT), `items.X.level` / `npcs.X.level` (`"up"`, `"down"`, or TEXT variants), effect and condition `level`, `S.level` (saved, undone). `look up` / `look down` (and `above`, `overhead`, `below`) show the room's view and the `desc` of each thing in sight at that level; message `levelNone`. A dropped thing with a level lands down. The validator checks level values. The trailing-particle rule keeps "up"/"down" after `look` | up and down: look up / look down show the room's view and the things at that level; level effect, condition, drop |

The three games use it: damp-cell (the cell's window and trapdoor, the straw and the rat on the floor), sundown (the rafters,
the pines at dusk, the rug and the crowbar it hides), big-footprint (every room, the giraffe up, the jaguar down, and Reina,
who flies up when released and lands when she first moves).
