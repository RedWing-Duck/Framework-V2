// Game data reference: docs/AUTHORING.md
// Test game for the word layer: two slots, narrowing by a word, "the other one", "both", "all except",
// pronouns by kind, proper names, names that follow the state, narrated moves, oops, brief, transcript.
// The study holds a name with a role word in it, articles, and a proper name that shares a word with an item.
// ./first.js and ./second.js both answer "ring" in a before hook: the one listed first in build.json wins.
const G = {
  title: "Words",
  start: "kitchen",
  rooms: {
    kitchen: { name: "Kitchen", desc: "A small kitchen.", exits: { east: "hall", north: "study" } },
    study: { name: "Study", desc: "Books to the ceiling.", exits: { south: "kitchen" } },
    hall: { name: "Hall", desc: "A narrow hall.", exits: { west: "kitchen" } }
  },
  items: {
    white: { name: "white cup", aliases: ["chipped"], at: "kitchen", desc: "Chipped at the rim." },
    tea: { name: "cup of tea", at: "kitchen", desc: "Still warm." },
    letter: { name: "letter", at: "kitchen", desc: "Sealed with red wax." },
    box: { name: "box", at: "kitchen", holds: "in", closed: false, fixed: true },
    note: { name: "letter to Ana", at: "study", desc: "Addressed in pencil." },             // "to" inside a name
    map: { name: "honest map", article: "an", at: "study", desc: "It admits where it's wrong." },
    sugar: { name: "sugar", article: "some", at: "study", desc: "Sweet.",
      on: { take: "The sugar is caked to the shelf." } },   // a reply that refuses a take, typed or implicit
    toy: { name: "toy dog", aliases: ["dog"], at: "study", desc: "Stuffed." },
    lamp: { name: [{ if: { flag: "lit" }, text: "lit lamp" }, "unlit lamp"], at: "kitchen", desc: "Brass.",
      on: { light: [{ if: { flag: "lit" }, say: "It's already lit." }, { set: "lit", say: "{The} flickers on." }] } }
  },
  npcs: {
    tony: { name: "Big Tony", proper: true, pronoun: "him", at: "kitchen", desc: "Big.",
      on: { show: [{ if: { what: "letter" }, say: "{The:with} reads {the:what} and goes pale." }, "{The:with} shrugs at {the:what}."] } },
    ana: { name: "Ana", proper: true, pronoun: "her", at: "hall", desc: "Busy." },
    rex: { name: "Rex", proper: true, aliases: ["dog"], at: "study", desc: "A real dog." }
  },
  verbs: { show: { carry: true } },
  on: { weigh: "You weigh {a}. {A} is lighter than it looks.",
    whistle: { set: "walking", say: "You whistle. Ana starts pacing." },
    hit: [{ if: { with: "lamp" }, say: "You swing {the:with} at {the:what}." }, "Hit it with what?"] },
  events: [{ every: 2, if: { flag: "walking" }, move: { ana: ["hall", "kitchen"] } }]
};
