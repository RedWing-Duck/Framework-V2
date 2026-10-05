/* ---- ADD-ON: craft (combine two things) -----------------------------------
   Data:  recipes: [ { with:["a","b"], if:COND, fail:TEXT, ...EFFECT } ]
            "combine a and b" (also "use a on b", "attach a to b") runs the first
            recipe for that pair, in either order, whose "if" passes. Each thing
            must be carried or here. If the pair has recipes but none passes, the
            first one's fail is shown. Parts aren't used up on their own: say so
            with move:{ a:null } and give:"result".
          A pair with no recipe gets the usual replies: either thing's on.combine,
          its kind's (kinds.X.combine), the room's, the game's; then "Those don't go together."
   To need tools, use the engine's has:["hammer", "nails"].
   ------------------------------------------------------------------------- */
{
  const recipes = ids => (G.recipes || []).filter(r => ids.length === 2 && ids.every(id => r.with.includes(id)));
  addon({
    name: "craft",
    commands: { combine(a, ids) { ids.filter(id => own(G.items, id)).length < 2 ? notHere("combineWhat") : print(msg("combineNo")); } },
    aliases: { attach: "combine", join: "combine", craft: "combine", mix: "combine" },
    messages: { combineWhat: "Combine what with what? Name two things you have or can see.", combineNo: "Those don't go together.", combineFail: "Something's missing." },
    meta: ["with", "fail", "hint", "secret"],
    before(v, a, ids) {   // a recipe answers before any reply, for combine and for "use a on b"
      if (v !== "combine" && v !== "use") return;
      const two = [LINE.what, LINE.with].every(id => own(G.items, id)) ? [LINE.what, LINE.with] : ids.filter(id => own(G.items, id)).slice(0, 2);   // the two slots first
      const rs = recipes(two), r = rs.find(r => test(r.if));
      if (r) return run(r), true;
      if (rs.length) return print(txt(rs[0].fail) || msg("combineFail")), true;
    },
    validate(need) {
      (G.recipes || []).forEach((r, i) => need(list(r.with).length === 2 && list(r.with).every(id => own(G.items, id)), `recipes[${i}].with`, "needs two item ids"));
    }
  });
}
