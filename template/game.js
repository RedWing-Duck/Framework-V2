// Game data reference: docs/AUTHORING.md
// Starter game: copy this folder to games/<name>/, then replace everything below.
const G = {
  title: "My Game",                          // start menu heading and browser tab
  intro: "You arrive at a small toll gate.", // printed once when a new game starts
  start: "gate",                             // room the player starts in

  rooms: {
    gate: { name: "Toll Gate", exits: {},    // exits: { north: "otherRoom" }
      // A text variant: the first entry whose "if" passes is shown; a plain string is the fallback.
      // [id] tags an item or NPC by id so it shows up highlighted.
      desc: [
        { if: { here: "coin" }, text: "A narrow gate with a [keeper] beside it. A [coin] glints in the dust." },
        "A narrow gate with a [keeper] beside it." ] }
  },

  items: {
    coin: { name: "copper coin", at: "gate", aliases: ["copper"], desc: "Worn smooth. Enough for a toll." }
  },

  npcs: {
    keeper: { name: "Gatekeeper", at: "gate", desc: "Arms folded, palm out.",
      dialogue: {                            // "start" is the first node
        start: { text: "Toll's one coin.", options: [
          { text: "Pay the toll.", if: { has: "coin" }, take: "coin", set: "paid", next: "thanks" },
          { text: "Maybe later." } ] },       // no "next" ends the conversation
        thanks: { text: "Pleasure doing business." } } }
  },

  events: [                                  // checked after every command; each fires once
    { if: { flag: "paid" }, say: "The [keeper] swings the gate open.", end: "You're through in {turns} turns. THE END." }
  ]
};
