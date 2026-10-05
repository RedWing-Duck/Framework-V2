# Text RPG Framework v2

A tiny, dependency-free framework for text adventures, and a blueprint for new text-based games, so nobody starts from scratch.

- **Data-driven.** A game is a single data object, and the engine never changes per game.
- **Add-ons.** New mechanics plug in with `addon({...})`, never by editing the engine.
- **Small.** No dependencies. Building and testing need only Node 18+.
- **One file.** Each finished game is a single HTML file that runs anywhere, including offline.

v2 folds what the first games kept rebuilding into the engine: verbs and replies on anything, a command reader (verb + things, with "Which do you mean?", pronouns, `all`), containers and surfaces, ask/tell topics, kinds, rotating and random text, named conditions, rewordable messages, undo/again/restart and saves that survive a reload. It also adds hooks, so add-ons never patch the engine. Later passes finished the word layer: two slots ("give the bread to the guard"), answered in slot order, so the guard replies whichever way it's said; pointing by a word ("the chipped cup", "the other one", "both", "all except"); pronouns by kind; articles and proper names; names that change; moves you can see; "(first taking...)"; `oops`, `brief` and `transcript`. The sixth pass added up and down: `look up` / `look down`, with things that sit up or down in a room and can move between the two. See [`docs/REVIEW.md`](docs/REVIEW.md) for what changed and why, and how to port a v1 game.

## What it is, and what it isn't

**It is** a blueprint for short-to-medium authored parser games in one HTML file: exploration, puzzles, people to talk to, a clock, a story that remembers what you did. `games/` has three: a tutorial (damp-cell), a countdown (sundown), and *This Place Has a Big Footprint*, the largest game built on v1 (a guided tour, guard checkpoints, strikes, a clock and five endings), rebuilt on v2 without game-specific engine changes ([`games/big-footprint/PORT.md`](games/big-footprint/PORT.md)). It is also the showcase: every word-layer feature appears somewhere a player meets it naturally, mapped in its [GDD, sections 12 and 13](games/big-footprint/design/GDD_week01_rev4.md).

**It isn't**, out of the box:
- a natural-language parser. It reads a verb and the things you name; [`docs/AUTHORING.md`](docs/AUTHORING.md#how-a-command-is-read) lists exactly what it does and doesn't understand.
- a systems engine. There is no combat, economy, NPC schedule, skill check, or spatial model beyond rooms, in/on and up/down. Counters, `rand`, `status` and hooks are the parts you build those from, as an add-on, and none of them is written yet.

## Review package

The source is the review artifact, not only the compiled games: `engine/`, `addons/`, `games/`, `tools/build.js` and `tests/run.js` are all here. `node tests/run.js` runs every test headless against the built files, including a check that each `dist/` file matches what `tools/build.js` produces from source.

## Play

Download [`dist/damp-cell.html`](dist/damp-cell.html), [`dist/sundown.html`](dist/sundown.html) or [`dist/big-footprint.html`](dist/big-footprint.html) and open it in a browser. Type `help` for the list of commands.

## Build and test

```sh
node tools/build.js damp-cell   # → dist/damp-cell.html, plus the validator report
node tools/build.js sundown
node tools/build.js big-footprint
node tests/run.js               # headless tests against the built files
```

## Make a new game

1. `cp -r template games/my-game`
2. Edit `games/my-game/game.js`. [`docs/AUTHORING.md`](docs/AUTHORING.md) documents every key.
3. List any add-ons in `games/my-game/build.json`, for example `{ "addons": ["light"] }`.
4. Run `node tools/build.js my-game` and fix anything the validator reports. The file is written even when there are problems
   (the command then exits with an error), so don't commit it until it says `Validator: no problems`. Run `node tests/run.js`
   too: it checks that every game's `dist/` file matches its sources.
5. Commit `dist/my-game.html`. That file is the whole game.

Recipes for common designs (countdowns, ranked endings, hidden things, hint ladders...) are in [`docs/PATTERNS.md`](docs/PATTERNS.md).
To add a new mechanic, first check it isn't data already, then write an add-on: see [`docs/ADDONS.md`](docs/ADDONS.md).

## Layout

```
engine/      shell.html, style.css, engine.js   (shared; never edited per game)
addons/      shared optional mechanics: light, craft, journal, endings, tags, hints
games/       one folder per game: game.js + build.json (+ the game's own add-ons, "./name" in build.json);
             big-footprint/ also keeps its design docs (design/) and release pack (release/)
template/    blank starter game
tools/       build.js (bundler), headless.js (DOM stub for Node)
tests/       run.js (node:test; loads big-footprint.js), words/ and local-addon/ (small test games)
docs/        AUTHORING.md, ADDONS.md, PATTERNS.md, REVIEW.md
dist/        built, playable single-file games
```

The page uses the system's monospace font and makes no network requests.

## License

MIT © 2026 Retroment Gaming. See [LICENSE](LICENSE).
