/* ---- GAME-LOCAL ADD-ON (test fixture): exercises the input, text and start hooks
   "shout <words>" prints them in capitals; "loud" makes every line upper case until the next new game.
   ------------------------------------------------------------------------- */
{
  let loud = false;
  addon({
    name: "shout",
    commands: { shout: a => print(a.toUpperCase() + "!") },
    input: w => w[0] === "loud" ? (loud = true, true) : undefined,
    text: (t, c) => loud && c !== "cmd" ? t.toUpperCase() : t,
    start() { loud = false; }
  });
}
