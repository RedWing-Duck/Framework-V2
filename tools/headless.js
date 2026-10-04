// Runs a built game in Node with a tiny DOM stub: just the parts engine.js touches.
// Used by tools/build.js (validator report) and tests/run.js.
const vm = require("node:vm");

class El {
  constructor() { this.children = []; this.hidden = false; this.className = ""; this.value = ""; this.scrollTop = 0; this.scrollHeight = 0; }
  append(...xs) { this.children.push(...xs); }
  get textContent() { return this.children.map(c => typeof c === "string" ? c : c.textContent).join(""); }
  set textContent(t) { this.children = [String(t)]; }
  set innerHTML(h) { this.children = h ? [String(h)] : []; }
  focus() {}
}

// html: a built game file. Runs its scripts; call boot() to fire DOMContentLoaded.
function load(html) {
  const els = {}, ready = [], errors = [], cls = new Set();
  for (const [, id] of html.matchAll(/\sid="([^"]+)"/g)) els[id] = new El();   // only ids in the markup exist
  const document = {
    title: "",
    body: { classList: { add: c => cls.add(c), remove: c => cls.delete(c) } },
    getElementById: id => els[id] || null,
    createElement: () => new El(),
    addEventListener: (e, f) => e === "DOMContentLoaded" && ready.push(f)
  };
  const ctx = vm.createContext({ document, console: { log() {}, warn() {}, error: (...a) => errors.push(a) } });
  [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m, i) => vm.runInContext(m[1], ctx, { filename: `script ${i + 1}` }));

  const game = {
    $: id => els[id],
    errors,
    get: expr => JSON.parse(vm.runInContext(`JSON.stringify(${expr})`, ctx)),   // plain copy of engine state, e.g. get("S")
    run: code => vm.runInContext(code, ctx),
    boot() { ready.forEach(f => f()); return game; },
    click(id) { els[id].onclick(); },
    type(...cmds) { for (const c of cmds) { els.in.value = c; els.f.onsubmit({ preventDefault() {} }); } },
    lines: () => els.out.children.map(p => p.textContent),
    last: () => game.lines().at(-1),
    playing: () => cls.has("playing"),
    problems: () => els.err.hidden ? [] : els.err.textContent.split("\n").slice(1)
  };
  return game;
}

module.exports = { load };
