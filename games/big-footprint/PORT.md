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
| `nouns.js`: scenery nouns, categories, tour strikes, checkpoints, tails, bands, feedback, topics, close looks, the run report | `./nouns.js`, a game-local add-on (hooks: `before`, `text`, `afterTurn`; effect `finish` in place of a patched `end`) |
| `add: { turns: -1 }` (17 places) | `free: true` |
| `Take:`, `Say:`, `Give:` (capitalized to dodge the v1 validator) | lowercase |
| G.keys | G.conds |
| — | a status line: the Bigfoot clock and secrets in the escape, strikes on the tour |

`game.js` keeps the Script's own data formats (line tables, noun words, categories): they are this game's authoring format, and `./nouns.js` reads them. The data changes are only the ones in the table.

## How "the same game" is checked

1. **The original test suite** (`tests/big-footprint.js`): all 43 tests from QA rounds 1-4. Nine of them were already failing in the original repository, because the Script changed after they were written. The original build fails them with the same output as this one, so they were updated to the shipped Script and marked "stale in the original suite".
2. **A differential test** against the original build (`release/v1/big-footprint.html`): six scripted playthroughs and 2,720 seeded random commands built from the game's own words. After every command the output and the state (room, counters, flags, game over) must match. A one-off run of the same check covered about 120,000 commands with no unexplained difference.

## Where v2 plays differently, on purpose

These come from the v2 core, apply to every game, and are excluded by name in the differential test:

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
