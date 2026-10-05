# Authoring a game

A game is one data object, `G`, in `games/<name>/game.js`. The engine reads it and never changes per game.
Start from `template/game.js`. For complete examples, see `games/damp-cell/game.js` (small: a person with topics
and a menu, a moving rat, and the light add-on's dark cellar), `games/sundown/game.js` (a countdown: replies, kinds, containers, randomness and five
add-ons) and `games/big-footprint/` (a full game that uses every word-layer feature; its `design/GDD_week01_rev4.md`, sections 12
and 13, maps each feature to where the player meets it).

## Quick reference

```
title, intro:TEXT, start (room id), status:TEXT (the line above the input), seed (fixed random rolls), version (ends old saves)
rooms:  { id: { name, desc:TEXT, on:REPLIES, exits:{ dir: "roomId" | { to, if:COND, fail:TEXT, hidden:true } },
          up:TEXT, down:TEXT ("look up" / "look down") } }
items:  { id: { name:TEXT, desc:TEXT, at, aliases:[], kind, fixed:true (can't take), hidden:true (not listed), on:REPLIES,
          holds:"in" | "on" (a container or a surface), closed:true | false (can be opened and closed),
          proper:true (no "the"), article:"an" | "some" | "" (instead of "a"), level:"up" | "down" (or TEXT variants) } }
npcs:   { id: { name:TEXT, desc:TEXT, at, aliases:[], kind, proper, article, level, pronoun:"her" | "him" | "them" | "it",
          on:REPLIES, topics:{ "a|b": REPLY, "*": REPLY },
          dialogue:{ nodeId:{ text:TEXT, options:[{ text, next, if:COND, ...EFFECT }] } } } }
self:   { name, aliases:[], kind, on:REPLIES }   the player as a target: "smell me", "think"
on:     REPLIES   the game's own replies, tried after the room's
kinds:  { kind: REPLIES }   replies every thing of that kind shares ("eat" for every "tool")
verbs:  { verb: { aliases:[], free:true, fail:TEXT, hidden:true, carry:true (take the direct thing first) } }
aliases:{ word: "verb" }   phrasal:{ "two words": "verb" }
conds:  { NAME: COND }   named conditions: if:"NAME", or is:"NAME" next to other keys
messages: { id: TEXT }   rewords any engine line (see Messages)
events: [ { if:COND, repeat:true | every:n, ...EFFECT } ]

REPLIES: { verb: REPLY }   REPLY = a string, or a list of { if:COND, ...EFFECT } (a string entry = { say })
         The first entry whose "if" passes runs. Any verb named in REPLIES or verbs becomes a command.
TEXT:   a string, or a list of variants: [ { if:COND, text:TEXT }, ..., "fallback" ]
        { rotate:[TEXT, ...] } shows the next line each time and loops; { ladder:[...] } stays on the last;
        { random:[TEXT, ...] } picks one at random.
        [id] shows a thing's name, styled. {counter} shows a counter. {it} is the thing being acted on,
        {what} and {with} the two slots. {the}, {The}, {a}, {A} add an article to {it}; {the:with}, {A:what}... to a slot.
COND:   { has, here, in, flag, is, seen, visited, open, inside:{ item:"holder" }, level:{ id:"up" }, what, with, not:COND, any:[COND], all:[COND],
          min:{ counter:n }, max:{ counter:n }, eq:{ counter:n }, since:{ mark:n }, said:"a|b", chance:n }
        has/here/flag/is/seen/visited take one name or a list (all must pass); in takes a room or a list (any).
EFFECT: { say:TEXT, set, unset, give, take, open, close (one or a list), move:{ id: where }, level:{ id:"up" | "down" | null }, add:{ counter:n },
          mark, free:true, do:"command", goto:"roomId", end:TEXT }
```

The sections below explain each part.

## Top level

