import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { optimize } from "svgo";
import { collectSvgMetricsFromText } from "./svg-metrics.mjs";

// Robust VTracer CLI detection
function detectVTracer() {
  const possiblePaths = [
    process.env.VTRACER_BIN,
    "vtracer",
    resolve("scripts/vtracer/bin/vtracer.exe"),
    resolve("scripts/vtracer/bin/vtracer"),
    "D:/bin/vtracer.exe",
    "d:/bin/vtracer.exe",
    "D:/bin/vtracer",
    "d:/bin/vtracer"
  ].filter(Boolean);

  for (const p of possiblePaths) {
    if (p !== "vtracer" && !existsSync(p)) {
      continue;
    }
    const result = spawnSync(p, ["--help"], {
      encoding: "utf8",
      shell: process.platform === "win32"
    });
    if (result.status === 0) {
      const output = `${result.stdout}\n${result.stderr}`.trim();
      if (output.includes("--input") && output.includes("--output")) {
        return p;
      }
    }
  }
  return null;
}

const binary = detectVTracer();
if (!binary) {
  console.error("VTracer CLI was not found. Please run the setup script first.");
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
const input = required(args.input, "--input");
const outDir = args.outDir || "docs/Crops/Generated";
const presetName = args.preset || "gameClean";
const presets = JSON.parse(readFileSync("docs/Crops/vtracer-presets.json", "utf8"));
const preset = presets[presetName];

if (!preset) {
  console.error(`Unknown preset "${presetName}". Available: ${Object.keys(presets).join(", ")}`);
  process.exit(1);
}

const inputPath = resolve(input);
const baseName = basename(inputPath, extname(inputPath));
const rawDir = resolve(outDir, "raw");
const optimizedDir = resolve(outDir, "optimized");
const reportsDir = resolve(outDir, "reports");
const rawSvg = join(rawDir, `${baseName}.${presetName}.raw.svg`);
const optimizedSvg = join(optimizedDir, `${baseName}.${presetName}.svg`);
const reportPath = join(reportsDir, `${baseName}.${presetName}.json`);

mkdirSync(dirname(rawSvg), { recursive: true });
mkdirSync(dirname(optimizedSvg), { recursive: true });
mkdirSync(dirname(reportPath), { recursive: true });

const cliArgs = [
  "--input", inputPath,
  "--output", rawSvg,
  "--colormode", preset.colormode,
  "--mode", preset.mode,
  "--hierarchical", preset.hierarchical,
  "--color_precision", String(preset.color_precision),
  "--filter_speckle", String(preset.filter_speckle),
  "--gradient_step", String(preset.gradient_step),
  "--corner_threshold", String(preset.corner_threshold),
  "--segment_length", String(preset.segment_length),
  "--splice_threshold", String(preset.splice_threshold),
  "--path_precision", String(preset.path_precision)
];

const traceResult = spawnSync(binary, cliArgs, {
  encoding: "utf8",
  shell: process.platform === "win32"
});

if (traceResult.error || traceResult.status !== 0) {
  console.error(traceResult.error?.message || traceResult.stderr || traceResult.stdout);
  process.exit(traceResult.status ?? 1);
}

const rawText = readFileSync(rawSvg, "utf8");
const optimized = optimize(rawText, {
  multipass: true,
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          convertColors: {
            names2hex: true,
            rgb2hex: true,
            shorthex: false,
            shortname: false
          }
        }
      }
    },
    "removeDimensions",
    {
      name: "removeAttrs",
      params: {
        attrs: ["svg:style", "svg:id"]
      }
    }
  ]
});

if ("data" in optimized) {
  writeFileSync(optimizedSvg, optimized.data);
} else {
  console.error("SVGO did not return optimized SVG data.");
  process.exit(1);
}

const report = {
  input: inputPath,
  presetName,
  preset,
  rawSvg,
  optimizedSvg,
  raw: collectSvgMetricsFromText(rawText),
  optimized: collectSvgMetricsFromText(optimized.data)
};

writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

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
