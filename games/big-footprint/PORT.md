# This Place Has a Big Footprint, rebuilt on Framework v2

The original game ran on the v1 engine with four add-ons (`restart`, `verbs`, `nouns`, `messages`), three of which replaced engine functions to work. This folder is the same game on v2, with no game-specific engine changes (the general fixes the port found are listed below).

## What moved where

| Original (v1) | v2 |
|---|---|
| `restart.js` (wrapped `act`) | core `restart` |
| `messages.js` (wrapped `print`; keyed by exact engine strings) | core `G.messages`, keyed by id (`cantGo`, `notHere`, `huh`...) |
| `verbs.js`: room and game replies, `said`, `any`, punctuation, phrasal verbs, `look under`, `pick up`, literal echo | core |
| `verbs.js`: `bare`, `oneAtATime`, `ways`, `drop X in Y`, `only`, `line` | `./verbs.js`, a game-local add-on (hooks: `input`, `afterTurn`); the reply-ladder order is the engine's since rev 10 |
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

`game.js` keeps the Script's own data formats (line tables, noun words, categories): they are this game's authoring format, and `./nouns.js` reads them. The port itself changed only what the table lists; rev 4 and rev 5 (at the end of this file) then changed the game on purpose.

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


## Rev 6: script polish

A continuity and flow pass over every player-facing line. No logic changed. 23 lines were reworded:
- **Facts that contradicted play.** The card's own `use` line said it wasn't for handing to anyone, but showing it to the Don answers his question. The run checkpoint line had Nando chasing a peacock even when the peacocks were still caged. The escape gallery line assumed you already had secrets. The CAUGHT ending said "Nando doesn't buy it" after openers where you never told him a story, and its ITEM opener zip-tied you twice.
- **Voice.** The narrator calls you "detective" everywhere else, so the Don's `lie` line no longer calls you "Walter." The narrator now uses feet (the giraffe is eighteen feet); the Don still says six meters.
- **Repeats.** "Snow shovels" was in three places, and several other phrases each appeared twice: "something heavy is walking around up there," "stolen chandelier," "the Don is watching your eyes," "a very long week," and "whatever mattered... the Don took." Each now appears once.
- **Rhythm.** Smoother wording for the Don's exits from the salon and the aviary, the help text's `brief` line, a hint-ladder line, the balcony, and the office revisit.

The full Script is now generated from `game.js`: `node games/big-footprint/design/make-script.js` writes [`design/SCRIPT_week01_rev6.txt`](design/SCRIPT_week01_rev6.txt). A test fails if the file and the game disagree, so the Script can't drift again. Scripts rev 1-3 stay in `design/` as history.

## Rev 7: actors

The engine's actors (`items.X.acts`, run after each turn's events) replace the three roaming events. Each animal carries its own rules, built by `roam(animal)` from the `LOOSE` table: every n turns, `move: { me: route }`, and Reina's `level: { me: null }` landing. The `min: { giraffe: 1 }` gates are gone: an offstage animal doesn't act, so releasing it is what starts it. Compared with the rev 6 build over 15,000 seeded commands, the output is identical except for the order of two arrivals on one turn (now data order). The feature test checks the rules and that nothing roams before it's released.

## Rev 8: engine audit

Every engine feature checked against the game (GDD section 15 has the full table). Three hand-made pieces now use the engine:
- **Props:** the `giraffe`, `jaguar` and `peacocks` counters became each animal's own prop (`giraffe.alibi`, `jaguar.alibi`, `reina.alibi`), declared in the animals' `props` and mapped by `ALIBI`.
- **`eq:`** replaces nine `min`+`max` pairs that meant "exactly".
- **`visited:`** replaces the twelve `been_<room>` flags and their events; `throughDoor` reads `S.been`.

Compared with the rev 7 build over 15,000 seeded commands, the output is identical, and the generated Script's text is unchanged (only its condition labels: `visited foyer`, `OUT_PEACOCKS`, `secrets=1`). `make-script.js` now prints `eq` as `a=n`.

