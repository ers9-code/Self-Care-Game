#!/usr/bin/env node
/* =====================================================================
 * build/build.js
 *
 * Concatenates source/ into one self-contained standalone HTML file at
 * dist/Energy_Bar_Challenge_STANDALONE.html:
 *   - inlines source/css/styles.css into a <style> tag
 *   - concatenates the source/js/*.js modules, in the same load order
 *     as source/index.html, into one <script> tag
 *   - inlines every image referenced from source/assets/ as a base64
 *     data: URI, so the shipped standalone has zero external/remote
 *     image dependencies
 *
 * Hard gate (run every rebuild, never skipped): parses every top-level
 * `function` declaration and every top-level `const`/`let` binding
 * across the concatenated JS files and FAILS LOUDLY — non-zero exit,
 * listing file:line for every collision — if any name is declared more
 * than once. Plain concatenation makes every one of these a global;
 * a silent collision is exactly the "bundle-level function name
 * collision" defect class this project was built to eliminate.
 *
 * Usage: node build/build.js
 * No npm install / node_modules required — plain Node + fs only.
 * ===================================================================== */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "source");
const DIST_DIR = path.join(ROOT, "dist");
const OUT_FILE = path.join(DIST_DIR, "Energy_Bar_Challenge_STANDALONE.html");

// Must match the <script src="js/...."> order in source/index.html exactly —
// load order matters because later files reference globals defined earlier.
const JS_FILES = [
  "state.js",
  "images.js",
  "content.js",
  "engine.js",
  "render-projector.js",
  "render-facilitator.js",
  "transport.js",
  "main.js",
];

const MIME_BY_EXT = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".gif": "image/gif" };

function fail(message) {
  console.error("\nBUILD FAILED\n" + message + "\n");
  process.exit(1);
}

// ── Step 1: read every JS module, tag each line with its source file:line ──
function readModules() {
  return JS_FILES.map(name => {
    const full = path.join(SRC, "js", name);
    if (!fs.existsSync(full)) fail(`Missing source module: source/js/${name}`);
    const text = fs.readFileSync(full, "utf8");
    return { name, text, lines: text.split("\n") };
  });
}

// ── Step 2: duplicate-global detection gate ─────────────────────────────
/**
 * Finds every top-level (column-0, not inside a block) `function NAME(`,
 * `const NAME =`/`const NAME(` (destructuring skipped — none are used at
 * top level in this project) and `let NAME =` across all modules, then
 * fails loudly if any NAME is declared more than once.
 *
 * This is a deliberately simple line-scanner, not a real JS parser: it
 * only looks at lines with zero leading whitespace (true top level in
 * this codebase's formatting convention), which is exactly the surface
 * that plain-concatenation collisions come from. It intentionally does
 * NOT try to understand every possible JS syntax form — it is a guard
 * against a specific known defect class, not a general linter.
 */
function findTopLevelDeclarations(modules) {
  const decls = []; // { name, kind, file, line, source }
  const fnRe = /^function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/;
  const constLetRe = /^(const|let)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*[=;]/;

  for (const mod of modules) {
    mod.lines.forEach((line, idx) => {
      // Only truly top-level lines: no leading whitespace at all.
      if (/^\s/.test(line)) return;
      const fnMatch = line.match(fnRe);
      if (fnMatch) {
        decls.push({ name: fnMatch[1], kind: "function", file: `source/js/${mod.name}`, line: idx + 1, source: line.trim() });
        return;
      }
      const clMatch = line.match(constLetRe);
      if (clMatch) {
        decls.push({ name: clMatch[2], kind: clMatch[1], file: `source/js/${mod.name}`, line: idx + 1, source: line.trim() });
      }
    });
  }
  return decls;
}

