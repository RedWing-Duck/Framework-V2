# Authoring a game

A game is one data object, `G`, in `games/<name>/game.js`. The engine reads it and never changes per game.
Start from `template/game.js`. For a complete example, see `games/damp-cell/game.js`.

## Quick reference

This is the schema comment from the original single-file framework, word for word:

```
title, intro:TEXT, start (room id)
rooms:  { id: { name, desc:TEXT, exits:{ dir: "roomId" | { to, if:COND, fail:TEXT } } } }
items:  { id: { name, desc:TEXT, at, aliases:[], fixed:true (can't take),
          use:[ { if:COND, ...EFFECT } ] } }
npcs:   { id: { name, desc:TEXT, at, aliases:[],
          dialogue:{ nodeId:{ text:TEXT, options:[{ text, next, if:COND, ...EFFECT }] } } } }
          ("start" is the first node; an option with no "next" ends the talk)
events: [ { if:COND, repeat:true, ...EFFECT } ]  world rules, checked after every
          command (not mid-conversation). Each fires once, unless repeat:true,
          which fires every time "if" passes. For timed repeats, pair mark + since:
          { repeat:true, if:{ since:{ tick:3 } }, mark:"tick", ... } = every 3 turns.
          (the mark must be set once first, e.g. an event with no "if": { mark:"tick" })

at:     where a thing starts: a room id, "player" (inventory), or omitted (offstage).
        Things track their own location, so rooms never list their contents.
TEXT:   a string, or a list of variants; the first whose "if" passes is shown:
        [ { if:{ flag:"gate_open" }, text:"The gate is open." }, "The gate is shut." ]
        Tag things by id: "A [guard] eyes your [bread]." NPC = bold blue,
        item = bold underlined green (all items look alike, so players discover
        what matters). Things tagged in a room's text aren't repeated in the
        "You see / Here" lists. Ids must be unique across items AND npcs.
        Show a counter's value with {name}: "You have {gold} coins."
COND:   { has:"item", here:"thing", in:"room", flag:"name", not:COND,
          min:{ counter:n }, max:{ counter:n }, since:{ mark:n } }  all must pass
        has = in inventory, here = in the player's room, in = player is in room
        min/max = counter is at least / at most n (both inclusive)
        since = at least n turns have passed since that mark was set
EFFECT: { say:TEXT, set:"flag", unset:"flag", give:"item", take:"item",
          move:{ id:"roomId" | "player" | null | ["roomA","roomB",...] }, goto:"roomId", end:TEXT,
          add:{ counter:n } (negative n subtracts), mark:"name" (stamp the current turn) }
move with a list = a route: the thing steps to the next room in the list, looping.
say is picked AFTER the effect's other changes, so its variants see the new state;
        a say with no matching variant prints nothing.
COUNTERS: numbers that start at 0. "turns" is built in: +1 for every understood
        command except help and menu. A whole conversation counts as one turn.
```

The sections below explain each part in more detail.

## Top level

| Key | Meaning |
|---|---|
| `title` | Shown on the start menu and as the browser tab title. |
| `intro` | TEXT printed once when a new game starts. |
| `start` | Id of the room the player starts in. |
| `rooms`, `items`, `npcs` | Objects keyed by id. |
| `events` | A list of world rules. |

## Rooms

```js
corridor: { name: "Corridor", desc: TEXT,
  exits: { west: "cell", north: { to: "yard", if: { flag: "gate_open" }, fail: "The gate is locked tight." } } }
```

- An exit is either a room id or `{ to, if, fail }`. When the `if` fails, the player sees `fail`. Without a `fail`, they see "Something blocks the way."
- Directions are typed in full (`north`) or short (`n s e w u d`). Any other word, such as `in` or `portal`, also works as an exit name through `go <word>`.
- Rooms never list their contents. Things say where they are (see `at`).
- `look` prints the room name, then `desc`, then "You see:" (items), "Here:" (NPCs) and "Exits:". Things you tag with `[id]` in the description are left out of those lists.

## Items

```js
key: { name: "iron key", desc: TEXT, at: "cell", aliases: ["rusty"], fixed: true,
  use: [ { if: COND, ...EFFECT }, ... ] }
```

- `at` is where the item starts: a room id, `"player"` (in the inventory) or omitted (offstage, until something `give`s or `move`s it).
- `fixed: true` means the item can be looked at but not taken.
- `use` is a list. Typing `use <item>` runs the first entry whose `if` passes. If none passes, the player sees "Nothing happens." The item must be carried.
- The player can refer to an item by its id, its full name, any single word of its name, or an alias.

