/* ---- GAME-LOCAL ADD-ON (test fixture): also answers "ring" in a before hook. Listed after ./first.js in build.json. */
addon({ name: "second", before: v => v === "ring" ? (print("Second."), true) : undefined });
