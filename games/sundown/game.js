// Game data reference: docs/AUTHORING.md
// A countdown sample: replies, kinds, containers, randomness, look up/down, and the craft, journal, endings, tags and hints add-ons.
// Things to try: "open toolbox", "take all", "put nails in toolbox", "take coffee" (two things fit), "x radio" then "listen to it".
const SUNSET = 30;
const BOARD = { move: { plywood: null }, set: "boarded", log: "boarded", say: "You nail the [plywood] over the [window]. Solid." };   // shared by a recipe and a verb
const G = {
  title: "Sundown",
  intro: `The radio said they come at sundown, ${SUNSET} turns from now. Board up the [window] and be inside when it's dark. (Type "think" if you're stuck.)`,
  start: "cabin",
  status: `Turn {turns} of ${SUNSET}`,   // the line above the input, refreshed after every command
  conds: { DUSK: { min: { turns: SUNSET - 10 } }, SUNDOWN: { min: { turns: SUNSET } } },   // named conditions: if:"DUSK" or is:"SUNDOWN"
  verbs: { smell: { free: true }, listen: { free: true }, think: { free: true, aliases: ["ponder"] },
    search: { fail: "You find nothing." }, board: { aliases: ["nail"], fail: "There's nothing to board up there." } },
  messages: { huh: { rotate: ["Huh?", "Say that again, slower.", "The wind doesn't understand you either."] } },
  self: { name: "yourself", props: { nerve: 0 }, on: { smell: "Sawdust and nerves.", think: { hints: "You take stock." } } },   // "self.nerve": coffee raises it, climbing tests it
  on: { pray: "Couldn't hurt.", sleep: [{ if: "DUSK", say: "Not now. Not with the light going." }, "You're not tired. You're terrified."] },

  rooms: {
    cabin: { name: "Cabin", exits: { south: "yard" }, up: "Bare rafters, and an empty wasp nest from last summer.",   // "look up" / "look down"
      desc: [{ if: "DUSK", text: "Orange light slants through the [window]. The [rug] looks like a pool of shadow. The [radio] hisses on the shelf." },
        "A one-room cabin. A bare [window] faces the woods, a braided [rug] covers the floor, and a [radio] sits on the shelf. The yard is south."],
      on: { listen: [{ if: "DUSK", say: "The crickets have stopped." }, "Wind in the pines."], smell: "Pine and old coffee." } },
    yard: { name: "Front Yard", exits: { north: "cabin", east: "shed" },
      up: [{ if: "DUSK", text: "The sky over the pines is going orange, then bruise-purple." }, "Tall pines, and a sky that's running out of daylight."],
      down: "Pine needles, and in them, prints much bigger than your boots.",
      desc: "Pine needles and long shadows. The cabin is north, the shed east.",
      on: { listen: { say: { random: ["Something big moves, far off in the trees.", "A branch cracks. Then nothing.", "Wind, and under it, breathing?"] } },
        climb: [{ if: { flag: "lookout" }, free: true, say: "Once was enough." },   // a skill check: d20 + nerve against 14
          { if: { check: { plus: "self.nerve", vs: 14 } }, set: "lookout", say: "Up to the first fork, sap on your palms. Pines in every direction, and no road. Something big is moving between them, slowly, toward the cabin." },
          "Your boot slips on the sap, and you land on your back in the needles. You'd need more nerve for that."] } },
    shed: { name: "Tool Shed", exits: { west: "yard" }, up: "Cobwebs in every corner of the roof.", down: "Oil stains on a dirt floor.",
      desc: [{ if: { visited: "shed" }, text: "The shed, smelling of oil. A [toolbox] on the bench. The yard is west." },
        "A lean-to shed that smells of oil and rust. Cobwebs in every corner, and a [toolbox] on the bench. The yard is west."] }
  },

  items: {
    window: { name: "window", at: "cabin", fixed: true, kind: "fixture",
      desc: [{ if: { flag: "boarded" }, text: "Plywood, nailed tight." }, "Bare glass. It won't stop anything."],
      on: { board: [{ if: { flag: "boarded" }, free: true, say: "It's already boarded." },
        { if: { has: ["hammer", "nails", "plywood"] }, ...BOARD }, "You need plywood, a hammer and nails."] } },
    rug: { name: "rug", at: "cabin", fixed: true, kind: "fixture", level: "down", desc: "Braided rag rug. One corner is lumpy.",
      on: { search: [{ if: { not: { flag: "lifted" } }, set: "lifted", move: { crowbar: "cabin" }, level: { crowbar: "down" }, say: "Under the rug: a [crowbar]." }, "Just floorboards now."] } },
    radio: { name: "radio", at: "cabin", fixed: true, kind: "fixture", desc: "A battered transistor radio.",
      on: { listen: { say: { rotate: ["\"...stay indoors after dark...\"", "Static, then a hymn.", "\"...repeat, stay indoors...\""] } } } },
    hammer: { name: "claw hammer", at: "shed", kind: "tool", desc: "Heavy, reliable." },
    toolbox: { name: "toolbox", at: "shed", fixed: true, holds: "in", closed: true, desc: "Red, dented, latched shut." },   // a container: open it to reach what's in it
    nails: { name: "box of nails", at: "toolbox", kind: "tool", aliases: ["nail"], desc: "A full box." },
    shelf: { name: "shelf", at: "cabin", fixed: true, hidden: true, holds: "on", desc: "A plank on two brackets." },        // a surface: what's on it is listed under the room
    grounds: { name: "can of coffee grounds", at: "shelf", kind: "food", aliases: ["can"], desc: "Half full. Smells like mornings." },
    plywood: { name: "plywood", at: "shed", desc: "One sheet. Big enough for one window." },
    crowbar: { name: "crowbar", kind: "tool", desc: "Cold iron. Better than nothing." },   // the rug's level effect puts it on the floor   // no "at": offstage until the rug is searched
    mug: { name: "mug of coffee", at: "shelf", kind: "food", desc: "Cold. This morning's.",
      on: { drink: [{ if: { not: { flag: "drank" } }, set: "drank", log: "coffee", add: { "self.nerve": 4 }, say: "Cold, bitter, heroic." }, "The mug is empty."] } }
  },

  kinds: {   // replies every thing of a kind shares; {it} is the thing
    tool: { eat: { say: { rotate: ["You consider eating the {it}. Your dentist sits bolt upright in bed.", "The {it} is not food. You checked. With your teeth."] } } },
    food: { eat: "Not now. Later. If there is a later." },
    fixture: { take: "It's part of the cabin." }
  },

  recipes: [
    { with: ["plywood", "window"], if: { has: ["hammer", "nails"] }, fail: "You'll need a hammer and nails.", ...BOARD },
    { with: ["hammer", "nails"], secret: true, say: "Yes, those go together. Now find something to nail." }
  ],

  journal: {
    boarded: { text: "You boarded up the window.", add: { progress: 1 } },
    inside: { text: "You were inside when they came.", add: { progress: 1 } },
    armed: { text: "You had a crowbar in your hand.", add: { progress: 1 } },
    coffee: { aside: true, text: "You drank a mug of cold coffee, for courage." }
  },
  endings: [{ id: "overrun", name: "Overrun" }, { id: "holdout", name: "Holdout" }, { id: "dawn", name: "Dawn" }],

  events: [
    { legend: true },
    { if: "DUSK", say: "The sun touches the treetops." },
    { every: 1, if: { in: "yard", chance: 20 }, say: "An owl calls from the pines." },   // a 1-in-5 roll on each turn in the yard
    { if: { min: { turns: SUNSET - 3 } }, say: "Branches snap in the woods. Close now." },
    { if: { is: "SUNDOWN", in: "cabin" }, log: "inside" },
    { if: { is: "SUNDOWN", has: "crowbar" }, log: "armed" },
    { if: "SUNDOWN", say: "Sundown. Looking back, it was quite an evening." },
    { if: "SUNDOWN", recap: true },
    { if: { is: "SUNDOWN", min: { progress: 3 } }, ending: "dawn", end: "They try the door, the window, the door again. You hold. Dawn comes. THE END: Dawn. (Endings found: {found} of 3.)" },
    { if: { is: "SUNDOWN", min: { progress: 2 } }, ending: "holdout", end: "A long night, but you're still here. THE END: Holdout. (Endings found: {found} of 3.)" },
    { if: "SUNDOWN", ending: "overrun", end: "You should have listened to the radio. THE END: Overrun. (Endings found: {found} of 3.)" }
  ]
};
