/* ---- GAME-LOCAL ADD-ON: nouns (Big Footprint's Script tables) --------------
   The Script (games/big-footprint/design) writes scenery as "nouns" with line
   tables, and its whole penthouse runs on two phases: TOUR (the Don shows you
   around; touching things earns strikes) and ESCAPE (Big Tony's clock, guard
   checkpoints, turn feedback). Those are this game's rules, so they live here,
   built only from the add-on hooks.
   Data:  conds: { NAME: COND }   the core's named conditions. A key string here is NAME,
            !NAME, or several joined by "&" ("ESCAPE&!P1"); null always passes. Condition key:"...".
          LINES = [[key, text, obj?, "free"?], ...]   the LAST line whose key passes wins.
            obj: the line needs these words typed too ("coins", "a|b"). "free": costs no turn.
          nouns: { id: { at: room | "any", cat, words:[...], strike?:"NAME", puzzle?:"KEY",
                         examine: LINES, <verb>: LINES } }
            A noun can be seen only while one of its examine lines passes.
          items.X / npcs.X: cat, strike, puzzle (same meaning, for things the engine owns)
          categories: { CAT: { verb: LINES } }   "*" = any verb; key "SOLVED" = the noun's puzzle key
          anywhere: { verb: LINES }   any noun or none, when nothing more specific fits
          alone:    { verb: LINES }   the verb typed with no noun (after the room's own line)
          rooms.X.verbs: { verb: LINES }   the verb with no noun, in that room
          rooms.X.words: [...], rooms.X.again: LINES   "examine <room next door>" prints
            "Through the doorway: " + throughDoor(room), or its revisit (TOUR) or again (ESCAPE) text
          groups: { verb: ["other", ...] }   more keys to try for a verb ("push": ["handle"])
          strike: EFFECT, strikeVerbs: [...], strikeWith: [...]   during TOUR, a strike verb
            (noting STRIKE3_BY = the thing's strike name, STRUCK = its id) on a thing with
            "strike" runs the strike effect (strikeWith verbs: a strike thing named anywhere in the line)
          tourFree: true   commands this add-on answers cost no turn while TOUR passes
          tails: { room: [{ key, text, group?, once?, top? }, ...] }   ESCAPE: extra lines after
            the room's description (one per group; once: once a game; top: printed first).
            They wait for the end of the turn (and print only if KEY still passes), then the band line: at most G.extras lines,
            counting any of G.npcLines printed that turn. No band line on a turn where one of
            G.warnings prints; no turn feedback then either.
          bands: { rooms: { room: TYPE }, lines: { KEY: { TYPE: [TEXT, TEXT] } } }   one line after
            the tails, from the first passing KEY; each cell alternates its two lines
          feedback: [TEXT, ...], nowhere: TEXT   ESCAPE: after a turn-costing reply that changed
            nothing (a category or anywhere line, the "nothing" message, G.nowhere, or an effect
            with feedback:true), the next line, in turn. Walking into a wall (G.nowhere) always costs a turn.
          reactions: { id: TEXT }, reactIf: COND   printed after the FIRST look at id while reactIf passes
          caught: { if: COND, by: (verb, words) => value }   while "if" passes, a command that costs a
            turn and nothing earlier answered does nothing but note CAUGHT_BY = by(...)
          npcs.X.topics (the core's)   "ask/tell" go to the core while someone here has topics, even at a
            checkpoint; "say <words>" with no reply of its own: "ask" if the words name a topic, else "talk"
          lookCloser: { prefix: TEXT, room: roomId => [TEXT, ...] }   "examine X" that finds nothing: the
            first sentence naming X in the room's text, its things' lines, or anything printed since you
            walked in (not the engine's own lines), after prefix. Only then "not here".
          firstLook: { id: TEXT }   replaces the examine text the first time id is examined
          report: { lines: [[part, ...], ...], after: TEXT, counted: [ids], bonus: [ids] }   printed
            inside every ending's block: a part is TEXT or { list:[TEXT, ...], none:TEXT }. {examined} /
            {examinable} count first looks at nouns and the counted ids; bonus ids count apart, {bonus} / {bonuses}.
   Effects: note:{ name: value } (condition noted:{ name: value }); feedback:true (see above);
            finish:TEXT   ends the game like end:, with the run report inside the ending's block.
   Matching reads the words as typed (LINE.said: the core's filler words dropped, particles kept).
   The longest phrase typed wins. A room noun beats an "any" noun and an item of the
   same length; an NPC in the room beats a noun of the same length. When nothing matches, the
   core answers its own commands; this add-on's verbs say the core's notHere (free).
   ------------------------------------------------------------------------- */
{
  const lc = o => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k.toLowerCase(), v]));
  const GR = G.groups || {};
  const N = Object.fromEntries(Object.entries(G.nouns || {}).map(([id, n]) => [id, lc(n)]));
  const CAT = Object.fromEntries(Object.entries(G.categories || {}).map(([c, t]) => [c, lc(t)]));
  const ANY = lc(G.anywhere), ALONE = lc(G.alone), RV = Object.fromEntries(Object.keys(G.rooms).map(r => [r, lc(G.rooms[r].verbs)]));
  const norm = s => ` ${s.toLowerCase().replace(/-/g, " ").replace(/\s+/g, " ").trim()} `;
  const has = (arg, phrase) => norm(arg).includes(norm(phrase));
  const key = k => !k || k.split("&").every(p => p[0] === "!" ? !test(own(G.conds, p.slice(1))) : test(own(G.conds, p)));
  let noun = null;   // the noun being answered (for the SOLVED key)
  const pick = (L, arg = "") => [...(L || [])].reverse().find(([k, , obj]) =>
    key(k === "SOLVED" || k?.includes("SOLVED") ? k.replace("SOLVED", noun?.puzzle || "ESCAPE") : k) && (!obj || obj.split("|").some(o => has(arg, o))));
  const visible = id => { const n = N[id]; return (n.at === S.room || n.at === "any") && !!pick(n.examine); };
  const phrases = T => id => [nm(id), ...(T[id].aliases || []), ...nm(id).split(" ")];   // nm(): the name now (it can follow the state)
  // every thing the line names: [{ id, kind, len, pos, rank }]
  const scan = arg => {
    const a = norm(arg), hits = [];
    const add = (id, kind, ps, rank) => ps.forEach(p => { const i = a.indexOf(norm(p)); if (i >= 0) hits.push({ id, kind, len: p.split(" ").length, pos: i, rank }); });
    Object.keys(N).filter(visible).forEach(id => add(id, "noun", N[id].words, N[id].at === "any" ? 1 : 3));
    [...inv(), ...at(G.items)].forEach(id => add(id, "item", phrases(G.items)(id), 2));
    at(G.npcs).forEach(id => add(id, "npc", phrases(G.npcs)(id), 4));
    // things somewhere else: only a longer phrase than anything here can pick them ("jaguar gate" in the enclosure)
    Object.keys(N).filter(id => !visible(id)).forEach(id => add(id, "away", N[id].words, 0));
    Object.keys(G.items).filter(id => S.loc[id] !== "player" && S.loc[id] !== S.room).forEach(id => add(id, "away", [nm(id), ...(G.items[id].aliases || [])], 0));
    return hits;
  };
  const best = hits => hits.sort((x, y) => y.len - x.len || y.rank - x.rank)[0];
  const thingOf = h => h.kind === "noun" ? N[h.id] : h.kind === "item" ? G.items[h.id] : G.npcs[h.id];
  const CORE = ["take", "drop", "examine", "use", "talk", "go", "look", "wait"];   // the core has its own "not here" for these
  let verb = "";
  const refund = () => EFFECT.free(true);
  const tourFree = () => G.tourFree && key("TOUR");
  const say = (line, dull) => { if (!line) return false; print(txt(line[1])); if (line[3] === "free" || tourFree()) refund(); else if (dull) feedback(); return true; };
  const verbKeys = v => [v, ...(GR[v] || []), "*"];
  const lines = (T, v, arg) => { for (const k of verbKeys(v)) { const l = pick(T?.[k], arg); if (l) return l; } };
  // "examine <room next door>"
  const nextDoor = a => {
    const ex = G.rooms[S.room].exits || {}, to = Object.values(ex).map(x => typeof x === "string" ? x : x.to);
    const r = to.find(r => (G.rooms[r].words || []).some(w => has(a, w)));
    if (!r) return false;
    const rv = G.rooms[r].revisit, t = G.throughDoor ? G.throughDoor(r)   // the game's own view through the doorway
      : key("ESCAPE") ? pick(G.rooms[r].again)?.[1] : typeof rv === "string" || Array.isArray(rv) ? txt(rv) : "";
    return !!t && (print("Through the doorway: " + txt(t)), true);
  };
  // "examine <a word the room's text used>": that sentence, looked at closer
  const wordsOf = s => ` ${s.replace(/\[(\w+)\]/g, (m, id) => thing(id) ? nm(id) : id).toLowerCase().replace(/'s\b/g, "").replace(/[^\p{L}\p{N}' ]+/gu, " ").replace(/\s+/g, " ")} `;   // "mama" finds "Mama's"
  let heard = [];
  const SYS = new Set(JSON.stringify(G.messages || {}).match(/"(?:[^"\\]|\\.)*"/g)?.map(q => JSON.parse(q)) || []);   // the engine's own lines, as reworded
  const closer = a => {
    const C = G.lookCloser, x = a.toLowerCase().trim();
    if (!C || x.length < 3) return false;
    const was = noun, texts = [...C.room(S.room), ...(heard.room === S.room ? heard : [])];
    for (const id in N) if (N[id].at === S.room) { noun = N[id]; for (const v of ["examine", "smell", "listen"]) texts.push(pick(N[id][v])?.[1]); }
    noun = was;
    for (const v of ["smell", "listen"]) texts.push(pick(RV[S.room][v])?.[1]);
    [...at(G.items), ...at(G.npcs)].forEach(id => texts.push((G.items[id] || G.npcs[id]).desc));
    const stem = x.replace(/e?s$/, ""), forms = [x, x + "s", x + "es", stem].map(f => ` ${f} `).concat(stem.length >= 5 ? [` ${stem}`] : []);   // "sparks": "sparking"
    const hit = texts.map(t => t && txt(t)).filter(Boolean).flatMap(t => t.split(/(?<=[.!?]["”]?)\s+|\n+/))
      .find(t => forms.some(f => wordsOf(t).includes(f)));
    return !!hit && (print(txt(C.prefix) + hit), true);
  };
  const MINE = new Set(["ask", "tell", ...Object.values(N).flatMap(n => Object.keys(n)), ...Object.values(CAT).flatMap(Object.keys),
    ...Object.keys(ANY), ...Object.keys(ALONE), ...Object.values(RV).flatMap(Object.keys),
    ...(G.strikeVerbs || [])].filter(v => !["at", "cat", "words", "strike", "puzzle", "examine", "*", "handle", "feed"].includes(v)));
  // band lines alternate inside each cell (S.nouns.turn keeps the place)
  const rotate = L => { const k = JSON.stringify(L[0]).slice(0, 60), n = S.nouns.turn[k] || 0; S.nouns.turn[k] = n + 1; return L[n % L.length]; };
  // the run report goes inside the ending's block (G.report)
  const BONUS = G.report?.bonus || [], COUNTED = [...Object.keys(N), ...(G.report?.counted || [])].filter(id => !BONUS.includes(id));
  const part = p => p?.list ? p.list.map(t => txt(t)).filter(Boolean).join(", ") || txt(p.none || "") : txt(p);
  const finish = v => {
    if (!G.report) return EFFECT.end(v);
    S.count.examined = S.nouns.seen.filter(id => COUNTED.includes(id)).length; S.count.examinable = COUNTED.length;
    S.count.bonus = S.nouns.seen.filter(id => BONUS.includes(id)).length; S.count.bonuses = BONUS.length;
    const rep = G.report.lines.map(l => l.map(part).join("")).filter(Boolean).join("\n");
    EFFECT.end([{ text: txt(v) + "\n\n" + rep + txt(G.report.after || "") }]);
  };
  let fb = false, extras = null, npcLines = 0, warned = false;
  const feedback = force => { if (G.feedback && key("ESCAPE") && (force || !isFree(verb))) fb = true; };   // printed at the end of the turn
  // after the room text in ESCAPE: tails, then Big Tony's band line
  const band = () => { const B = G.bands, type = B?.rooms[S.room], k = type && Object.keys(B.lines).find(key);
    return k && B.lines[k][type] && txt(rotate(B.lines[k][type])); };
  const tails = () => {
    if (!key("ESCAPE")) return;
    const done = new Set(), list = [];
    for (const T of G.tails?.[S.room] || []) {
      const id = S.room + ":" + T.text.slice(0, 30);
      if (!key(T.key) || (T.group && done.has(T.group)) || (T.once && S.nouns.once.includes(id))) continue;
      if (T.group) done.add(T.group);
      list.push({ ...T, id });
    }
    extras = [...list.filter(T => T.top), ...list.filter(T => !T.top)];   // checkpoint lines first, then marks, then the band
  };
  const endTurn = () => {
    if (extras) {
      let room = (G.extras ?? 9) - npcLines;
      for (const T of extras) { if (room <= 0) break; if (!key(T.key)) continue;   // still true after this turn's events (an animal may have left)
        if (T.once) S.nouns.once.push(T.id); print(txt(T.text)); room--; }
      const b = room > 0 && !warned && band(); if (b) print(b);
    }
    if (fb && !warned) print(txt(rotate(G.feedback)));
    extras = null; fb = false; npcLines = 0; warned = false;
  };
  const react = id => { const first = !S.nouns.seen.includes(id);
    if (first) S.nouns.seen.push(id);
    if (first && G.reactions?.[id] && test(G.reactIf)) print(txt(G.reactions[id])); };
  // someone here who answers "ask/tell X about Y" with the core's npcs.X.topics
  const asked = () => at(G.npcs).find(id => G.npcs[id].topics);
  const commands = {};
  for (const v of MINE) if (!own(CMDS, v)) commands[v] = () => print(msg("huh"));   // the before hook answers first
  const mine = v => MINE.has(v) || ["examine", "go", "wait", "say", "talk"].includes(v);
  function answer(v, a) {
    noun = null; verb = v;
    if ((v === "ask" || v === "tell") && asked()) return;   // the core's topics answer
    if (v === "say") {   // no question or checkpoint answered it: a topic if it names one, else talk
      const n = asked(); if (!n) return;
      const named = Object.keys(G.npcs[n].topics).some(k => k !== "*" && k.split("|").some(w => has(a, w)));
      return exec(named ? "ask" : "talk", named ? `${n} about ${a}` : n), true;
    }
    if (v === "wait") return key("ESCAPE") && say(pick(ANY.wait));
    if (!a) {   // the verb alone: this room's line, then the lone-verb line, then anywhere
      if (v === "examine" || v === "go") return;
      if (v === "listen" && !pick(RV[S.room][v]) && key("ESCAPE")) { const b = band(); if (b) return print(b), true; }
      const mineLine = pick(RV[S.room][v]);
      return mineLine ? say(mineLine) : say(pick(ALONE[v]) || pick(ANY[v]), true);
    }
    if (v === "go" && (isDir(a) || own(G.rooms[S.room].exits, a))) return;
    const hits0 = scan(a), found = best([...hits0]), hits = hits0.filter(x => x.kind !== "away"), h = found?.kind === "away" ? null : found;
    if (!h) {
      if (v === "examine" && (nextDoor(a) || closer(a))) return true;
      const r = !found && pick(RV[S.room][v], a);
      if (r && r[2]) return say(r);                     // "swim in the fountain": a room line that names its own object
      if ((v === "listen" || v === "smell") && !found) return answer(v, "");   // "listen to the wind": the room's line
      if (CORE.includes(v) && !found) return;   // the core answers its own commands
      return print(msg("notHere")), refund(), true;
    }
    const t = thingOf(h);
    // two of the core's things fit the words equally ("gate" on the roof): the core asks "Which do you mean?"
    if (h.kind !== "noun" && hits.some(x => x.kind !== "noun" && x.id !== h.id && x.len === h.len && x.rank === h.rank)) return;
    // strikes: a strike verb on a strike thing while the Don is watching
    if (key("TOUR") && G.strike) {
      const target = (G.strikeWith || []).includes(v) ? hits.find(x => thingOf(x).strike) : t.strike && h;
      if (target && ((G.strikeVerbs || []).includes(v) || (G.strikeWith || []).includes(v))) {
        S.nouns.notes.STRIKE3_BY = thingOf(target).strike;   // what caused it (for the L1 opener)
        S.nouns.notes.STRUCK = target.id;                    // and the thing itself
        run(G.strike); if (tourFree()) refund(); return true; }
    }
    if (v === "talk") return h.kind === "noun" ? say(lines(t, "talk", a) || lines(CAT[t.cat], "talk", a) || [null, "Nobody by that name around.", null, "free"]) : undefined;
    if (h.kind !== "noun" && v === "examine") {   // items and NPCs: the core's own lines (or a first-look close-up)
      const close = G.firstLook?.[h.id] && !S.nouns.seen.includes(h.id);
      react(h.id); return close ? (print(txt(G.firstLook[h.id])), true) : undefined; }
    if (h.kind !== "noun" && (own(t.on, v) || own(own(G.kinds, t.kind), v))) return;   // its own reply, or its kind's: the core's
    if (h.kind !== "noun" && !MINE.has(v) && v !== "go") return;
    if (h.kind === "noun") noun = t;
    if (v === "examine") { say(pick(t.examine)); react(h.id); return true; }
    const vv = v === "go" ? "enter" : v;
    const mineLine = h.kind === "noun" && (lines(t, vv, a) || (v === "go" && lines(t, "go", a)));
    if (mineLine) return say(mineLine);
    const line = lines(CAT[t.cat], v === "go" ? "push" : vv, a) || lines(ANY, vv, a);
    if (line) return say(line, true);
    if (v === "go") return exec("push", a), true;
    return say([null, msg("nothing")], true);
  }
  addon({
    name: "nouns",
    commands,
    state: { turn: {}, notes: {}, seen: [], once: [] },
    maps: { nouns: "def", categories: "def", anywhere: "data", alone: "data", tails: "data", reactions: "data" },
    meta: ["key"],
    conditions: { key: v => key(v), noted: o => Object.entries(o).every(([k, v]) => S.nouns.notes[k] === v) },
    effects: { note: o => Object.assign(S.nouns.notes, o), feedback: () => feedback(true), finish },
    // the room's look: in ESCAPE, its tails and band line wait for the end of the turn
    before(v, a) {
      if (v === "look" && (!a || ["around", "room", "here"].includes(a))) tails();
      // a checkpoint: anything that costs a turn and reached here fails it. Note why, and let CAUGHT say it
      if (G.caught && test(G.caught.if) && !isFree(v) && !((v === "ask" || v === "tell") && asked())) return (S.nouns.notes.CAUGHT_BY ??= G.caught.by(v, a)), true;
      if (mine(v)) return answer(v, LINE.said);   // the words as typed: particles stay ("examine down there")
    },
    // what was read in this room (for lookCloser), and the lines that shape the end of the turn
    text(t, c) {
      if (t === G.nowhere) {   // walking into a wall costs a turn (the core makes it free), and in ESCAPE earns feedback
        if (TURN.free) { TURN.free = false; S.count.turns++; }
        feedback(true);
      }
      if ((G.warnings || []).includes(t)) warned = true;
      if ((G.npcLines || []).includes(t)) npcLines++;
      if (c !== "cmd" && /\p{Ll}/u.test(t) && !SYS.has(t) && !t.startsWith("Through the doorway: ") && !t.startsWith(G.lookCloser?.prefix || "\0")) {
        if (heard.room !== S.room) heard = Object.assign([], { room: S.room });
        heard.push(t); }
      return t;
    },
    afterTurn: endTurn,
    validate(need) {
      const check = (k, p) => k && k.split("&").forEach(x => { x = x.replace(/^!/, ""); need(x === "SOLVED" || own(G.conds, x), p, `no condition "${x}" in conds`); });
      const walk = (L, p) => (L || []).forEach((l, i) => { check(l[0], `${p}[${i}]`); need(l[1] && (typeof l[1] === "string" || typeof l[1] === "object"), `${p}[${i}]`, "needs text");
        [...JSON.stringify(l[1]).matchAll(/\[(\w+)\]/g)].forEach(m => need(thing(m[1]), `${p}[${i}]`, `[${m[1]}] is not an item or NPC`)); });
      for (const id in N) { const n = N[id];
        need(n.at === "any" || own(G.rooms, n.at), `nouns.${id}.at`, `no room "${n.at}"`);
        need(n.cat in CAT, `nouns.${id}.cat`, `no category "${n.cat}"`);
        need((n.words || []).length, `nouns.${id}.words`, "needs words");
        for (const v in n) if (Array.isArray(n[v]) && v !== "words") walk(n[v], `nouns.${id}.${v}`); }
      for (const c in CAT) for (const v in CAT[c]) walk(CAT[c][v], `categories.${c}.${v}`);
      for (const T of ["anywhere", "alone"]) for (const v in G[T] || {}) walk(G[T][v], `${T}.${v}`);
      for (const r in G.rooms) { for (const v in G.rooms[r].verbs || {}) walk(G.rooms[r].verbs[v], `rooms.${r}.verbs.${v}`); walk(G.rooms[r].again, `rooms.${r}.again`); }
      for (const r in G.tails || {}) G.tails[r].forEach((T, i) => check(T.key, `tails.${r}[${i}].key`));
    }
  });
}
