import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { collectSvgMetricsFromText } from "./svg-metrics.mjs";

const args = parseArgs(process.argv.slice(2));
const input = required(args.input, "--input");
const output = required(args.output, "--output");
const rootClass = args.rootClass || "imported-crop imported-crop--corn";
const idPrefix = args.idPrefix || "corn-stage03";

const source = readFileSync(input, "utf8");
let svg = source
  .replace(/<\?xml[^>]*>\s*/i, "")
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/\sstyle=["']display:\s*block;?["']/i, "")
  .replace(/<svg\b/i, `<svg class="${rootClass}"`);

const ids = Array.from(svg.matchAll(/\bid=["']([^"']+)["']/gi)).map((match) => match[1]);
const referencedIds = new Set();

for (const match of svg.matchAll(/url\(#([^)]+)\)/gi)) {
  referencedIds.add(match[1]);
}
for (const match of svg.matchAll(/\b(?:href|xlink:href)=["']#([^"']+)["']/gi)) {
  referencedIds.add(match[1]);
}

for (const id of ids) {
  const prefixed = `${idPrefix}-${id}`;
  if (referencedIds.has(id)) {
    svg = svg
      .replace(new RegExp(`id=["']${escapeRegExp(id)}["']`, "g"), `id="${prefixed}"`)
      .replace(new RegExp(`url\\(#${escapeRegExp(id)}\\)`, "g"), `url(#${prefixed})`)
      .replace(new RegExp(`(href|xlink:href)=["']#${escapeRegExp(id)}["']`, "g"), `$1="#${prefixed}"`);
  } else {
    svg = svg.replace(new RegExp(`\\s+id=["']${escapeRegExp(id)}["']`, "g"), "");
  }
}

svg = svg.replace(/<path\b/gi, '<path class="imported-crop__path"');

const grouped = svg.replace(
  /(<svg\b[^>]*>)([\s\S]*)(<\/svg>)/i,
  `$1\n  <g class="corn-part corn-part--unclassified">$2</g>\n$3`
);

mkdirSync(dirname(resolve(output)), { recursive: true });
writeFileSync(output, `${grouped.trim()}\n`);

console.log(JSON.stringify({
  input,
  output,
  metrics: collectSvgMetricsFromText(grouped)
}, null, 2));

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    parsed[key.slice(2)] = argv[i + 1];
    i += 1;
  }
  return parsed;
}

function required(value, name) {
  if (!value) {
    console.error(`Missing required argument ${name}`);
    process.exit(1);
  }
  return value;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
