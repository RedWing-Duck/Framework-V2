/* ---- ADD-ON: endings (remember which endings a player has found) ----------
   Data:  endings: [ { id, name }, ... ]   every ending, in order (worst first)
   Effect: ending:"id"   records that ending as found (put it next to "end")
           and sets the counter "found" to how many are found, for {found} in text.
   The start menu shows "Endings found: N of M" and the names found so far.
   Found endings are kept with the engine's store(), so they survive closing
   the page; without storage they last until the page closes.
   ------------------------------------------------------------------------- */
{
  const E = () => G.endings || [], used = new Set();
  let found = [], line;
  const show = () => { if (line) line.textContent = `Endings found: ${found.length} of ${E().length}` +
    (found.length ? " · " + E().filter(e => found.includes(e.id)).map(e => e.name).join(" · ") : ""); };
  addon({
    name: "endings",
    boot() {   // only known ids count, each once (the storage could hold anything)
      const saved = load("endings");
      found = Array.isArray(saved) ? [...new Set(saved)].filter(id => E().some(e => e.id === id)) : [];
      line = document.createElement("p"); line.className = "cmd"; $("menu").append(line); show();
    },
    effects: { ending: id => { if (!found.includes(id)) { found.push(id); store("endings", found); show(); } S.count.found = found.length; } },
    refs: { ending: (v, need) => { used.add(v); need(E().some(e => e.id === v), `no ending "${v}" in endings`); } },
    validate(need) { E().forEach((e, i) => need(used.has(e.id), `endings[${i}]`, `"${e.id}" is never reached (no ending:"${e.id}" effect)`)); }
  });
}
