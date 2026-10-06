/* ---- GAME-LOCAL ADD-ON (test fixture): the changed and unhandled hooks.
   changed: logs every prop, counter and location change in S.watch, and reacts once to Big Tony's patience running
   out, instead of an event checking for it every turn.
   unhandled: when nothing in the game answered, "take" refuses anything with a weight prop over 20 (before the
   built-in take), and "zap" works on anything without a zap reply of its own.
   agents: while the "frozen" flag is set, nobody acts. */
addon({
  name: "watch",
  state: [],
  changed(id, key, from, to) {
    S.watch.push(`${id ?? "game"}.${key}: ${from} -> ${to}`);
    if (id === "tony" && key === "patience" && to <= 0) run({ prop: { "tony.mood": "furious" }, say: "Big Tony has had enough." });
  },
  agents: ids => S.flags.frozen ? [] : ids,
  unhandled(v, ids) {
    const id = LINE.what || ids[0];
    if (v === "take" && id && prop(`${id}.weight`) > 20) return print(txt("{The} won't budge.")), true;
    if (v === "zap" && id) return print(txt("You zap {the}. Nothing much happens.")), true;
  }
});
