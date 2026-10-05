# This Place Has a Big Footprint, rebuilt on Framework v2

The original game ran on the v1 engine with four add-ons (`restart`, `verbs`, `nouns`, `messages`), three of which replaced engine functions to work. This folder is the same game on v2, with the engine untouched.

## What moved where

| Original (v1) | v2 |
|---|---|
| `restart.js` (wrapped `act`) | core `restart` |
| `messages.js` (wrapped `print`; keyed by exact engine strings) | core `G.messages`, keyed by id (`cantGo`, `notHere`, `huh`...) |
| `verbs.js`: room and game replies, `said`, `any`, punctuation, phrasal verbs, `look under`, `pick up`, literal echo | core |
| `verbs.js`: `bare`, `oneAtATime`, `ways`, `drop X in Y`, `only`, `line`, the reply-ladder order | `./verbs.js`, a game-local add-on (hooks: `input`, `before`, `afterTurn`) |
| `nouns.js`: named states (`keys`) | core `conds` |
| `nouns.js`: `rotate`, `ladder` effects | core TEXT `{ rotate }`, `{ ladder }` |
| `nouns.js`: scenery nouns, categories, tour strikes, checkpoints, tails, bands, feedback, close looks, the run report | `./nouns.js`, a game-local add-on (hooks: `before`, `text`, `afterTurn`; effect `finish` in place of a patched `end`) |
| `nouns.js`: topics ("ask the Don about ...") | core `npcs.X.topics` (rev 4) |
| `add: { turns: -1 }` (17 places) | `free: true` |
| `Take:`, `Say:`, `Give:` (capitalized to dodge the v1 validator) | lowercase |
| G.keys | G.conds |
| — | a status line: the Bigfoot clock and secrets in the escape, strikes on the tour |

The game's design documents (GDD, Scripts rev 1-3, the polish build brief and QA focus) are in [`design/`](design/); the
release pack (walkthrough, bug list, changelog, QA reports, and the original v1 build) is in [`release/`](release/).

`game.js` keeps the Script's own data formats (line tables, noun words, categories): they are this game's authoring format, and `./nouns.js` reads them. The data changes are only the ones in the table.

## How "the same game" is checked

1. **The original test suite** (`tests/big-footprint.js`): all 43 tests from QA rounds 1-4. Nine of them were already failing in the original repository, because the Script changed after they were written. The original build fails them with the same output as this one, so they were updated to the shipped Script and marked "stale in the original suite".
2. **Scripted playthroughs** of the tour, both wins and each loss, with the clocks the GDD promises (W1 7 turns to spare, W2 4), and **a seeded random-command run** built from the game's own words: no exceptions, no validator problems, turns never below zero, and from wherever a run stops, an ending is always reachable.
3. **One test per v2 feature** the game shows off (rev 4, below).

Until rev 4 a differential test compared every command's output and state against the original build (`release/v1/big-footprint.html`, kept as history): 2,720 seeded random commands in the suite, about 120,000 in a one-off run, with no unexplained difference. Rev 4 changes the game on purpose, so the playthroughs replaced it.

## Where v2 plays differently, on purpose

These come from the v2 core and apply to every game (the differential test excluded them by name):

| | v1 | v2 |
|---|---|---|
| A | A command that names nothing here ("talk to the chandelier") cost a turn. | It costs nothing (same text). |
| B | `use`, `feed`, `throw` or `put` on something you don't carry: "You're not carrying that.", a turn. | "Nothing like that around here.", free; and on something here but not carried, the game's own reply or "Nothing happens." (`use` doesn't require carrying in v2). |
| C | "break it": "Nothing like that around here." | Pronouns mean the last thing acted on. |
| E | A name had to be the whole phrase: "examine card to don" found nothing. | Every word is scanned: it examines the card. |
| F | `add: { turns: -1 }` on a free command still subtracted, so the turn count could go below zero. | `free: true` only refunds a turn that was charged. |

Two differences the comparison found were core bugs and were fixed in the engine instead: "talk to \<an item\>" now answers "Nobody by that name around." again, and a command that ignores its object (like `inventory gate`) never asks "Which do you mean?".

Walking into a wall cost a turn in v1. The v2 core makes it free, but this game charges for it again in `./nouns.js`: it's a clock game, and the turn feedback ("That cost you a moment.") depends on it.

## Engine changes this port caused

The port was the framework's first large test, and it found general problems. Each was fixed in the engine, for every game, with no game-specific code:
- `game.js` now runs in its own scope (the build wraps it), so a game's helper names can't collide with the engine's. This game's `const topic` was the first collision.
- `said:` for a bare direction ("d") is the direction ("down"), so a room's `on.go` with `said: "down"` works.
- `before` hooks run before "Which do you mean?", so an add-on with its own idea of names (or darkness) answers first.
- After "Which do you mean?", `said:` names the chosen thing.
- With a pronoun, `said:` keeps the typed words and adds the thing's name, so "play her song" still matches.
- `look under X` reaches an add-on's `search` command.
- A holder can't share its id with a room, and holder chains only follow holders (the item `aviary` sits in the room `aviary`).
- The headless test runner keeps the whole transcript; the screen keeps the last 500 paragraphs.

## Rev 4: the v2 showcase

The game now uses every word-layer and core feature where a player meets it naturally ([`design/GDD_week01_rev4.md`](design/GDD_week01_rev4.md), section 12), at the same size and with the same critical paths. The engine and the shared add-ons are untouched.

Removed, because the core does the job now:
- `G.topics` and the topic code in `./nouns.js` (word lists, longest match, plurals, the cold rotation, the "other" line): `npcs.don.topics` and `npcs.nando.topics`, with `"*"`. `./nouns.js` only routes a spoken topic ("say the piano") to `ask`, and lets ask/tell through a checkpoint.
- The checkpoint's `ask` reply in `G.on` (Nando's `"*"` topic answers instead).
- The terrace's "open gate" nudge (`T.nudge.gate`): two gates are two things, so the core asks "Which do you mean?".
- `messages: { arrives: "", leaves: "" }`: every move of the Don and Nando has its own line, so the core's lines are free for the loose animals.
- The generic use lines for the card, coin and secrets in `G.on.use`, and the Don's give/show lines read from typed words: they are `on.use` replies on the things and the Don, read by slot (`what:`, `with:`).
- Four nouns became things: `R2.leftstairs` and `R2.rightstairs` (the two staircases, so "Which do you mean?" and "the other one" work), `R4.tray` and `R8.mouth` (holders). The pair item `staircase` is now `staircases` (the id is a name, and "staircase" has to mean either one).

Changed in `./nouns.js` so core things can answer:
- names come from `nm()`, so a name can follow the state;
- when two of the core's things fit the words equally, the core asks which;
- a thing (or its kind) with its own reply for the verb gets the core's turn;
- a tail line is printed only if its key still passes at the end of the turn (a loose animal may have left).

Kept: strikes, checkpoints, the run report, bands, feedback, close looks, categories and `./verbs.js` (bare words, one at a time, `ways`, "drop X in Y", `only`, `line`, and the reply order).

## Rev 5: up and down, slot order

Both are engine changes for every game. The game gives every room an `up` and `down` view, gives the loose animals a `level`, and lets Reina fly (`level: { reina: "up" }` on release, `null` when she moves). The card's and coin's `not: { with: "don" }` guards are gone: the engine asks the second slot first now.

