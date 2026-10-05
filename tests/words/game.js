// Game data reference: docs/AUTHORING.md
// Test game for the word layer: two slots, narrowing by a word, "the other one", "both", "all except",
// pronouns by kind, proper names, names that follow the state, narrated moves, oops, brief, transcript;
// replies in slot order (the letter's own "show" vs Big Tony's); up and down in the hall (look up / look down, level).
// The study holds a name with a role word in it, articles, and a proper name that shares a word with an item.
// ./first.js and ./second.js both answer "ring" in a before hook: the one listed first in build.json wins.
const G = {
  title: "Words",
  start: "kitchen",
  rooms: {
    kitchen: { name: "Kitchen", desc: "A small kitchen.", exits: { east: "hall", north: "study" } },
    study: { name: "Study", desc: "Books to the ceiling.", exits: { south: "kitchen" } },
    hall: { name: "Hall", desc: "A narrow hall.", exits: { west: "kitchen" }, up: "Cobwebs on the beams.", down: "Bare boards." }
  },
  items: {
    white: { name: "white cup", aliases: ["chipped"], at: "kitchen", desc: "Chipped at the rim." },
    tea: { name: "cup of tea", at: "kitchen", desc: "Still warm." },
    letter: { name: "letter", at: "kitchen", desc: "Sealed with red wax.",
      on: { show: "You wave {the} around. Nobody reads it." } },   // Big Tony, the second slot, answers before it
    box: { name: "box", at: "kitchen", holds: "in", closed: false, fixed: true },
    note: { name: "letter to Ana", at: "study", desc: "Addressed in pencil." },             // "to" inside a name
    map: { name: "honest map", article: "an", at: "study", desc: "It admits where it's wrong." },
    sugar: { name: "sugar", article: "some", at: "study", desc: "Sweet.",
      on: { take: "The sugar is caked to the shelf." } },   // a reply that refuses a take, typed or implicit
    kite: { name: "kite", at: "hall", level: "up", desc: "A paper kite, caught on a beam." },   // up: "look up" shows it; dropped, it lands down
    hook: { name: "hook", at: "hall", fixed: true, hidden: true, level: [{ if: { flag: "fallen" }, text: "down" }, "up"], desc: "An iron hook." },   // the level follows the state
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
    shake: [{ if: { level: { kite: "up" }, in: "hall" }, level: { kite: "down" }, say: "You shake the beam. The kite drops." }, "Nothing falls."],
    yank: { set: "fallen", say: "The hook comes loose." },
    hit: [{ if: { with: "lamp" }, say: "You swing {the:with} at {the:what}." }, "Hit it with what?"] },
  events: [{ every: 2, if: { flag: "walking" }, move: { ana: ["hall", "kitchen"] } }]
};
