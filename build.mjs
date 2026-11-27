// Build: src/ -> assets/ (one CSS file, one JS file, one 3D hero bundle), minified.
//   npm install   (first time)
//   npm run build
import { build, transform } from 'esbuild';
import postcss from 'postcss';
import { readFileSync, readdirSync, writeFileSync, mkdirSync, statSync } from 'node:fs';

const read = (p) => readFileSync(p, 'utf8');
const files = (dir, ext) => readdirSync(dir).filter((f) => f.endsWith(ext)).sort().map((f) => `${dir}/${f}`);
mkdirSync('assets/css', { recursive: true });
mkdirSync('assets/js', { recursive: true });

/* ---------- CSS: concatenate in order, drop styles of removed features, minify ---------- */
const DEAD = [
  /\.cart-(drawer|head|items|line|empty|foot|total|note)\b/, /\.scrim\b/, /\.ring(-stage|-item|-hint)?\b/, /#cart\b/,
  /\.dock\b/, /\.dock-pill\b/, /\.has-dock\b/, /\.fab-(store|dot|arrow)\b/, /\.to-top\b/, /\.tt-(bg|fg)\b/,
  /\.garment3d\b/, /\.is-3d\b/, /\.viewer-tabs\b/, /#viewer-buy\b/, /\.viewer-hint\b/, /\.statement\b/,
];
const prune = () => ({
  postcssPlugin: 'prune-dead',
  Rule(rule) {
    if (rule.parent && rule.parent.type === 'atrule' && /keyframes/.test(rule.parent.name)) return;
    const keep = rule.selectors.filter((s) => !DEAD.some((re) => re.test(s)));
    if (!keep.length) rule.remove();
    else if (keep.length !== rule.selectors.length) rule.selectors = keep;
  },
  AtRuleExit(at) { if (at.nodes && at.nodes.length === 0) at.remove(); },
});
prune.postcss = true;
const cssSrc = files('src/css', '.css').map(read).join('\n');
const pruned = (await postcss([prune()]).process(cssSrc, { from: undefined })).css;
const css = await transform(pruned, { loader: 'css', minify: true, target: ['chrome100', 'safari15', 'firefox100'] });
writeFileSync('assets/css/site.css', css.code);

/* ---------- JS: vendor (Lenis) + site scripts, minified, one classic script ---------- */
const vendor = await build({
  stdin: { contents: "import Lenis from 'lenis'; window.Lenis = Lenis;", resolveDir: '.' },
  bundle: true, minify: true, format: 'iife', write: false, target: ['es2020'],
});
const siteSrc = files('src/js', '.js').map(read).join('\n;\n');
const site = await transform(siteSrc, { loader: 'js', minify: true, target: ['es2020'] });
writeFileSync('assets/js/site.js', vendor.outputFiles[0].text + '\n' + site.code);

/* ---------- 3D hero: Three.js bundled with only what is used (tree-shaken), ES module ---------- */
await build({
  entryPoints: ['src/hero/hero3d.js'], outfile: 'assets/js/hero.js',
  bundle: true, minify: true, format: 'esm', target: ['es2020'], legalComments: 'none',
});

for (const f of ['assets/css/site.css', 'assets/js/site.js', 'assets/js/hero.js']) {
  console.log(`${f}  ${(statSync(f).size / 1024).toFixed(1)} KB`);
}
