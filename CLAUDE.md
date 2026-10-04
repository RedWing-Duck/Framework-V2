# CLAUDE.md

This repo is a reusable, data-driven text-adventure framework. Treat it as a blueprint: games are data, and the engine is shared.

## Rules
- **To make a game, copy `template/` into `games/<name>/`**, then edit `games/<name>/game.js` and `build.json`.
- **Never edit `engine/` for a single game.** If a game seems to need an engine change, it needs an add-on.
- **New mechanics become add-ons** in `addons/<name>.js`, registered with `addon({...})` and listed in the game's `build.json`. See `docs/ADDONS.md`.
- Write the smallest amount of code that does the job. Use no dependencies: Node 18+ built-ins only, and no npm packages.
- A finished game ships as one self-contained HTML file in `dist/`, which runs offline. Commit `dist/`.
- Keep the one-line comment at the top of every `game.js` that points to `docs/AUTHORING.md`.

## Before finishing, always
1. Build: `node tools/build.js <name>`
2. Check the validator output. It must say `Validator: no problems`. Fix every listed path.
3. Run the tests: `node tests/run.js`. All must pass, including the check that `dist/` is up to date.

## Map
- `engine/`: `shell.html` (markup with `/*{{CSS}}*/` and `<!--{{SCRIPTS}}-->` placeholders), `style.css`, `engine.js`
- `addons/`: optional mechanics
- `games/<name>/`: `game.js` (the `G` object) and `build.json` (`{ "addons": [...] }`)
- `template/`: blank starter game
- `tools/build.js`: bundles css, then game, engine and add-ons, in that order, into `dist/<name>.html`
- `tools/headless.js`: runs a built file in Node with a DOM stub. Used by the build and the tests.
- `docs/AUTHORING.md`: the full game-data reference. `docs/ADDONS.md`: the add-on contract.
