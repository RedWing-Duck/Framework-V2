/* ---- ADD-ON: hints ("what could I do right here, right now?") ------------
   Effect: hints:TEXT   prints TEXT, then "Ideas: ..." built from what the player
           carries and what's in the room:
             - recipes (craft add-on) whose two parts are in reach and whose
               "if" passes right now: "combine the X and the Y"
             - verbs in items.X.on / npcs.X.on whose first passing entry would
               change something (not just say, log or free): "open the X"
           Senses are never suggested, and neither is anything marked secret.
   Data:  secret:true on a recipe or reply entry keeps it out of the ideas
          (gags players should stumble on). hint:TEXT replaces the suggested
          wording, e.g. to warn: "push the [chest] against the door (seals you in)".
   Use it on a free verb, e.g. self:{ on:{ think:{ hints:"You take stock..." } } }.
   ------------------------------------------------------------------------- */
{
  const SENSES = ["smell", "listen", "touch", "taste", "examine", "look"], QUIET = ["if", "say", "log", "free", "with", "fail", "secret", "hint"];
  const does = e => !!e && typeof e === "object" && !e.secret && Object.keys(e).some(k => !QUIET.includes(k));   // would change something
  const first = r => list(r ?? []).find(x => typeof x === "string" || (x && test(x.if)));
  const body = e => JSON.stringify(Object.fromEntries(Object.entries(e).filter(([k]) => !["if", "with", "fail", "hint"].includes(k))));
  const ideas = () => {
    const reach = [...inv(), ...at(G.items)], seen = new Set(), found = [];
    const add = (e, text) => { const b = body(e); if (!seen.has(b)) { seen.add(b); found.push(text); } };
    for (const r of G.recipes || []) if (r.with.every(id => reach.includes(id)) && test(r.if) && does(r)) add(r, r.hint || `combine the [${r.with[0]}] and the [${r.with[1]}]`);
    for (const id of [...reach, ...at(G.npcs)]) for (const v in thing(id).on || {}) if (!SENSES.includes(v)) {
      const e = first(thing(id).on[v]); if (does(e)) { add(e, e.hint || `${v} the [${id}]`); break; } }   // one idea per thing
    return found;
  };
  addon({
    name: "hints",
    messages: { ideas: "Ideas: {list}.", noIdeas: "Ideas: nothing here jumps out at you. Look around, or try somewhere else." },
    meta: ["hint", "secret"],
    effects: { hints: t => { print(txt(t)); const i = ideas(); print(i.length ? msg("ideas", { list: i.join("; ") }) : msg("noIdeas")); } }
  });
}
