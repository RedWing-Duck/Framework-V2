/* ---- GAME-LOCAL ADD-ON (test fixture): answers "ring" in a before hook. Listed before ./second.js in build.json. */
addon({ name: "first", commands: { ring: () => print("Nothing rings.") }, before: v => v === "ring" ? (print("First."), true) : undefined });
