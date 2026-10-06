# Text RPG Framework v2 — Base

**This is the frozen starting point for a new text adventure every week.**

It's a small, dependency-free engine for parser-based text games ("take lamp", "ask the guard about the key"). Each game builds into **one HTML file** that anyone can download, open in a browser, and play offline. No install, no server, no accounts.

This repository is **not** where games get made. It's the clean foundation that gets copied at the start of each weekly project.

---

## How the weekly release works

```
 Framework-V2 (this repo, frozen)        Add-on Reference repo
            │                                     │
            └──────── copied into ────────────────┘
                          │
                          ▼
              Weekly game repo (week N)
        engine, add-ons and game all live here;
        anything can be changed for this game
                          │
                          ▼
            dist/<game>.html, a standalone
            single-file release, snapshotted as-is
```

1. **Copy this base** into a new repo for the week's game.
2. **Copy in any add-ons** the idea needs from the Add-on Reference repo.
3. **Build the game.** In the weekly repo, the engine and add-ons can be changed freely to fit the idea. Those changes stay in that week's repo.
4. **Ship the single HTML file** and snapshot the repo. That week is done and never needs to stay compatible with anything else.
5. **Harvest what worked.** If a new add-on proved useful, copy it back to the Add-on Reference repo, noting the week it came from, for later weeks to reuse and modify.

This repo stays untouched, so every week starts from the same known-good base.

---

## Why it's built this way

- **Fast releases, not one big game.** Every game is a self-contained product. No shared code has to keep working across weeks, so nothing slows a release down.
- **Games are data.** A game is mostly one `game.js` object: rooms, items, people, dialogue, events, endings. Most ideas need no new code at all.
- **New mechanics plug in.** Add-ons attach through hooks (`addon({...})`) instead of rewriting the engine. That keeps them easy to copy between weeks.
- **One file, runs anywhere.** The output has no dependencies and makes no network requests. It can be emailed, hosted, or played from a USB stick.

---

## What's in the box

| Folder | What it is |
| --- | --- |
| `engine/` | The engine (`engine.js`), page shell, and stylesheet |
| `addons/` | Starter add-ons: `light`, `craft`, `journal`, `endings`, `tags`, `hints` |
| `template/` | A blank starter game to copy |
| `games/` | Three example games (see below) |
| `tools/` | `build.js` (bundles a game into one HTML file) and `headless.js` (runs games in Node for testing) |
| `tests/` | Headless test suite, run with `node tests/run.js` |
| `docs/` | The full authoring reference, add-on guide, design recipes, and v2 change notes |
| `dist/` | The built, playable example games |

### Example games

- **`damp-cell`**: a short tutorial game.
- **`sundown`**: a countdown game against the clock.
- **`big-footprint`** (*This Place Has a Big Footprint*): the full showcase. It has a guided tour, guard checkpoints, strikes, a clock and five endings, and every parser feature appears somewhere in it. Its `design/` and `release/` folders show a complete weekly process from design doc through QA to release.

To try them, download any file in `dist/`, open it in a browser, and type `help`.

---

## What the engine handles out of the box

- **Parser:** verb plus things, two-object commands ("give the bread to the guard"), "Which do you mean?", pronouns, `all` / `all except`, "the other one", `oops`, and `again`
- **World:** rooms, containers and surfaces, things up high or underfoot (`look up` / `look down`), and names that change
- **People:** branching dialogue, plus ask/tell topics
- **Logic:** flags, counters, props (named numbers and words on any thing or the player: health, gold, mood), named conditions, timed and repeating events, random and rotating text
- **Player tools:** undo, restart, brief mode, and transcripts
- **Validator:** catches broken references and data mistakes at build time

**Out of scope by design:** there's no combat, economy, skill checks, or NPC schedules. Counters, `rand`, `status` and hooks are the building blocks for those, and they get built as add-ons when a week's idea needs them.

---

## About saves

Games are designed to be **played in one sitting**. The game saves automatically after each move, but only as a safety net against a browser or system crash. A player *can* close the tab and come back with **Continue**, but nothing is designed around that.

Saves live in the browser's local storage. If a game's rooms, items, NPCs or events change, old saves are ignored rather than loaded into the wrong state.

---

## Quick start (inside a weekly repo)

Requires **Node 18+** and nothing else. There's no `npm install`.

```sh
cp -r template games/my-game          # start a new game
# edit games/my-game/game.js          # the game itself (see docs/AUTHORING.md)
# edit games/my-game/build.json       # add-ons, e.g. { "addons": ["light", "endings"] }

node tools/build.js my-game           # → dist/my-game.html plus a validator report
node tests/run.js                     # headless tests
```

A build is ready when the validator says `Validator: no problems`. The file in `dist/` is the entire game.

---

## Docs

- [`docs/AUTHORING.md`](docs/AUTHORING.md): every key a game can use, and exactly what the parser understands
- [`docs/PATTERNS.md`](docs/PATTERNS.md): recipes from real games (countdowns, ranked endings, hidden things, hint ladders and more)
- [`docs/ADDONS.md`](docs/ADDONS.md): the add-on contract, the available hooks, and a worked example
- [`docs/REVIEW.md`](docs/REVIEW.md): what changed from v1, and why
- [`CLAUDE.md`](CLAUDE.md): working rules for AI-assisted development

---

## License

MIT © 2026 Retroment Gaming. See [LICENSE](LICENSE).
