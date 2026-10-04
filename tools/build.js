// Build a game into one self-contained HTML file.
//   node tools/build.js <game>   reads games/<game>/, writes dist/<game>.html, prints validator output
// Order: css, game, engine, then the add-ons listed in build.json (each in its own <script>).
// game.js is wrapped in a function scope that returns G, so only G is global.
// An add-on name starting with "./" is the game's own: "./tour" is games/<game>/tour.js.
const fs = require("node:fs"), path = require("node:path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8").replace(/\s+$/, "");

// dir: a game folder relative to the repo root (e.g. "games/damp-cell" or "template")
function build(dir) {
  const { addons = [] } = JSON.parse(read(`${dir}/build.json`));
  const files = addons.map(a => a.startsWith("./") ? `${dir}/${a.slice(2)}.js` : `addons/${a}.js`);
  for (const f of files) if (!fs.existsSync(path.join(root, f))) throw new Error(`${dir}/build.json: no add-on "${f}"`);
  const scripts = [`${dir}/game.js`, "engine/engine.js", ...files].map((f, i) => {
    let code = read(f);
    if (/<\/script/i.test(code)) throw new Error(`${f}: contains "</script", which would end its script block early`);
    // game.js runs in its own scope, so its helpers can have any name (even one the engine uses); only G is shared
    if (i === 0) code = `const G = (() => {\n${code}\nreturn G;\n})();`;
    return `<script>\n${code}\n</script>`;
  }).join("\n\n");
  // function replacers, so "$" in the code is never read as a replace pattern
  return read("engine/shell.html").replace("/*{{CSS}}*/", () => read("engine/style.css")).replace("<!--{{SCRIPTS}}-->", () => scripts) + "\n";
}

if (require.main === module) {
  const name = process.argv[2];
  if (!name || !fs.existsSync(path.join(root, "games", name, "game.js"))) {
    console.error("usage: node tools/build.js <game>   (a folder in games/ with game.js and build.json)");
    process.exit(1);
  }
  const html = build(`games/${name}`), out = `dist/${name}.html`;
  fs.mkdirSync(path.join(root, "dist"), { recursive: true });
  fs.writeFileSync(path.join(root, out), html);
  console.log(`Built ${out} (${(html.length / 1024).toFixed(1)} KB)`);
  const problems = require("./headless").load(html).boot().problems();
  if (!problems.length) console.log("Validator: no problems");
  else { console.log(`Validator: ${problems.length} problem(s):\n  ` + problems.join("\n  ")); process.exitCode = 1; }
}

module.exports = { build };
