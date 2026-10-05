# Data patterns

Recipes for `game.js` that need no new code. They come from the games built on v1 (a-quick-nap, big-footprint) and the Code-Block-Reference repo, rewritten for v2. `games/sundown/game.js` uses many of them; `games/big-footprint/game.js` uses the rest at full scale.

## Countdown with timed warnings

`turns` counts every command that costs time, so a deadline is a named condition plus one-shot events. Events run in list order, so put the warnings before the ending.

```js
const SUNSET = 30;
conds: { DUSK: { min: { turns: SUNSET - 10 } }, SUNDOWN: { min: { turns: SUNSET } } },
events: [
  { if: "DUSK", say: "The sun touches the treetops." },
  { if: { min: { turns: SUNSET - 3 } }, say: "Branches snap in the woods." },
  { if: "SUNDOWN", end: "They're here. THE END." }
]
```

Write every other time check against the constant (`SUNSET - n`), so changing the deadline keeps everything in place. The intro can be a template string: `` intro: `They come at sundown, ${SUNSET} turns from now.` ``

To let the player skip time, add to `turns` directly: a nap is `{ add: { turns: 20 }, mark: "nap" }`.

### Warnings that speed up

List warnings by turns left and generate the events:

```js
const WARN = [[20, "A car alarm, far off."], [5, "Shapes at the bottom of the road."], [1, "They're here. Do it NOW."]]
  .map(([left, say]) => ({ if: { min: { turns: SUNSET - left } }, say }));
events: [ ...WARN, /* ... */ ]
```

## Several conditions of the same kind

An `if` is an object, so each key appears once. In v2, `has`, `here`, `flag`, `is`, `seen` and `visited` take lists, and `all`/`any` combine whole conditions:

```js
if: { has: ["hammer", "nails"], flag: ["front", "side"] }
if: { any: [{ in: "cabin" }, { has: "tent" }] }
if: { is: "SUNDOWN", min: { progress: 3 } }   // a named condition next to another min
```

(v1 needed `not: { not: ... }` and `carry: [...]` from craft.js for this.)

## An ending built from the final state

At the deadline, one-shot events turn the final state into counters, then a ranked list of `end` events picks the first that matches, best first:

```js
{ if: { is: "SUNDOWN", in: "cabin" }, add: { inside: 1 } },
{ if: { is: "SUNDOWN", has: "spear" }, add: { armed: 1 } },
{ if: "SUNDOWN", say: "(Defenses: {fort} of 4.)" },
{ if: { is: "SUNDOWN", min: { fort: 4, inside: 1, armed: 1 } }, end: "...THE END: Best." },
{ if: { is: "SUNDOWN", min: { fort: 4 } }, end: "...THE END: Holdout." },
{ if: "SUNDOWN", end: "...THE END: Overrun." }
```

An `end` stops every event after it, so an early "wrong place" ending goes before the narration.

## Hidden things revealed by searching

The thing starts offstage (no `at`). The first search moves it in, and a flag makes it happen once. "look under the rug" runs `search` when the game has that verb.

```js
rug: { name: "rug", at: "cabin", fixed: true,
  on: { search: [{ if: { not: { flag: "lifted" } }, set: "lifted", move: { crowbar: "cabin" }, say: "Under the rug: a [crowbar]." },
    "Just floorboards now."] } },
crowbar: { name: "crowbar", desc: "..." }   // no "at": offstage until moved
```

For a hidden exit, make it conditional and hide it until then:
`down: { to: "crawl", if: { flag: "lifted" }, hidden: true, fail: "Only floorboards." }`.

## A one-way seal

```js
exits: { south: { to: "yard", if: { max: { door: 0 } }, fail: "You've sealed the door. You're in for the night." } }
```

## Shared replies

Declare a reply once and reuse it in `on` verbs, recipes and dialogue:

```js
const BOARD = { move: { plywood: null }, set: "boarded", say: "You nail the [plywood] over the [window]." };
window: { on: { board: [{ if: { has: ["hammer", "nails", "plywood"] }, ...BOARD }, "You need plywood, a hammer and nails."] } },
recipes: [{ with: ["plywood", "window"], if: { has: ["hammer", "nails"] }, fail: "You'll need a hammer and nails.", ...BOARD }]
```

## Snark for everything (kinds)

Give each thing a `kind`. Any verb it has no reply for falls back to `kinds[kind][verb]`. Rotate the lines so a player who keeps poking gets something new. `{it}` is the thing.

```js
hammer: { name: "claw hammer", kind: "tool" },
kinds: {
  tool: { eat: { say: { rotate: ["You consider eating the {it}. Your dentist sits bolt upright in bed.", "The {it} is not food."] } } },
  vehicle: { take: "You try to pocket the {it}. It does not fit." }
},
on: { eat: "No." }   // anything else: the game's reply
```

(v1 needed quips.js and actions.js for this.)

## Free senses, and the player as a target

```js
verbs: { smell: { free: true }, listen: { free: true }, examine: { free: true } },   // free works on built-in verbs too
self: { name: "yourself", on: { smell: [{ if: { flag: "drenched" }, say: "Coffee. All of you." }, "Sawdust and nerves."] } }
```

"smell me" and "smell myself" reach `self`. A bare "dance" with no room reply reaches `self.on.dance`.

## A gag with a small cost

