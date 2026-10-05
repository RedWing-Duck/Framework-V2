// Runs a built game in Node with a tiny DOM stub: just the parts engine.js touches.
// Used by tools/build.js (validator report) and tests/run.js.
const vm = require("node:vm");

class El {
  constructor() { this.children = []; this.log = []; this.hidden = false; this.className = ""; this.value = ""; this.scrollTop = 0; this.scrollHeight = 0; }
  // log: everything ever appended (until innerHTML is cleared), so tests can read past the engine's 500-paragraph screen limit
  append(...xs) { for (const x of xs) { if (x instanceof El) x.parent = this; this.children.push(x); this.log.push(x); } }
  remove() { const c = this.parent?.children, i = c ? c.indexOf(this) : -1; if (i >= 0) c.splice(i, 1); }
  get firstElementChild() { return this.children.find(c => c instanceof El) || null; }
  get textContent() { return this.children.map(c => typeof c === "string" ? c : c.textContent).join(""); }
  set textContent(t) { this.children = [String(t)]; }
  set innerHTML(h) { this.children = h ? [String(h)] : []; this.log = [...this.children]; }
  focus() {}
}

// A localStorage stand-in. Pass the same one to two load() calls to test a page reload.
const storage = (m = new Map()) => ({ getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), map: m });
// A file-download stand-in (Blob, URL.createObjectURL, a link's click). Each saved file lands in files as { name, text }.
const downloads = () => ({ files: [], blobs: new Map() });

// html: a built game file. Runs its scripts; call boot() to fire DOMContentLoaded.
// opts.storage: a storage() to use as localStorage (default: none, as in a browser that blocks it)
// opts.download: a downloads() to let the page save files (default: none, as in a browser that won't)
function load(html, opts = {}) {
  const els = {}, ready = [], errors = [], cls = new Set();
  for (const [, id] of html.matchAll(/\sid="([^"]+)"/g)) els[id] = new El();   // only ids in the markup exist
  const document = {
    title: "",
    head: new El(),
    body: { classList: { add: c => cls.add(c), remove: c => cls.delete(c) }, append() {} },
    getElementById: id => els[id] || null,
    createElement: () => { const e = new El(), d = opts.download;   // a link clicked with download set saves its blob
      if (d) e.click = () => { if (e.download && d.blobs.has(e.href)) d.files.push({ name: e.download, text: d.blobs.get(e.href) }); };
      return e; },
    addEventListener: (e, f) => e === "DOMContentLoaded" && ready.push(f)
  };
  const d = opts.download, files = d && { Blob: class { constructor(parts) { this.text = parts.join(""); } },
    URL: { createObjectURL: b => { const u = "blob:" + d.blobs.size; d.blobs.set(u, b.text); return u; }, revokeObjectURL() {} }, setTimeout: () => 0 };
  const ctx = vm.createContext({ document, ...(opts.storage && { localStorage: opts.storage }), ...files, console: { log() {}, warn() {}, error: (...a) => errors.push(a) } });
  [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m, i) => vm.runInContext(m[1], ctx, { filename: `script ${i + 1}` }));

  const game = {
    $: id => els[id],
    errors,
    get: expr => JSON.parse(vm.runInContext(`JSON.stringify(${expr})`, ctx)),   // plain copy of engine state, e.g. get("S")
    run: code => vm.runInContext(code, ctx),
    boot() { ready.forEach(f => f()); return game; },
    click(id) { els[id].onclick(); },
    type(...cmds) { for (const c of cmds) { els.in.value = c; els.f.onsubmit({ preventDefault() {} }); } },
    lines: () => els.out.log.map(p => p.textContent),   // the whole transcript, not just what's still on screen
    last: () => game.lines().at(-1),
    playing: () => cls.has("playing"),
    problems: () => els.err.hidden ? [] : els.err.textContent.split("\n").slice(1)
  };
  return game;
}

module.exports = { load, storage, downloads };
