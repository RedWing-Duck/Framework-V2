/* ---- ADD-ON: light & darkness --------------------------------------------
   Data:  rooms.X.dark:  true, or a COND (dark only while it passes)
          items.X.light: true, or a COND (gives light only while it passes)
                         e.g. light:{ flag:"lamp_lit" } with a "use" that sets it
   In the dark (dark room, no light source carried or in the room) the player
   can't look, take, or examine anything they aren't carrying.
   Condition: dark:true / dark:false - is the player in darkness right now?
   ------------------------------------------------------------------------- */
{
  const holds = v => v === true || (!!v && typeof v === "object" && test(v));
  const inDark = () => holds(G.rooms[S.room].dark) && ![...inv(), ...at(G.items)].some(id => holds(G.items[id].light));
  addon({
    name: "light",
    state: { room: null, dark: false },
    conditions: { dark: v => inDark() === v },
    before(v, a) {
      if (inDark() && (v === "look" || v === "take" || (v === "examine" && !find(a, inv(), G.items))))
        return print("It's pitch dark. You can't see a thing."), true;
    },
    afterTurn() {   // light appears or vanishes while you stand still: reveal or hide the room
      const d = inDark(), L = S.light;
      if (L.room === S.room && L.dark !== d) d ? print("Everything goes dark.") : exec("look");
      L.room = S.room; L.dark = d;
    },
    validate(need) {
      const any = Object.values(G.items).some(i => i.light);
      for (const r in G.rooms) need(!G.rooms[r].dark || any, `rooms.${r}.dark`, 'dark room, but no item has "light"');
    }
  });
}