The first honk costs 5 extra turns; later ones rotate lines and are free. Put it in the game's `on` so a bare "honk" works anywhere
(on the horn's own `on`, only "honk horn" would reach it).

```js
honk: [{ if: { not: { flag: "honked" } }, set: "honked", add: { turns: 5 }, say: "HWAAANK. A thousand heads turn." },
  { free: true, say: { rotate: ["HONK.", "The horn wheezes."] } }]
```

## Strikes and consequences

A counter that climbs with each mistake, and text that reads it:

```js
const STRIKE = { add: { strikes: 1 }, say: [{ if: { eq: { strikes: 3 } }, text: "" }, { if: { eq: { strikes: 2 } }, text: "Last warning." }, "Careful."] };
events: [{ if: { min: { strikes: 3 } }, end: "You're shown the door. THE END." }]
```

## Escalating hints

```js
verbs: { hint: { free: true } },
on: { hint: [
  { if: { in: "salon", not: { flag: "p1" } }, say: { ladder: ["The piano matters.", "Mama's song.", "Type: play cielito lindo"] } },
  { say: { ladder: ["Look around.", "Examine everything."] } } ] }
```

Each `ladder` keeps its own place.

## Matching what was typed

`said` reads the words after the verb, so one room reply can answer many phrasings without making every word an item:

```js
salon: { on: { play: [
  { if: { said: "cielito lindo", not: { flag: "p1" } }, set: "p1", give: "ledger", say: "A tray slides out of the piano." },
  { if: { said: "" }, say: "Play what?" },
  { say: "The Don winces. Wrong song." } ] } }
```

## An ending ladder with a story recap (journal.js, endings.js)

Put `log: "key"` in any effect worth retelling. Big things carry `add: { progress: 1 }`; gags are `aside: true`. At the end, print a lead-in, `recap: true`, then the ranked endings with `ending: "id"`:

```js
journal: {
  boarded: { text: "You boarded up the window.", add: { progress: 1 } },
  coffee: { aside: true, text: "You drank a mug of cold coffee, for courage." } },
endings: [{ id: "overrun", name: "Overrun" }, { id: "dawn", name: "Dawn" }],
events: [
  { if: "SUNDOWN", say: "Looking back, it was quite an evening." },
  { if: "SUNDOWN", recap: true },
  { if: { is: "SUNDOWN", min: { progress: 3 } }, ending: "dawn", end: "THE END: Dawn. (Endings found: {found} of 2.)" },
  { if: "SUNDOWN", ending: "overrun", end: "THE END: Overrun. (Endings found: {found} of 2.)" } ]
```

## Giving and showing things to people

```js
verbs: { give: { carry: true }, show: { carry: true } },
npcs: { clerk: { ..., pronoun: "her", on: {
  give: [{ if: { what: "ticket" }, take: "ticket", set: "checked_in", say: "{The:with} stamps {the:what}." }, "{The:with} pushes {the:what} back."],
  show: [{ if: { what: "badge" }, set: "trusted", say: "She nods you through." }, "She glances at {the:what}. \"So?\""] } } }
```

"give the ticket to the clerk", "show badge to clerk", and "give her the ticket" once she's been named, all work, and the item is picked up first if it's lying
here. The reply sits on the person, who is asked first because the second slot answers before the direct thing, whichever
order the player used. So the ticket can still have its own `give` reply ("Give it to whom?") for when nobody's named.

## Something up high, something underfoot

```js
attic: { name: "Attic", ..., up: "Rafters, and daylight through a missing tile.", down: "Dust, and a trail through it." },
bat: { name: "bat", at: "attic", level: "up", desc: "Hanging upside down, one eye open." },   // "The bat: Hanging upside down..."
mouse: { name: "mouse", at: "attic", level: "down", desc: "It freezes. So do you." },
on: { clap: [{ if: { level: { bat: "up" } }, level: { bat: "down" }, say: "The [bat] drops and flaps around your ankles." }] }
```

`look up` shows the rafters and the bat; `look down` the dust and the mouse. The clap moves the bat down for good (the game
remembers it), and `level: { bat: null }` would send it back up. A level can also follow the state with TEXT variants.

## Gotchas

- Break-test every game before it ships: paste a few thousand words, type `[some_id]`, `constructor` and `__proto__`, reload mid-game, and tamper with localStorage. The engine handles all of these; the test suite checks them for the samples.
- Playtest like a stranger: "look at X", "pick up X", "go outside", "call 911", "kick door". The engine handles the phrasing; your data should hold the replies, and `kinds` make the refusals personal.
- Watch for shared words in names. "coffee" fits both "mug of coffee" and "can of coffee grounds", so the engine asks "Which do you mean?". That's correct, but it costs the player a step: give each thing a word of its own ("mug", "can") so most commands never need to ask.
- `[id]` prints the full name, so `a braided [rug]` reads "a braided braided rug" when the name is "braided rug". Write `a [rug]`, or name it "rug".
- `{it}` prints "[id]", so `the {it}` needs a name that reads well after "the" ("half-eaten sandwich", not "half a sandwich"). Prefer `{the}`: it leaves the article off a `proper` name.
- A person is "him" and "her" until `pronoun` says otherwise, and never "it". Give animals `pronoun: "it"`, or "x rat", "feed it" won't find the rat.
- `hints.js` suggests any action that changes state, including ones the player can't take back. Warn with `hint: "push the [chest] against the door (seals you in)"`, and mark gags `secret: true`.
