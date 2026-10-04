/* ---- GAME-LOCAL ADD-ON (test fixture): exercises the input, text, start and enter hooks
   "shout <words>" prints them in capitals; "loud" makes every line upper case until the next new game.
   Every room entered is counted in S.shout.rooms (add-on state, saved and undone with the game).
   ------------------------------------------------------------------------- */
{
  let loud = false;
  addon({
    name: "shout",
    state: { rooms: 0 },
    enter() { S.shout.rooms++; },
    commands: { shout: a => print(a.toUpperCase() + "!") },
    input: w => w[0] === "loud" ? (loud = true, true) : undefined,
    text: (t, c) => loud && c !== "cmd" ? t.toUpperCase() : t,
    start() { loud = false; }
  });
}