## Rev 9: nouns.js answers in the engine's order

`./nouns.js` used to answer every scenery command in `before`, ahead of the engine, and stepped aside for the engine's things with tie and defer rules. Now:
- `before` keeps only what must stop a command first: the checkpoint (CAUGHT), tour strikes (for its own verbs; use-on strikes stay in the rooms' data), and naming: when the core is about to ask "Which do you mean?" about its things but the Script's words name something better ("mirrored gold" is the elevator's, not the coin or the rifle).
- Every answer moved to `unhandled`: it runs after "Which do you mean?", carrying, the things' and kinds' replies, the room's and the game's.
- Compared with the rev 8 build over about 75,000 seeded commands (the game's whole vocabulary), output and state are identical except one kind of line: a command whose first slot names something that isn't here ("sit photos to nando" with no photos) now gets the core's free "Nothing like that around here." instead of "Nothing happens." and a turn.

## Rev 10: verbs.js answers in the engine's order too

`./verbs.js` used to answer the room's and the game's replies (`rooms.X.on`, `G.on`) in `before`, ahead of the things': the Script's reply ladder. It has no `before` now. Every reply runs in the engine's order (things, kinds, the room, the game), and the data moved to fit it:
- **The items' generic lines move to the game's replies.** The card's, the coin's and the three secrets' "use" lines ("Nothing here wants it", "Not here. Not now.") were on the items, so "use coin on hippo" would have found the coin's line before the atrium's P2 solve. They're now the last entries of `G.on.use`, with `what:`/`with:`, so the Don, the room and the checkpoint answer first, as before.
- **The pozole line** (BG-05) is also the first of the Don's own `use` replies, since the Don, as a thing, now answers before the game.
- **"drop X in Y", `ways`** are word rewrites in the `input` hook ("drop coin in fountain" becomes "use coin fountain", "go upstairs" becomes "go up"), so the engine runs the command its own way.
- **`./nouns.js`'s checkpoint and strike blocks** step aside when the room or the game has a reply that would answer now (Nando's lines, "run", "say giraffe"): its doc always said CAUGHT is for commands nothing earlier answered.
- **Two lines the engine prints before any reply** are now its conditional messages, using a new `verb:` condition in `./verbs.js`:
  - `messages.which`: "look at the staircase" is both staircases at once (BR-05).
  - `messages.notHere`: using the coin on Pepita after she's opened answers "Pepita's already open" (BG-06), since the coin is gone.

Compared with the rev 9 build over about 15,000 seeded commands (the game's whole vocabulary), output and state are identical except one kind of line. A verb aimed at "the staircase" (bribe, feed) now gets the core's free "Which do you mean: the left staircase or the right staircase?" first, and the answer then gets the same reply as before. All 114 earlier QA and feature tests pass unchanged; a rev 10 feature test is added. The generated Script lists the two new messages.


### Rev 10 wording review

A reviewer read the whole generated Script against the GDD's tone. The review was text only: no logic, conditions or match words changed, and no "(QA text)" line or test string was touched. It made 12 fixes in 13 places:
- **Lines that contradicted the game.** At the foyer checkpoint, Nando asked "Why are you up here?", but the foyer is downstairs. The Don's bribe line said he laughed "for the first time" and mentioned "my own coin" before he gives you one. Picking the coin back up spoke of the Don's warm hand. During dinner, the Don moved a pot "lid" that the pots' own line says is off. "That animal" was used for the peacocks.
- **Voice.** The Don's "Questions later, Walter. Keep up." now prints in quotes, like his other speech. The last checkpoint hint starts with "Type", like the others.
- **Repeats.** Three lines repeated a phrase from the line printed just before them: the elevator button, the piano's tray and the letter opener.
- **Clarity.** "open card" now says that you read it.

`make-script.js` fixes found in the same review:
- The INTRO header no longer prints as "ntro:".
- Names that follow state print as `AVIARY, [OUT_PEACOCKS] EMPTY AVIARY`.
- `take` replies are now in the Script; they had been skipped as logic.
