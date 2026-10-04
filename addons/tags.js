/* ---- ADD-ON: tags (colors items by what they're good for) ------------------
   Every item name printed as [id] also gets one of these classes:
     key     - items.X.tag:"key": what the goal is built from (set by hand)
     combine - part of a recipe that does something (craft add-on), or an
               item a reply needs you to carry (has: in an "on" reply's if)
     use     - answers a verb other than the senses (open, push, turn...)
     flavor  - everything else: look, listen, smell, touch, taste
   Data:  items.X.tag: "key" | "combine" | "use" | "flavor"   overrides the guess
   Command: colors (also legend; free) - shows what the colors mean. An event
            with effect legend:true shows it too (e.g. once, at the start).
   Adds its own CSS (light and dark).
   ------------------------------------------------------------------------- */
{
  const TAGS = ["key", "combine", "use", "flavor"], SENSES = ["smell", "listen", "touch", "taste", "examine", "look"];
  const combos = new Set(), real = r => Object.keys(r).some(k => !["with", "if", "fail", "say", "hint", "secret"].includes(k));   // changes something
  const tools = v => { if (v && typeof v === "object") for (const k in v) k === "has" ? list(v[k]).forEach(id => combos.add(id)) : tools(v[k]); };
  const tag = id => { const o = own(G.items, id);
    return o && (o.tag || (combos.has(id) ? "combine" : Object.keys(o.on || {}).some(v => !SENSES.includes(v)) ? "use" : "flavor")); };
  const legend = () => { const p = document.createElement("p"); p.className = "cmd"; p.append("Item colors: ");
    [["key", "key item"], ["combine", "combinable or a tool"], ["use", "usable"], ["flavor", "just scenery"]].forEach(([k, w], i) => {
      const s = document.createElement("span"); s.className = "item " + k; s.textContent = w; p.append(i ? ", " : "", s); });
    p.append(". People are blue."); out.append(p); };
  addon({
    name: "tags",
    commands: { colors: legend }, free: ["colors"], aliases: { legend: "colors" },
    effects: { legend },
    tag,
    boot() {
      for (const r of G.recipes || []) if (real(r)) r.with.forEach(id => combos.add(id));
      for (const T of [G.items, G.npcs, G.rooms]) for (const id in T || {}) for (const v in T[id].on || {}) list(T[id].on[v]).forEach(e => tools(e?.if));
      const css = document.createElement("style");
      css.textContent = `:root{--key:#8a5a00;--use:#6b4c9a;--flavor:#6b7178}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--key:#e0a84a;--use:#c3a6ff;--flavor:#8d949c}}
:root[data-theme="dark"]{--key:#e0a84a;--use:#c3a6ff;--flavor:#8d949c}
.item.key{color:var(--key);border-bottom:3px double var(--key)}
.item.use{color:var(--use);border-bottom:1px dotted var(--use)}
.item.flavor{color:var(--flavor);font-weight:400}`;
      document.head?.append(css);
    },
    validate(need) { for (const id in G.items) need(!G.items[id].tag || TAGS.includes(G.items[id].tag), `items.${id}.tag`, `tag must be one of ${TAGS.join(", ")}`); }
  });
}
