/* ---- ADD-ON: light & darkness --------------------------------------------
   Data:  rooms.X.dark:  true, or a COND (dark only while it passes)
          items.X.light: true, or a COND (gives light only while it passes)
                         e.g. light:{ flag:"lamp_lit" } with a "use" that sets it
   In the dark (dark room, no light source carried or in the room) the player
   can only reach what they carry (the reach hook), so no verb finds anything
   else. Looking, or a hands-on command that finds nothing (take, take all,
   open, examine, use, put, talk, give, show, or any verb a thing has a reply
   for, and "talk" alone), says it's dark instead of "You don't see that here."
   With light, the
   usual messages. Speaking, moving and dropping what you carry are untouched.
   Condition: dark:true / dark:false - is the player in darkness right now?
   Messages (reword in G.messages): dark, darkFalls.
   ------------------------------------------------------------------------- */
{
  const holds = v => v === true || (!!v && typeof v === "object" && test(v));
  // verbs that need to see what they touch: the built-ins, and any verb a thing or a kind has a reply for
  const HANDS = ["take", "put", "open", "close", "examine", "use", "talk", "give", "show"];
  const hands = v => HANDS.includes(v) || [...Object.values(G.items), ...Object.values(G.npcs)].some(t => own(t.on, v)) || Object.values(G.kinds || {}).some(k => own(k, v));
  const inDark = () => holds(G.rooms[S.room].dark) && ![...inv(), ...at(G.items)].some(id => holds(G.items[id].light));
  addon({
    name: "light",
    state: { room: null, dark: false },
    messages: { dark: "It's pitch dark. You can't see a thing.", darkFalls: "Everything goes dark." },
    conditions: { dark: v => inDark() === v },
    reach: ids => inDark() ? ids.filter(id => id === "self" || where(id) === "player") : ids,   // only what you carry
    before(v, a, ids) {   // look, or a hands-on command that found nothing it can reach: it's the dark's fault
      if (inDark() && (v === "look" || (v === "talk" && !a) || (a && !ids.length && v !== "drop" && (hands(v) || named(a, [...nested(at(G.items)), ...at(G.npcs)]).length))))
        return print(msg("dark")), true;
    },
    afterTurn() {   // light appears or vanishes while you stand still: reveal or hide the room
      const d = inDark(), L = S.light;
      if (L.room === S.room && L.dark !== d) d ? print(msg("darkFalls")) : exec("look");
      L.room = S.room; L.dark = d;
    },
    validate(need) {
      const any = Object.values(G.items).some(i => i.light);
      for (const r in G.rooms) need(!G.rooms[r].dark || any, `rooms.${r}.dark`, 'dark room, but no item has "light"');
    }
  });
}