function checkForCollisions(decls) {
  const byName = new Map();
  for (const d of decls) {
    if (!byName.has(d.name)) byName.set(d.name, []);
    byName.get(d.name).push(d);
  }
  const collisions = [...byName.entries()].filter(([, list]) => list.length > 1);
  if (collisions.length === 0) return;

  const report = collisions.map(([name, list]) => {
    const where = list.map(d => `    ${d.file}:${d.line}  (${d.kind})  ${d.source}`).join("\n");
    return `  "${name}" declared ${list.length} times:\n${where}`;
  }).join("\n\n");

  fail(
    `Duplicate top-level global declaration(s) detected across the concatenated source/js/*.js modules.\n` +
    `Plain <script> concatenation makes every top-level function/const/let a SHARED GLOBAL — the later\n` +
    `declaration silently clobbers the earlier one at runtime. This is the exact "bundle-level function\n` +
    `name collision" defect class this build gate exists to catch. Rename one side, or make the earlier\n` +
    `declaration local to a smaller scope, then rebuild.\n\n` + report
  );
}

// ── Step 3: inline images as base64 data: URIs ──────────────────────────
function inlineImages(jsText) {
  const assetsDir = path.join(SRC, "assets");
  // Matches "assets/round1.webp" style relative paths as used in images.js.
  return jsText.replace(/"assets\/([A-Za-z0-9_.-]+)"/g, (whole, filename) => {
    const full = path.join(assetsDir, filename);
    if (!fs.existsSync(full)) fail(`images.js references source/assets/${filename}, but that file does not exist.`);
    const ext = path.extname(filename).toLowerCase();
    const mime = MIME_BY_EXT[ext];
    if (!mime) fail(`Unknown image type for source/assets/${filename} (extension "${ext}"). Add it to MIME_BY_EXT in build.js.`);
    const b64 = fs.readFileSync(full).toString("base64");
    return `"data:${mime};base64,${b64}"`;
  });
}

// ── Step 4: assemble the standalone HTML ────────────────────────────────
function build() {
  const modules = readModules();
  const decls = findTopLevelDeclarations(modules);
  checkForCollisions(decls);
  console.log(`Duplicate-global check passed: ${decls.length} top-level declarations across ${modules.length} files, all unique.`);

  const css = fs.readFileSync(path.join(SRC, "css", "styles.css"), "utf8");

  let js = modules.map(m => `/* ===== js/${m.name} ===== */\n${m.text}`).join("\n\n");
  js = inlineImages(js);

  // Fail loudly if any relative asset reference survived inlining — the
  // standalone must have zero external/remote or unresolved local paths.
  const strayAssetRef = js.match(/["']assets\/[^"']+["']/);
  if (strayAssetRef) fail(`An asset reference "${strayAssetRef[0]}" was not inlined. The standalone build must have zero external image dependencies.`);

  const indexHtml = fs.readFileSync(path.join(SRC, "index.html"), "utf8");
  // Pull the body markup verbatim from source/index.html (everything between
  // <body> and the first <script> tag) so the standalone's markup can never
  // drift from the source project's markup. Using indexOf rather than a
  // regex here avoids any risk of a fragile "N consecutive </div>" pattern
  // mismatching this nested markup.
  const bodyOpenIdx = indexHtml.indexOf("<body>");
  const firstScriptIdx = indexHtml.indexOf("<script");
  if (bodyOpenIdx === -1) fail("Could not find <body> in source/index.html.");
  if (firstScriptIdx === -1) fail("Could not find a <script> tag in source/index.html.");
  const bodyMarkup = indexHtml.slice(bodyOpenIdx + "<body>".length, firstScriptIdx).trim();

  const html = `<!DOCTYPE html>

<html lang="en-AU">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Energy Bar Challenge — Jordan's Day</title>
<meta content="A classroom simulation activity about self-care and energy management. Dual-screen activity for facilitators and students." name="description"/>
<style>
${css}
</style>
</head>
<body>
${bodyMarkup}
<script>
${js}
</script>
</body>
</html>
`;

  fs.mkdirSync(DIST_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, html, "utf8");

  const sizeMb = (Buffer.byteLength(html, "utf8") / (1024 * 1024)).toFixed(2);
  console.log(`Built ${path.relative(ROOT, OUT_FILE)} (${sizeMb} MB).`);
}

build();