| Key | Meaning |
|---|---|
| `title` | Shown on the start menu and as the browser tab title. It also names the browser save. |
| `intro` | TEXT printed once when a new game starts. |
| `start` | Id of the room the player starts in. |
| `status` | Optional TEXT shown in a line above the input, refreshed after every command: `` `Turn {turns} of ${SUNSET}` ``, `"HP {hp} · Gold {gold}"`. Hidden when it's empty. |
| `seed` | Optional number. Leave it out so every game rolls differently; set it to make every game roll the same (for tests). |
| `version` | Optional. Change it to stop saved games from continuing (see Turns, saving, undo). |
| `rooms`, `items`, `npcs` | Objects keyed by id. Item and NPC ids must be unique across both. |
| `self` | Optional. The player, as something verbs can target. |
| `on`, `kinds`, `verbs`, `aliases`, `phrasal` | Verbs and replies (see Verbs and replies). |
| `conds` | Named conditions. |
| `messages` | Rewording for the engine's own lines. |
| `events` | A list of world rules. |

`game.js` is plain JavaScript, so declare shared replies, conditions and numbers as `const`s above `G` and reuse them. It runs in its own scope (the build wraps it and keeps only `G`), so helpers can have any name without clashing with the engine's.

## Rooms

```js
corridor: { name: "Corridor", desc: TEXT,
  exits: { west: "cell", north: { to: "yard", if: { flag: "gate_open" }, fail: "The gate is locked tight." } },
  on: { listen: "Dripping water, far off." } }
```

- An exit is a room id or `{ to, if, fail, hidden }`. When `if` fails, the player sees `fail` (default: "Something blocks the way."). `hidden: true` leaves it out of the "Exits:" line.
- Directions: `north`…`down` and `northeast`…`southwest`, typed in full or as `n s e w u d ne nw se sw`. Any other word, like `in` or `portal`, works through `go <word>`.
- `go <room name>` takes the exit that leads there (`go to the yard`), and `go back` returns to the previous room.
- A room's data never lists what's in it: each thing says where it is (see `at`), and `look` lists them.
- `look` prints the name, `desc`, then "You see:" (items), "Here:" (NPCs) and "Exits:". Things tagged `[id]` in the description, and things with `hidden: true`, are left out of the lists.
- `up` and `down` (TEXT) are what the player sees on `look up` and `look down`, followed by the things up or down here (see Up and down).
- `visited: "room"` is false during the first look at a room and true afterwards, so a description can have a first-visit variant:
  `desc: [{ if: { visited: "shed" }, text: "The shed again." }, "A lean-to shed, full of cobwebs..."]`

## Items and NPCs

```js
key: { name: "iron key", desc: TEXT, at: "cell", aliases: ["rusty"], kind: "tool", fixed: true, hidden: true,
  on: { use: [ { if: COND, ...EFFECT }, ... ] } }
```

- `at` is where the thing starts: a room id, `"player"` (carried), a holder's id (in or on it, see below) or left out (offstage, until something `give`s or `move`s it).
- `fixed: true`: it can't be taken. `hidden: true`: it isn't listed in "You see:" (scenery mentioned by its aliases in the text).
- `kind` groups things that share replies (see `kinds`).
- The player names a thing by its id, its full name, an alias (multi-word aliases work) or any single word of its name. The longest phrase wins, so "iron key" beats "key" when both exist.
  Words next to each other narrow one thing: with a "cup" whose alias is "chipped" and a "cup of tea", "chipped cup" is the first cup, and no question is asked.
- `name` can be TEXT variants, so the name follows the state: `name: [{ if: { flag: "lit" }, text: "lit lamp" }, "unlit lamp"]`.
  The player names it by its name now (and its aliases). Use `if` variants only: a `rotate` would move on every time the name is read.
- Articles: messages say "the [mug]" and "a [mug]". `proper: true` drops the article ("Big Tony", not "the Big Tony"),
  and `article` sets the indefinite one: `"an"` (an hour), `"some"` (some water), or `""`. Without it, "a" or "an" follows the first letter.
- `examine` shows `desc`, and afterwards `seen: "id"` is true.
- When a word fits several things equally ("coffee" for the mug of coffee and the can of coffee grounds), the engine asks
  "Which do you mean: the can of coffee grounds or the mug of coffee?" (free) and the next words that pick one finish the command.
  `take` first rules out what's already carried, and `drop` and `put` what isn't. A word elsewhere in the line that fits only one of them
  picks it too. Give things distinct words and the question never comes up.
- After a question (or a word that narrowed one), "the other one" is the other choice, and "both" (or "all") takes or drops both.
  The pair is forgotten when the player enters a room, or names something that isn't one of the two.