## NPCs and dialogue

```js
guard: { name: "Guard", at: "corridor", desc: TEXT,
  dialogue: {
    start: { text: TEXT, options: [
      { text: "Offer the bread.", if: { has: "bread" }, take: "bread", give: "key", set: "fed", next: "thanks" },
      { text: "Nothing." } ] },
    thanks: { text: "Food! ...Here. I never saw you." } } }
```

- `talk <npc>` (or just `talk` when only one NPC is present) opens the `start` node.
- Only options whose `if` passes are shown. They are numbered, and the player types the number.
- Choosing an option runs its effects, then goes to `next`. An option with no `next`, or a node with no options, ends the conversation.
- Typing anything that isn't a number ends the conversation and runs that command instead.
- A whole conversation costs one turn. Events don't run until it ends.

## Events

```js
events: [
  { mark: "rat" },                                            // no "if": fires once, on the first turn
  { repeat: true, if: { since: { rat: 2 } }, mark: "rat", move: { rat: ["cell", "corridor"] } },
  { if: { in: "yard" }, end: "You escaped in {turns} turns! THE END." }
]
```

- Events are checked in list order after every command, and once at the start of a new game.
- Each event fires once, unless it has `repeat: true`.
- Order matters. An earlier event's changes are visible to later events in the same turn.
- Once a game has ended (`end`), no further events run.

## TEXT

A TEXT value is either a string or a list of variants. The first variant whose `if` passes is shown, and a bare string always passes:

```js
desc: [ { if: { flag: "fed" }, text: "Crumbs on his chin." }, "Bored and clearly hungry." ]
```

- `[id]` shows the item's or NPC's name, styled. The validator reports any `[id]` that doesn't exist.
- `{counter}` shows a counter's value, for example `{turns}`.

## COND

All the keys in an `if` must pass. Keys you can use:

| Key | Passes when |
|---|---|
| `has: "item"` | the item is in the inventory |
| `here: "thing"` | the item or NPC is in the player's room |
| `in: "room"` | the player is in that room |
| `flag: "name"` | the flag is set |
| `not: COND` | the nested condition fails |
| `min: { counter: n }` | counter ≥ n |
| `max: { counter: n }` | counter ≤ n |
| `since: { mark: n }` | at least n turns have passed since the mark was set |

Add-ons can add their own conditions. For example, `dark` comes from `addons/light.js`.

## EFFECT

These run in table order, except `say`, `goto` and `end`, which always run last.

| Key | Does |
|---|---|
| `set` / `unset: "flag"` | turns a flag on or off |
| `give` / `take: "item"` | moves an item into or out of the inventory, with a "(Received: …)" or "(Lost: …)" line |
| `move: { id: where }` | where is a room, `"player"`, `null` (offstage), or a list (a route that steps to the next room and loops) |
| `add: { counter: n }` | adds n to the counter (negative n subtracts) |
| `mark: "name"` | stamps the current turn, for use with `since` |
| `say: TEXT` | prints the text. The variant is picked after the other effects have run |
| `goto: "room"` | moves the player there and prints the room |
| `end: TEXT` | prints the text and ends the game |

## State, saving, turns

- Game state lives in `S`: the room, where every thing is, flags, counters, marks, which events have fired, and each add-on's state.
- **Continue** restores a snapshot that is taken after every command. A finished game can't be continued.
- `turns` goes up by one for every understood command, except `help`, `menu` and the free commands that add-ons declare.

## Player commands

`look (l)`, `go <dir>` or just the direction, `take (get, grab)`, `drop`, `inventory (i, inv)`, `examine (x)`, `use`, `talk (speak)`, `wait (z)`, `help (h, ?)` and `menu`.
Filler words (`a an the to at with on`) are ignored.

## Validator

When the page loads, `validate()` checks the data. It lists every problem on the start menu and in the console, each with an exact path. The build prints the same list. It catches:
- unknown rooms, items and NPCs;
- `[id]` tags that don't exist;
- unknown condition keys;
- missing dialogue nodes, and dialogue with no `start` node;
- ids used by both an item and an NPC;
- flags, marks and counters that are checked but never set;
- add-on checks, such as a dark room when no item has `light`.

A clean build prints `Validator: no problems`.
