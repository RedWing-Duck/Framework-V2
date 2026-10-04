# Add-ons

The engine never changes for a game. New mechanics go in add-ons: one file each in `addons/`, registered with `addon({...})`.
A game switches an add-on on by listing it in its `build.json`:

```json
{ "addons": ["light"] }
```

The build puts each listed add-on in its own `<script>` block after the engine, in the order listed. Add-ons register themselves while that script runs. The engine then boots on `DOMContentLoaded`, after every script has loaded.

## Contract

This is the add-on contract from the original single-file framework, word for word:

```
addon({
  name:       "id",                        required, unique
  state:      { ... },                     saved in S[name]; included in Continue
  commands:   { verb(arg) { ... } },       new typed commands (cost a turn)
  free:       ["verb"],                    commands that DON'T cost a turn
  aliases:    { shortcut: "verb" },
  conditions: { key: value => true/false },  usable in any "if"
  effects:    { key: value => { ... } },   usable in events, dialogue replies, item use
  before(verb, arg) { ... },   runs before every command; return true to stop it
  afterTurn() { ... },         runs after each turn's events
  validate(need) { need(ok, "path", "problem") }   checks this add-on's data
})
Engine helpers add-ons may use: S, G, print, txt, test, run, exec, find, at, inv, names.
Reusing a name that's already taken is reported as a problem on the start menu.
```

Details:
- **`state`**: deep-copied into `S[name]` at the start of each new game. Keep it plain JSON, because it's saved with Continue.
- **`commands`**: each one gets the rest of the typed line, with filler words removed. The command's name appears in `help`.
- **`conditions`** and **`effects`**: merged into the engine's `COND` and `EFFECT` tables. The validator then accepts the new keys in `if`. New effects run before `say`, `goto` and `end`.
- **`before(verb, arg)`**: runs before every command, including commands run from inside the engine, such as the `look` on entering a room. Return `true` to say "handled" and skip the command.
- **`afterTurn()`**: runs after each turn's events, unless the game has ended.
- **`validate(need)`**: checks the game data this add-on reads. `need(ok, path, message)` reports a problem when `ok` is false.
- Game data can carry extra keys for an add-on, such as `rooms.X.dark`. The engine ignores keys it doesn't know.

## Walkthrough: `addons/light.js`

**Goal:** some rooms are dark. In a dark room the player can't see unless they carry, or stand near, something that gives light.

1. **Data it reads.** The add-on reads `rooms.X.dark` and `items.X.light`. Each is either `true` or a COND. The engine ignores these keys, so games without the add-on aren't affected. In `damp-cell`, the cellar has `dark: true` and the lantern has `light: true`.

2. **Private helpers.** The whole file is wrapped in a `{ ... }` block, so `holds` and `inDark` don't leak into the global scope:
   ```js
   const holds = v => v === true || (!!v && typeof v === "object" && test(v));
   const inDark = () => holds(G.rooms[S.room].dark) && ![...inv(), ...at(G.items)].some(id => holds(G.items[id].light));
   ```
   These use only the documented helpers: `test`, `inv`, `at`, `G` and `S`.

3. **State.** `state: { room: null, dark: false }` records what the player last saw. It's saved in `S.light`, so Continue keeps it.

4. **Condition.** `conditions: { dark: v => inDark() === v }` lets any game write `if: { dark: true }`.

5. **Blocking commands.** `before(v, a)` stops `look`, `take`, and `examine` of anything not carried, and prints "It's pitch dark…" instead. Entering a room runs `look` through `exec`, so walking into a dark room is covered as well.

6. **Reacting to changes.** `afterTurn()` handles light changing while the player stays in the same room. For example, dropping the lantern prints "Everything goes dark.", and lighting it shows the room.

7. **Checking data.** `validate(need)` reports a dark room when no item gives light, because the player could never see in it.

## Writing a new add-on

1. Create `addons/<name>.js`. Start with a header comment that says which data keys the add-on reads and what it adds.
2. Wrap private helpers in a `{ }` block and call `addon({ name: "<name>", ... })`.
3. Add `"<name>"` to the `addons` list in a game's `build.json`, then build and check the validator output.
4. Add a test to `tests/run.js` that plays through the mechanic in a built game.

Keep it small. Use the engine's helpers and tables instead of copying their logic.
