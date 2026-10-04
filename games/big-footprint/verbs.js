/* ---- GAME-LOCAL ADD-ON: verbs (Big Footprint's own reading rules) ----------
   The core reads punctuation, phrasal verbs, "look under", "pick up", said:, any:
   and the literal echo. This add-on keeps the rules that are this game's design:
   Data:  bare: { word: TEXT }   the word typed alone prints TEXT, free ("show": "Show what, to whom?")
          oneAtATime: TEXT, spoken: ["say", ...]   "X and Y" does X, then prints TEXT; "take all"
            and "drop all" only print it (free). Spoken verbs keep their "and" ("say pozole and gravy").
          rooms.X.ways: { word: "direction" }   "go <word>" / "climb <word>" here means that
            direction ("stairs": "up"). Aliases that name a direction work after go too ("go upstairs").
   Condition: only:"a|b c"   every word typed after the verb is one of these words (or nothing was typed)
   Effect:    line:[part, ...]   prints the parts joined. A part is TEXT, or
              { list:[TEXT, ...], none:TEXT }: the non-empty ones joined with ", ", or none.
   Order: the room's and the game's replies (rooms.X.on, G.on) answer before ./nouns.js,
   which is the Script's reply ladder (the core would ask them after every before hook).
   ------------------------------------------------------------------------- */
{
  const BARE = Object.fromEntries(Object.entries(G.bare || {}).map(([w, t]) => [w.toLowerCase(), t]));
  const part = p => p?.list ? p.list.map(t => txt(t)).filter(Boolean).join(", ") || txt(p.none || "") : txt(p);
  let one = false;   // "X and Y" did X; say so at the end of the turn
  addon({
    name: "verbs",
    maps: { bare: "data" },
    conditions: { only: p => LINE.said.split(" ").every(w => !w || p.split("|").some(x => words(x).includes(w))) },
    effects: { line: v => print(v.map(part).join("")) },
    input(w) {
      if (w.length === 1 && own(BARE, w[0])) return print(txt(BARE[w[0]])), true;   // no command runs, so no turn
      const f = w.filter(x => !FILLER.includes(x)), v = own(ALIAS, f[0]) || f[0], and = f.indexOf("and");
      if ((v === "take" || v === "drop") && f.some(x => x === "all" || x === "everything")) return print(txt(G.oneAtATime)), true;
      if (G.oneAtATime && and > 1 && and < f.length - 1 && !(G.spoken || []).includes(v)) { one = true; return f.slice(0, and); }
    },
    before(v, a) {
      const at = a.split(" ").findIndex(w => w === "in" || w === "into");
      if (v === "drop" && at > 0) return exec("use", a.split(" ").filter((w, i) => i !== at).join(" ")), true;   // "drop coin in fountain" = use it on
      const way = (v === "go" || v === "climb") && (own(G.rooms[S.room].ways, a) || own(ALIAS, a) || (v === "climb" && isDir(a) && a));
      if (way && (way !== a || v === "climb") && isDir(way)) return exec("go", way), true;   // "go upstairs", "climb stairs"
      return reply(own(G.rooms[S.room].on, v)) || reply(own(G.on, v)) || undefined;   // the room's and the game's replies first
    },
    afterTurn() { if (one) { one = false; print(txt(G.oneAtATime)); } },
    validate(need) {
      for (const r in G.rooms) for (const w in G.rooms[r].ways || {}) need(isDir(G.rooms[r].ways[w]), `rooms.${r}.ways.${w}`, "not a direction");
    }
  });
}
