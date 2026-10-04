// Game data reference: docs/AUTHORING.md
const G = {
  title: "The Damp Cell",
  intro: "You wake on cold stone. Your head aches. You need to get out.",
  start: "cell",
  rooms: {
    cell: { name: "Cell", exits: { east: "corridor", down: "cellar" },
      desc: "A cramped stone cell, damp [straw] on the floor. A trapdoor in the corner leads down. The iron door to the east hangs open a crack." },
    cellar: { name: "Cellar", dark: true, exits: { up: "cell" }, desc: [   // "dark" comes from the light add-on
      { if: { here: "bread" }, text: "A low cellar that reeks of mold. A heel of [bread] sits on a shelf." },
      "A low cellar that reeks of mold. Empty shelves line the walls." ] },
    corridor: { name: "Corridor", desc: [
      { if: { flag: "gate_open" }, text: "A torchlit corridor. The gate to the north stands wide open." },
      { if: { here: "guard" }, text: "A torchlit corridor. A [guard] slouches beside a heavy gate to the north." },
      "A torchlit corridor. A heavy gate blocks the way north." ],
      exits: { west: "cell", north: { to: "yard", if: { flag: "gate_open" }, fail: "The gate is locked tight." } } },
    yard: { name: "Courtyard", desc: "Fresh night air. The walls are behind you." }
  },
  items: {
    bread: { name: "stale bread", at: "cellar", aliases: ["loaf", "heel"], desc: "Hard as a rock, but food is food." },
    straw: { name: "straw", at: "cell", fixed: true, desc: "Damp and useless." },
    lantern: { name: "lantern", at: "corridor", light: true, desc: "An oil lantern, burning steadily." },
    key: { name: "iron key", desc: "Heavy and rusted. It might fit the gate.",
      use: [{ if: { in: "corridor", not: { flag: "gate_open" } }, say: "The key turns with a groan. The gate swings open.", set: "gate_open", mark: "gate" }] }
  },
  npcs: {
    rat: { name: "rat", at: "cell", desc: "Fat, grey, and entirely unbothered by you." },
    guard: { name: "Guard", at: "corridor", desc: [
      { if: { flag: "fed" }, text: "Crumbs on his chin. He looks almost friendly." },
      { if: { has: "bread" }, text: "Bored and clearly hungry. He keeps eyeing your [bread]." },
      "Bored and clearly hungry." ],
      dialogue: {
        start: { text: [{ if: { flag: "fed" }, text: "Thanks for the bread. Now scram." },
          { if: { min: { annoyed: 2 } }, text: "You again? Ask me that once more, I dare you." }, "What do you want, prisoner?"], options: [
          { text: "Offer the bread.", if: { has: "bread" }, take: "bread", give: "key", set: "fed", next: "thanks" },
          { text: "Let me out!", if: { not: { flag: "fed" } }, add: { annoyed: 1 }, next: "no" },
          { text: "Nothing." } ] },
        thanks: { text: "Food! ...Here. I never saw you." },
        no: { text: "Ha! Not a chance." } } }
  },
  events: [
    { mark: "rat" },
    { repeat: true, if: { since: { rat: 2 }, here: "rat" }, say: "The [rat] scurries out." },   // listed first: runs before the move
    { repeat: true, if: { since: { rat: 2 } }, mark: "rat", move: { rat: ["cell", "corridor"] },
      say: [{ if: { here: "rat" }, text: "A [rat] scurries in." }] },
    { if: { flag: "gate_open" }, say: "The [guard] shrugs and wanders off down the corridor.", move: { guard: null } },
    { if: { in: "yard" }, end: "You escaped in {turns} turns! THE END." },
    { if: { since: { gate: 2 } }, say: "Shouts echo from somewhere above. Someone heard the gate." },
    { if: { since: { gate: 4 } }, end: "Guards flood the corridor. You're caught after {turns} turns. THE END." }
  ]
};
