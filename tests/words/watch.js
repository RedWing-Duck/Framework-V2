/* ---- GAME-LOCAL ADD-ON (test fixture): the changed hook. Logs every prop, counter and location change in S.watch,
   and reacts once to Big Tony's patience running out, instead of an event checking for it every turn. */
addon({
  name: "watch",
  state: [],
  changed(id, key, from, to) {
    S.watch.push(`${id ?? "game"}.${key}: ${from} -> ${to}`);
    if (id === "tony" && key === "patience" && to <= 0) run({ prop: { "tony.mood": "furious" }, say: "Big Tony has had enough." });
  }
});
