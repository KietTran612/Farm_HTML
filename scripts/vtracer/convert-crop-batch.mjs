import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const args = parseArgs(process.argv.slice(2));
const cropDir = required(args.cropDir, "--cropDir");
const outDir = args.outDir || join(cropDir, "SVG", "Generated");
const preset = args.preset || "gameClean";
const pngFiles = readdirSync(cropDir)
  .filter((file) => file.toLowerCase().endsWith(".png"))
  .sort();

if (pngFiles.length === 0) {
  console.error(`No PNG files found in ${cropDir}`);
  process.exit(1);
}

const reports = [];
for (const pngFile of pngFiles) {
  const input = join(cropDir, pngFile);
  const result = spawnSync("node", [
    "scripts/vtracer/convert-crop.mjs",
    "--input", input,
    "--outDir", outDir,
    "--preset", preset
  ], {
    encoding: "utf8",
    shell: process.platform === "win32"
  });

  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }

  reports.push(JSON.parse(result.stdout));
}

const summaryPath = resolve(outDir, "reports", `_batch.${preset}.json`);
mkdirSync(resolve(outDir, "reports"), { recursive: true });
writeFileSync(summaryPath, `${JSON.stringify(reports, null, 2)}\n`);
console.log(`Converted ${reports.length} PNG files with preset ${preset}`);
console.log(summaryPath);

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