- Pronouns: `it` is the last item acted on, `him` and `her` the last person, `them` the last thing of either kind. A person is
  both `him` and `her` unless `pronoun` says which (`"her"`, `"him"`, `"them"`, or `"it"` for an animal).
  "x letter", "x tony", "show it to him" shows the letter to Tony.

### Up and down

```js
hall: { name: "Hall", ..., up: "Cobwebs on the beams.", down: "Bare boards." },
kite: { name: "kite", at: "hall", level: "up", desc: "Paper, torn, caught on a beam." },
hook: { name: "hook", at: "hall", fixed: true, hidden: true, level: [{ if: { flag: "fallen" }, text: "down" }, "up"], desc: "Rusted iron." },
on: { shake: [{ if: { level: { kite: "up" } }, level: { kite: "down" }, say: "The kite drops." }, "Nothing falls."] }
```

- `level` says where a thing is in its room: `"up"` (on a beam, a giraffe's head, a bat) or `"down"` (on the floor, a rat).
  Things without a level are neither, and `look up` / `look down` don't list them. TEXT variants let the level follow the state.
- `look up` (also `look above`, `look overhead`) prints the room's `up` text, then every thing in sight here whose level is
  `"up"`: not carried, not in a closed holder, hidden scenery included. Each is named, then described:
  "The kite: Paper, torn, caught on a beam." (message `levelSee`, `{The}: {text}`), and counts as examined.
  So write those descriptions to read after the name: not "A paper kite, caught..." or "Reina, up in the palms...".
- `look down` (also `look below`) does the same for `"down"`. With no text and nothing there: "Nothing special up there."
  (message `levelNone`, with `{dir}`). `look up at the beam` examines the beam. Looking costs what `look` costs.
- The effect `level: { kite: "down" }` moves a thing up or down now, and the game remembers it (`S.level`, saved and undone
  with everything else); `level: { kite: null }` puts it back to its data. The condition `level: { kite: "up" }` tests it.
- A thing with a level that the player drops lands `"down"`.

## Containers and surfaces

```js
toolbox: { name: "toolbox", at: "shed", fixed: true, holds: "in", closed: true, desc: "Red, dented, latched shut." },
nails:   { name: "box of nails", at: "toolbox" },
shelf:   { name: "shelf", at: "cabin", fixed: true, hidden: true, holds: "on" },
mug:     { name: "mug of coffee", at: "shelf" }
```

- `holds: "in"` makes an item a container, `holds: "on"` a surface. Things start in or on it with `at: "<holder id>"`, and `move` can put them there.
- `closed: true` or `false` makes it openable: `open` and `close` are built-in commands, and the `open`/`close` effects and the `open` condition work on it. What's in a closed holder can't be seen or reached.
- Looking at a room, examining a holder, opening it and `inventory` all show what's in or on it: "On the shelf: mug of coffee."
- `put X in Y` / `put X on Y` places a carried thing (the holder decides "in" or "on"). `drop X in Y` does the same. `put X down` drops it.
  On something that isn't a holder, `put X on Y` means `use X on Y`, so recipes and replies answer ("put the plywood on the window").
- `take X` reaches into open holders; `take X from Y` works too. A carried box carries what's in it.
- `has` and `here` see through holders: a coin in a box you carry is `has: "coin"`. `inside: { coin: "box" }` tests one holder exactly.
- A lock is data: `on: { open: [{ if: { not: { has: "key" } }, say: "Locked." }] }`. When no entry passes, the built-in `open` runs.

## NPCs and dialogue

```js
guard: { name: "Guard", at: "corridor", desc: TEXT,
  dialogue: {
    start: { text: TEXT, options: [
      { text: "Offer the bread.", if: { has: "bread" }, take: "bread", give: "key", set: "fed", next: "thanks" },
      { text: "Nothing." } ] },
    thanks: { text: "Food! ...Here. I never saw you." } } }
```

- `talk <npc>` (or `talk` alone when an NPC is present) opens the `start` node. An NPC with `on.talk` answers with that reply instead.
- Only options whose `if` passes are shown. The player types the number, or words from exactly one option ("offer bread").
- An option runs its effects, then goes to `next`. No `next`, or a node with no options, ends the conversation.
- Typing a command ends the conversation and runs it. A whole conversation costs one turn, and events wait until it ends.

### Topics: ask and tell

```js
guard: { ..., topics: {
  "gate|door": [{ if: { flag: "gate_open" }, say: "\"What gate?\"" }, "\"Stays locked. Orders.\""],
  "key|keys": "He pats his belt. \"Mine.\"",
  "*": "He shrugs." } }
```

- `ask guard about the gate`, `tell him about the key`, or `ask about the gate` (the person here who has topics).
- The first key whose phrases (`|` between them) appear in the words after "about" answers, with a REPLY. `"*"` answers anything else, and with no `"*"` the player sees `noTopic`.
- Topics and the numbered menu work side by side: a menu for set pieces, topics for questions the player thinks of.

## Verbs and replies

Any verb can be given to any thing, room, the player or the game, with a REPLY:

```js
radio: { name: "radio", at: "cabin", fixed: true,
  on: { listen: { say: { rotate: ["Static.", "A hymn.", "\"...stay indoors...\""] } },
        turn: [{ if: { flag: "radio_on" }, unset: "radio_on", say: "Click. Silence." },
               { set: "radio_on", say: "Click. Static." }] } }
```

A REPLY is a string, an effect object, or a list of them. The first entry whose `if` passes runs.

### Two slots: "give the bread to the guard"

A line can name two things in two roles. `LINE.what` is the direct thing and `LINE.with` the second one, after a role word
(`to with on onto in into inside at about from for under behind`). The condition `what:` and `with:` test them, and `{what}`,
`{with}`, `{the:what}`, `{The:with}` print them:

```js
guard: { ..., on: { give: [
  { if: { what: "bread" }, take: "bread", give: "key", set: "fed", say: "He snatches it." },
  "He doesn't want {the:what}." ] } },
verbs: { give: { carry: true } }   // "(first taking the bread)" when it's lying here
```

- "give the bread to the guard", "give the guard the bread" and "give guard bread" all mean what = bread, with = guard:
  with no role word, the first and last things named fill the slots, and a person named first is the second slot.
- With nothing before the role word, the thing after it is the direct one: "talk to the guard", "listen to the radio".
- "hit the rat with the stick": what = rat, with = stick. A reply on the stick, the rat, the room or the game can answer, and
  `with: "stick"` tells "hit the rat" from "hit the rat with the stick".
- A first slot that names something out of reach ("give the bread to him" with no bread here) answers "You don't see that here."
- `put X in/on Y` uses the slots, and so does the craft add-on. `verbs.X.carry: true` takes the direct thing first, with a
  "(first taking ...)" line (message `firstTake`), when it's here and can be taken; `put` does this on its own.
  That take runs exactly like a typed `take`: add-ons' `before` hooks (darkness), replies on `take`, then the built-in, which
  prints `firstTake` instead of `taken`. If the thing still isn't carried afterwards, the command stops there.
- A role word inside a name in reach doesn't split the line: with "the letter to Ana" here, "take the letter to Ana" is one
  thing, and "show the letter to Ana to Tony" splits at the second `to`.

When the player types a verb, the engine tries, in order, and stops at the first reply that answers:
1. each thing the line names, in slot order: the second slot (`with`), then the direct thing (`what`), then any other, last
   named first. For each: its `on[verb]`, then `kinds[its kind][verb]`;
2. the room's `on[verb]`;
3. when nothing was named: `self.on[verb]` (so "think" or "dance" alone can answer);
4. the game's `on[verb]`;
5. the built-in command, if there is one (`take`, `use`, `examine`...);
6. `verbs[verb].fail`, or "You can't {verb} that." / "{Verb} what?".

So "use key on door" asks the door first, then the key, and "give the bread to the guard", "give the guard the bread" and
"give him the bread" all ask the guard first: a reply on the bread only answers when the guard's doesn't. A reply on a built-in verb (like `on.take` or `on.go`) only replaces the built-in when one of its entries passes. A room's `on.go` with `if: { said: "down" }` can guard one direction.

- `said: "a|b"` passes when the words typed after the verb contain any of the phrases (whole words). A list means all of them. `said: ""` means nothing was typed. Directions are spelled out for `go` (`d` is `down`).
- `kinds: { tool: { eat: "You'd chip a tooth on the {it}." } }` gives every `kind: "tool"` the same reply.
- `verbs: { smell: { free: true, aliases: ["sniff"], fail: "Nothing smells.", hidden: true } }`: `free` verbs don't cost a turn, `aliases` are more words for the verb, `fail` answers when nothing else does, and `hidden` keeps the verb out of `help`.
- `aliases: { quit: "menu", press: "push" }` and `phrasal: { "knock over": "break" }` add words for any command.
- Reply verb names are just names. `take`, `in` or `set` as a verb won't be read as an effect or condition.

## Events

```js
events: [
  { every: 2, move: { rat: ["cell", "corridor"] } },          // every 2nd turn
  { if: { in: "yard" }, end: "You escaped in {turns} turns! THE END." }
]
```

- Events are checked in list order after every command, and once at the start of a new game.
- An event that moves something into or out of the player's sight and says nothing (no `say` or `end`) prints `arrives` or
  `leaves`: "The [rat] arrives." Reword them in `messages` (`{dir}` is the exit it used from here, when there is one), or set them
  to `""` to keep moves silent. An event with a `say` tells its own story, so it gets no extra line.
- Each fires once, unless it has `repeat: true` (every time `if` passes) or `every: n` (on every nth turn, while `if` passes).
- Earlier events' changes are visible to later events in the same turn. After an `end`, no further events run.

## TEXT

A TEXT is a string, or a list of variants. The first variant whose `if` passes is shown, and a bare string always passes:

```js
desc: [ { if: { flag: "fed" }, text: "Crumbs on his chin." }, "Bored and clearly hungry." ]
say:  { rotate: ["Huh?", "Say again?"] }                     // next line each time, then loops
say:  { if: { in: "salon" }, ladder: ["Hint 1", "Hint 2", "Hint 3"] }   // next line each time, then stays on the last
say:  { random: ["A crow caws.", "Wind.", "Somewhere, a bell."] }      // one at random
```

- `[id]` shows the item's or NPC's name, styled. The validator reports any `[id]` that doesn't exist.
- `{counter}` shows a counter's value, such as `{turns}`. `{it}` becomes `[id]` for the thing being acted on, and `{what}` / `{with}` the two slots.
- `{the}`, `{The}`, `{a}`, `{A}` put an article before `{it}`: "the [mug]", "A [rat]", or just "[Tony]" for `proper: true`.
  `{the:with}` (or `{A:what}`, or `{the:to}` in a message's own values) does the same for another value.
- A rotation's place is saved with the game.
- Random rolls come from a generator kept in the game state, so Continue, `undo` and `again` replay the same roll instead of re-rolling.

## COND

All keys in an `if` must pass. `if: "NAME"` is short for `if: { is: "NAME" }`.

| Key | Passes when |
|---|---|
| `has: "item"` or `["a", "b"]` | all are carried |
| `here: "thing"` or a list | all are in the player's room |
| `in: "room"` or a list | the player is in that room (any of them) |
| `flag: "name"` or a list | all flags are set |
| `is: "NAME"` or a list | the named conditions in `conds` pass |
| `seen: "thing"` | it has been examined |
| `visited: "room"` | the player has been there before |
| `not: COND` | the nested condition fails |
| `any: [COND, ...]` / `all: [COND, ...]` | at least one / every one passes |
| `min` / `max` / `eq: { counter: n }` | counter ≥ / ≤ / = n |
| `since: { mark: n }` | at least n turns since the mark was set |
| `said: "a\|b"` | the typed words contain one of the phrases |
| `open: "box"` | that holder is open |
| `what: "bread"` or a list | the direct thing of this command is one of them ("give **bread** to the guard") |
| `with: "guard"` or a list | the second thing is one of them ("give the bread to the **guard**", "hit the rat with the **stick**") |
| `inside: { coin: "box" }` | that thing is directly in or on that holder |
| `level: { kite: "up" }` | that thing's level now is `"up"` (or `"down"`) |
| `chance: n` | a random roll passes, n times in 100. Rolled once per condition per command, so checking the same `if` twice in one turn gives the same answer |

Add-ons add more, such as `dark` (light), `logged` (journal).

## EFFECT

These run in table order, except `say`, `do`, `goto` and `end`, which always run last, in that order.

| Key | Does |
|---|---|
| `set` / `unset: "flag"` or a list | turns flags on or off |
| `give` / `take: "item"` or a list | moves items into or out of the inventory, with a "(Received: …)" or "(Lost: …)" line |
| `move: { id: where }` | where is a room, `"player"`, a holder, `null` (offstage), or a list (a route: the next room in it, looping) |
| `open` / `close: "box"` or a list | opens or closes a holder, silently |
| `level: { id: "up" }` | moves a thing up or down in its room; `null` puts it back to its data `level` |
| `add: { counter: n }` | adds n (negative subtracts) |
| `mark: "name"` | stamps the current turn, for `since` |
| `free: true` | this command costs no turn |
| `say: TEXT` | prints the text. The variant is picked after the other effects ran |
| `do: "command"` | runs a command, as if typed: `do: "look"` |
| `goto: "room"` | moves the player there and shows the room |
| `end: TEXT` | prints the text and ends the game |

The validator reports any key in an event, reply or dialogue option that isn't an effect (a typo like `sey:`).

## Messages

Every line the engine prints has an id, and `messages` rewords it with a TEXT (variants and `rotate` work, `""` hides it):

```js
messages: { huh: { rotate: ["Huh?", "Say that again?"] }, cantGo: "No way through there.", received: "" }
```

| id | Default |
|---|---|
| `huh` | I don't understand that. Type 'help'. |
| `over` | The game is over. Type 'restart', 'undo' or 'menu'. |
| `help` | Commands: {cmds}.\nDirections: n, s, e, w, u, d, or back (one step: the room you just left).\nAlso: look up, look down, oops <word> (fixes a typo).\nFree actions: {free}. |
| `cantGo`, `blocked`, `goWhere` | You can't go that way. / Something blocks the way. / Go where? |
| `notHere`, `notHave` | You don't see that here. / You don't have that. |
| `what`, `cant` | {Verb} what? / You can't {verb} that. |
| `taken`, `have`, `fixed`, `dropped` | Taken: {it} / You already have that. / You can't take that. / Dropped: {it} |
| `carry`, `carryNone` | You carry: {list} / You carry nothing. |
| `nothing`, `plain` | Nothing happens. / You see nothing special. |
| `noOne`, `silent`, `choose`, `noTopic` | No one by that name is here. / No response. / Choose a number from the list. / No answer about that. |
| `wait` | Time passes. |
| `see`, `people`, `exits` | You see: {list} / Here: {list} / Exits: {list} |
| `received`, `lost` | (Received: {it}) / (Lost: {it}) |
| `noAgain`, `noUndo`, `undone` | There's nothing to do again yet. / There's nothing to undo. / Undone. |
| `which`, `nothingAll` | Which do you mean: {list}? / There's nothing here to {verb}. |
| `putIn`, `putOn`, `cantPut`, `isShut` | You put {the} in {the:to}. / You put {the} on {the:to}. / You can't put something inside itself. / {The} is closed. |
| `inIt`, `onIt` | In {the}: {list}. / On {the}: {list}. |
| `opened`, `closed`, `alreadyOpen`, `alreadyClosed` | You open {the}. / You close {the}. / It's already open. / It's already closed. |
| `firstTake` | (first taking {the}) |
| `arrives`, `leaves` | {The} arrives. / {The} leaves. (`{dir}`: the exit it used, or empty) |
| `noOops` | There's nothing to correct. |
| `levelNone`, `levelSee` | Nothing special {dir} there. (`{dir}`: up or down) / {The}: {text} (a thing at that level, then its desc) |
| `brief`, `verbose` | Brief descriptions: a room you've seen shows its name and what's there. / Full descriptions: every room is described in full. |
| `transcript`, `noTranscript` | Transcript saved: {n} lines. / This browser won't save files, so the transcript can't be saved here. |

Add-ons add their own ids (light: `dark`, `darkFalls`; craft: `combineWhat`, `combineNo`, `combineFail`; and so on).

## Player commands

`look (l)`, `go <dir>` or just the direction, `take (get, grab, pick up)`, `drop (put down)`, `put (place, insert)`,
`open`, `close (shut)`, `inventory (i)`, `examine (x, look at)`, `use`, `talk (speak)`, `ask`, `tell`, `wait (z)`,
`again (g)`, `undo`, `restart`, `help (h, ?)` and `menu (q, quit)`, plus every verb the game gives replies to.
`look up` / `look down` (also `above`, `overhead`, `below`) show what's above and below you (see Up and down).

Also, all free:
- `oops <word>`: runs the last line again with its unknown word replaced ("take lmap", "oops lamp"). With no unknown word, the last word is replaced.
- `brief` / `verbose`: a room seen before shows only its name and lists, or the full description (the default). It's a player
  setting: kept in the browser, and untouched by `undo` and `restart`.
- `transcript`: saves every line of this session as a text file, including what scrolled off the screen. For playtests and bug reports.

### How a command is read

The engine reads a **verb followed by the things it names**. It is a command reader, not a grammar parser:
- The first word (or a two-word phrasal verb like "pick up") is the verb, after aliases. A direction alone means `go`.
- Punctuation is ignored, so `north.` and `hello!` work. Input is capped at 200 characters.
- Filler words (`a an the to at with on`) are dropped, except inside a name of something in reach ("the letter to Ana"). Particles at either end of the object (`up down around under out off...`) are dropped too: "feel around", "put the hammer down". `look up` and `look down` keep theirs.
- The rest is scanned for things in reach, longest name first, and words next to each other narrow one thing ("chipped cup"). Other words are kept for `said:` but otherwise ignored.
- The first role word (`to`, `with`, `on`, `at`, `about`...) outside a name splits the line into two slots (`what:` and `with:`). "use the key on the door" and "use key door" still read the same: without one, the first and last things named fill the slots.
- `take` and `drop` accept `all`, `all except X`, `both` and `X and Y`. Pronouns stand for the last item (`it`), person (`him`, `her`) or thing (`them`); "the other one" for the other choice of the last question. A name that fits several things asks "Which do you mean?".
- `look under/behind/in X` runs `search X` when the game has a `search` verb, and otherwise examines X.
- The echo of what the player typed is printed as typed: `[key]` stays `[key]`.

What it does **not** do (write a reply with `said:`, or an add-on with the `input` hook, if a game needs it):
- several commands on one line ("take key then go north", "take key. go north");
- `all` for verbs other than `take` and `drop`;
- a third slot ("hit the rat with the stick on the head"): only the first role word splits the line;
- prepositions as places: "put X under Y" fills the slots, but only `in` and `on` holders hold things;
- adjectives as filters beyond names and aliases ("the red one" works only if "red" is in a name or alias);
- "guard, open the gate" (orders to people) and "wait until dark": an `input` hook or a `said:` reply;
- questions to people outside `ask/tell X about Y` and dialogue menus.

## Turns, saving, undo

- `turns` goes up by one for every command, except free ones: `help`, `menu`, `inventory`, `again`, `undo`, `restart`, `brief`, `verbose`, `transcript`, free verbs and add-on free commands. `look` (with `look up` / `look down`) costs a turn unless the game makes it free (`verbs: { look: { free: true } }`). A reply with `free: true` refunds its turn, and naming something that isn't here costs nothing.
- **Continue** restores a snapshot taken after every command. It's also kept in the browser's localStorage, so it survives a reload. A finished game can't be continued.
- A save belongs to one shape of the game: its room, item and NPC ids, its number of events, and `G.version`. Change any of those and old saves are ignored. Editing text, replies or conditions keeps them, so you can fix wording without wiping players' progress. When a content patch should end runs in progress (a puzzle's solution changed, say), bump `version`.
- `undo` steps back one turn-costing command, even after an ending. `again` repeats the last command.

## Validator

When the page loads, `validate()` checks the data. Every problem is listed on the start menu and in the console with an exact path, and the build prints the same list. It catches:
- unknown rooms, items, NPCs, named conditions and message ids;
- `[id]` tags that don't exist;
- unknown condition keys, in `if`, `not`, `any`, `all` and `conds`;
- unknown effect keys in events, replies and dialogue options;
- missing dialogue nodes, and dialogue with no `start` node;
- ids used by both an item and an NPC, and things with no name;
- flags, marks and counters that are checked but never set;
- verb aliases that clash with another command, and `aliases` / `phrasal` entries that lead to no command;
- containers: `holds` must be `"in"` or `"on"`, `at` chains must end in a room, `open`/`close`/`inside` need openable holders;
- levels: a thing's `level`, and the `level` effect and condition, take `"up"` or `"down"` (the effect also `null`);
- add-on checks, such as a dark room with no light, or a `log` with no journal entry.

A clean build prints `Validator: no problems`.
