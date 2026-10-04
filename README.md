# Text RPG Framework

A tiny, dependency-free framework for text adventures, and a blueprint for new text-based games, so nobody starts from scratch.

- **Data-driven.** A game is a single data object, and the engine never changes per game.
- **Add-ons.** New mechanics plug in with `addon({...})`, never by editing the engine.
- **Small.** No dependencies. Building and testing need only Node 18+.
- **One file.** Each finished game is a single HTML file that runs anywhere, including offline.

## Play

Download [`dist/damp-cell.html`](dist/damp-cell.html) and open it in a browser. Type `help` for the list of commands.

## Build and test

```sh
node tools/build.js damp-cell   # → dist/damp-cell.html, plus the validator report
node tests/run.js               # headless tests against the built file
```

## Make a new game

1. `cp -r template games/my-game`
2. Edit `games/my-game/game.js`. [`docs/AUTHORING.md`](docs/AUTHORING.md) documents every key.
3. List any add-ons in `games/my-game/build.json`, for example `{ "addons": ["light"] }`.
4. Run `node tools/build.js my-game` and fix anything the validator reports.
5. Commit `dist/my-game.html`. That file is the whole game.

To add a new mechanic, write an add-on: see [`docs/ADDONS.md`](docs/ADDONS.md).

## Layout

```
engine/      shell.html, style.css, engine.js   (shared; never edited per game)
addons/      optional mechanics (light.js: light & darkness)
games/       one folder per game: game.js + build.json
template/    blank starter game
tools/       build.js (bundler), headless.js (DOM stub for Node)
tests/       run.js (node:test)
docs/        AUTHORING.md, ADDONS.md
dist/        built, playable single-file games
```

The page loads the IBM Plex Mono font from Google Fonts. Offline, it falls back to the system monospace font.

## License

MIT © 2026 Retroment Gaming. See [LICENSE](LICENSE).
