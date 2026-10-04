/* ---- ADD-ON: journal (what the player did, retold as a story) -------------
   Data:  journal: { key: { text:TEXT, aside:true, ...EFFECT } }
            text  = one past-tense line: "You boarded up the front window."
            aside = a side note (a gag); retold after the main story
            EFFECT runs once, when the entry is first logged, e.g. add:{ progress:1 }
   Effects:   log:"key"   record the entry once, in the order it happened
              recap:true  print the story so far: the main lines, then the asides
   Condition: logged:"key" - that entry has been recorded
   Command:   journal (also notes, diary; free) - the story so far
   ------------------------------------------------------------------------- */
{
  const J = k => own(G.journal, k);
  const recap = () => {
    const main = S.journal.filter(k => !J(k).aside).map(k => txt(J(k).text)), side = S.journal.filter(k => J(k).aside).map(k => txt(J(k).text));
    if (!main.length && !side.length) return print(msg("journalNone"));
    if (main.length) print(main.join(" "));
    if (side.length) print(msg("journalAside", { list: side.join(" ") }));
  };
  const known = (v, need) => need(J(v), `no journal entry "${v}"`);
  addon({
    name: "journal",
    state: [],
    commands: { journal: recap },
    free: ["journal"],
    aliases: { notes: "journal", diary: "journal" },
    messages: { journalNone: "Nothing worth writing down. Yet.", journalAside: "For the record: {list}" },
    maps: { journal: "data" },
    meta: ["aside"],
    conditions: { logged: k => list(k).every(k => S.journal.includes(k)) },
    effects: { log: k => list(k).forEach(k => { if (!S.journal.includes(k)) { S.journal.push(k); run(J(k)); } }), recap },
    refs: { log: (v, need) => list(v).forEach(k => known(k, need)), logged: (v, need) => list(v).forEach(k => known(k, need)) },
    validate(need) { for (const k in G.journal || {}) need(G.journal[k].text, `journal.${k}.text`, "needs a text"); }
  });
}
