# VTracer CLI Crop Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up a repeatable local VTracer CLI pipeline that converts crop PNG mockups into optimized, measurable, game-ready SVG candidates and prepares selected SVGs for per-part animation.

**Architecture:** Use VTracer CLI as the only raster-to-vector engine, then run project-owned Node scripts to apply named presets, optimize with SVGO, collect metrics, and generate review/demo outputs. The first integration target is Corn Stage03 because it is visually rich enough to prove whether grouped SVG animation is viable before applying the pipeline to every crop/state.

**Tech Stack:** VTracer CLI, Node.js ESM scripts, SVGO, Vitest for script helpers, Vite static review pages, SCSS/CSS animation.

**Primary References:**
- VTracer command app supports `vtracer [OPTIONS] --input <input> --output <output>` and options such as `--color_precision`, `--filter_speckle`, `--gradient_step`, `--hierarchical`, `--mode`, `--path_precision`, `--segment_length`, and `--splice_threshold`: https://github.com/visioncortex/vtracer
- VTracer installation sources include pre-built releases, `cargo install vtracer`, and `pip install vtracer`; the repo warns not to download from unrelated third-party sources: https://github.com/visioncortex/vtracer
- The existing project already has `svgo` and `npm run svg:optimize` in `package.json`.

**Project Constraint:** Do not commit unless the user explicitly asks. Commit steps below are checkpoints for a future approved execution flow, not permission to commit automatically.

**Image Review Constraint:** Every source PNG must be reviewed before accepting its exported SVG. Do not apply one preset blindly to all crops/states. For each image, compare at least `gameClean` and `animationCandidate`, inspect the visual output at full size and tile size, read the metrics report, then record the chosen preset and reason before using that SVG in animation or game integration.

**Visual Quality Constraint:** Path count reduction is a means, not the goal. A preset must be rejected if it loses crop identity, deforms key shapes, removes distinctive details, or looks noisy when reduced to the real game tile size. For corn, preserve the readable cob shape, leaf silhouette, tassels/silk, and stalk direction before considering file size or path count acceptable.

---

## File Structure

- Create `docs/Crops/vtracer-presets.json`
  - Stores named presets used by both CLI scripts and documentation.
  - Keeps VTracer parameters repeatable after a good visual preset is found.

- Create `scripts/vtracer/check-vtracer.mjs`
  - Verifies that `vtracer` is installed and prints its version/help output.
  - Fails with clear setup instructions when the binary is missing.

- Create `scripts/vtracer/setup-vtracer.ps1`
  - Bootstraps VTracer from the official `visioncortex/vtracer` source path.
  - Prefer an existing `vtracer` on PATH, then `$env:VTRACER_BIN`, then `cargo install vtracer`.
  - Optionally downloads the official GitHub release asset when a release URL is supplied explicitly by the user.
  - Runs `vtracer --help` after setup so the project can confirm the CLI is callable before conversion.

- Create `scripts/vtracer/svg-metrics.mjs`
  - Pure helper module that counts SVG size, paths, groups, inline styles, unique fill colors, and viewBox.
  - Counts hex, named colors, `rgb(...)`, `rgba(...)`, `hsl(...)`, `hsla(...)`, `none`, `currentColor`, and `url(#...)` references so reports stay useful after SVGO changes color syntax.
  - Used by tests and conversion scripts.

- Create `scripts/vtracer/convert-crop.mjs`
  - Runs VTracer for one PNG using a named preset.
  - Runs SVGO on the raw output.
  - Writes raw SVG, optimized SVG, and metrics JSON.

- Create `scripts/vtracer/convert-crop-batch.mjs`
  - Converts all PNG files under one crop folder with the selected preset.
  - Produces one consolidated report for comparing states.

- Create `scripts/vtracer/review-crop-candidates.mjs`
  - Generates a lightweight HTML review page from candidate SVG outputs for one image or one crop folder.
  - Shows PNG source, raw SVG, optimized SVG, size/path/color metrics, and selected preset notes side by side.

- Create `scripts/vtracer/prepare-inline-svg.mjs`
  - Converts one optimized SVG candidate into an inline-SVG-ready artifact by removing XML comments, removing root inline display style, adding a stable root class, and optionally wrapping color/path groups.
  - Prefixes internal IDs and matching `url(#...)` references with a caller-provided namespace so multiple inline crop instances do not collide in the DOM.
  - Removes path-level IDs unless they are referenced by `url(#...)`, `href`, or `xlink:href`.
  - This does not pretend to solve all semantic grouping automatically; it creates a controlled starting point for per-part animation.

- Create `src/tools/vtracer/svgMetrics.test.ts`
  - Tests the metric helper on small SVG strings.

- Modify `package.json`
  - Add `crop:vtracer:check`, `crop:vtracer:convert`, `crop:vtracer:batch`, and `crop:vtracer:inline` scripts.

- Create `corn-vtracer-parts-demo.html`
  - Uses the prepared inline SVG output for a Corn Stage03 pilot.
  - Demonstrates per-part animation on grouped layers, not whole-image `<img>` animation.

- Modify `docs/plans/task.md`, `docs/plans/current-handoff.md`, and `docs/plans/index.md`
  - Track this setup and plan location.

---

## Recommended VTracer Presets

Start with these presets and measure before changing them. The point is not maximum detail; it is the best tradeoff between visual quality, path count, file size, and ability to group/animate.

```json
{
  "gameClean": {
    "colormode": "color",
    "mode": "spline",
    "hierarchical": "stacked",
    "color_precision": 5,
    "filter_speckle": 8,
    "gradient_step": 24,
    "corner_threshold": 60,
    "segment_length": 6,
    "splice_threshold": 45,
    "path_precision": 2
  },
  "gameDetailed": {
    "colormode": "color",
    "mode": "spline",
    "hierarchical": "stacked",
    "color_precision": 6,
    "filter_speckle": 5,
    "gradient_step": 16,
    "corner_threshold": 60,
    "segment_length": 4,
    "splice_threshold": 45,
    "path_precision": 2
  },
  "animationCandidate": {
    "colormode": "color",
    "mode": "spline",
    "hierarchical": "cutout",
    "color_precision": 5,
    "filter_speckle": 10,
    "gradient_step": 32,
    "corner_threshold": 70,
    "segment_length": 8,
    "splice_threshold": 50,
    "path_precision": 2
  },
  "tinyRuntime": {
    "colormode": "color",
    "mode": "spline",
    "hierarchical": "stacked",
    "color_precision": 4,
    "filter_speckle": 12,
    "gradient_step": 40,
    "corner_threshold": 75,
    "segment_length": 10,
    "splice_threshold": 55,
    "path_precision": 1
  }
}
```

**Acceptance targets for crop art candidates:**
- Seed/sprout state optimized SVG: under 80KB preferred, but visual readability wins if the only good candidate is larger.
- Mature/ready state optimized SVG: under 180KB preferred and under 250KB preferred for first pilot, but do not accept a smaller SVG that loses crop silhouette or distinctive details.
- Unique fill colors: under 80 preferred for animation candidates, but this is a warning threshold, not an automatic rejection.
- Tile-size preview must look clean at approximately 80px, 100px, and 120px visual crop height.
- Reject candidates where corn kernels become distorted blobs, leaf serrations disappear entirely, tassels/silk vanish, or color bands create distracting seams.
- Root SVG has no inline `style="display: block;"`.
- Candidate intended for per-part animation has at least these groups after preparation: `corn-stalk`, `corn-leaves`, `corn-ears`, `corn-tassels`, `corn-base`.

## Preset Tuning Principles

Use these rules when adjusting VTracer parameters:

- Increase `filter_speckle` first when the SVG has tiny noise dots or unwanted micro-regions. This usually reduces path count without changing the crop silhouette.
- Lower `color_precision` one step at a time when color bands are too fragmented. Stop immediately if corn kernels, leaf color identity, or dead-state dry tones become muddy.
- Increase `gradient_step` when too many near-identical color layers create visual noise at tile size. Stop if highlights/shadows flatten so much that the crop loses volume.
- Increase `segment_length` when curves have too many anchor points. Stop if serrated leaves, tassels, or cob edges become misshapen.
- Compare `stacked` and `cutout` for animation candidates. `cutout` can be easier to group, but reject it if seams appear during per-part rotation.
- Never optimize only by the metrics table. The chosen candidate must win visually at 80px, 100px, and 120px crop height.

For corn specifically, the chosen export must preserve:
- readable yellow cob clusters, not generic yellow circles;
- recognizable leaf silhouette and main leaf direction;
- top tassels/silk unless the state intentionally does not have them;
- a stable bottom anchor that can sit on the 2.5D soil without floating.

---

### Task 1: Auto Setup And Verify VTracer CLI

**Files:**
- Create: `scripts/vtracer/setup-vtracer.ps1`
- Create: `scripts/vtracer/check-vtracer.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add local setup script**

Create `scripts/vtracer/setup-vtracer.ps1`:

```powershell
[CmdletBinding()]
param(
  [string]$ReleaseZipUrl = "",
  [string]$InstallDir = "$PSScriptRoot\bin",
  [switch]$UseCargo
)

$ErrorActionPreference = "Stop"

function Test-VTracerCommand {
  param([string]$Command)

  try {
    $output = & $Command --help 2>&1
    if ($LASTEXITCODE -eq 0 -and ($output -join "`n") -match "--input" -and ($output -join "`n") -match "--output") {
      return $true
    }
  } catch {
    return $false
  }

  return $false
}

function Resolve-VTracerBinary {
  if ($env:VTRACER_BIN -and (Test-Path -LiteralPath $env:VTRACER_BIN)) {
    return (Resolve-Path -LiteralPath $env:VTRACER_BIN).Path
  }

  $pathCommand = Get-Command vtracer -ErrorAction SilentlyContinue
  if ($pathCommand) {
    return $pathCommand.Source
  }

  return ""
}

$existing = Resolve-VTracerBinary
if ($existing) {
  Write-Host "VTracer already available: $existing"
  & $existing --help | Select-Object -First 12
  exit 0
}

if ($UseCargo) {
  $cargo = Get-Command cargo -ErrorAction SilentlyContinue
  if (-not $cargo) {
    throw "Cargo was requested but was not found on PATH. Install Rust first or provide -ReleaseZipUrl from the official visioncortex/vtracer GitHub Releases page."
  }

  cargo install vtracer
  $installed = Resolve-VTracerBinary
  if (-not $installed) {
    throw "cargo install vtracer finished, but vtracer was not found on PATH."
  }

  Write-Host "VTracer installed via cargo: $installed"
  & $installed --help | Select-Object -First 12
  exit 0
}

if ($ReleaseZipUrl) {
  if ($ReleaseZipUrl -notmatch "^https://github\.com/visioncortex/vtracer/") {
    throw "ReleaseZipUrl must come from the official https://github.com/visioncortex/vtracer repository."
  }

  New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
  $zipPath = Join-Path $InstallDir "vtracer-release.zip"
  Invoke-WebRequest -Uri $ReleaseZipUrl -OutFile $zipPath
  Expand-Archive -LiteralPath $zipPath -DestinationPath $InstallDir -Force

  $binary = Get-ChildItem -LiteralPath $InstallDir -Recurse -Filter "vtracer.exe" | Select-Object -First 1
  if (-not $binary) {
    $binary = Get-ChildItem -LiteralPath $InstallDir -Recurse -Filter "vtracer" | Select-Object -First 1
  }
  if (-not $binary) {
    throw "Downloaded release did not contain a vtracer binary."
  }

  $env:VTRACER_BIN = $binary.FullName
  Write-Host "VTracer downloaded from official release: $($binary.FullName)"
  Write-Host "For this shell: `$env:VTRACER_BIN = `"$($binary.FullName)`""
  & $binary.FullName --help | Select-Object -First 12
  exit 0
}

throw "VTracer was not found. Run with -UseCargo, set VTRACER_BIN, put vtracer on PATH, or pass -ReleaseZipUrl from https://github.com/visioncortex/vtracer/releases."
```

- [ ] **Step 2: Run setup using the safest available option**

Preferred options:

```powershell
# Option A: use an already installed vtracer or VTRACER_BIN.
powershell -ExecutionPolicy Bypass -File ./scripts/vtracer/setup-vtracer.ps1

# Option B: install from Rust crates.io when Rust is available.
powershell -ExecutionPolicy Bypass -File ./scripts/vtracer/setup-vtracer.ps1 -UseCargo

# Option C: download an official GitHub release zip only when the user supplies the URL.
powershell -ExecutionPolicy Bypass -File ./scripts/vtracer/setup-vtracer.ps1 -ReleaseZipUrl "https://github.com/visioncortex/vtracer/releases/download/<version>/<official-asset>.zip"
```

Expected:
- `vtracer --version` or `vtracer --help` runs from PowerShell.
- If using a non-PATH binary, `$env:VTRACER_BIN` points to the executable.

- [ ] **Step 3: Add the check script**

Create `scripts/vtracer/check-vtracer.mjs`:

```js
import { spawnSync } from "node:child_process";

const binary = process.env.VTRACER_BIN || "vtracer";
const result = spawnSync(binary, ["--help"], {
  encoding: "utf8",
  shell: process.platform === "win32"
});

if (result.error) {
  console.error(`VTracer CLI was not found: ${binary}`);
  console.error("Install with `cargo install vtracer`, download the official GitHub release, or set VTRACER_BIN.");
  process.exit(1);
}

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

const output = `${result.stdout}\n${result.stderr}`.trim();
if (!output.includes("--input") || !output.includes("--output")) {
  console.error("VTracer CLI responded, but expected --input/--output options were not found.");
  process.exit(1);
}

console.log(`VTracer CLI is available via ${binary}`);
```

- [ ] **Step 4: Add npm scripts**

Modify `package.json` scripts:

```json
{
  "crop:vtracer:setup": "powershell -ExecutionPolicy Bypass -File ./scripts/vtracer/setup-vtracer.ps1",
  "crop:vtracer:check": "node scripts/vtracer/check-vtracer.mjs"
}
```

Keep existing scripts unchanged.

- [ ] **Step 5: Verify CLI detection**

Run:

```powershell
npm run crop:vtracer:setup
npm run crop:vtracer:check
```

Expected:

```txt
VTracer CLI is available via vtracer
```

or:

```txt
VTracer CLI is available via D:\tools\vtracer\vtracer.exe
```

- [ ] **Step 6: Commit checkpoint only if the user asks**

```powershell
git add package.json scripts/vtracer/setup-vtracer.ps1 scripts/vtracer/check-vtracer.mjs
git commit -m "chore: add vtracer cli setup"
```

---

### Task 2: Add Repeatable VTracer Presets

**Files:**
- Create: `docs/Crops/vtracer-presets.json`
- Create: `src/tools/vtracer/svgMetrics.test.ts`
- Create: `scripts/vtracer/svg-metrics.mjs`

- [ ] **Step 1: Add preset JSON**

Create `docs/Crops/vtracer-presets.json` with the exact preset JSON from the "Recommended VTracer Presets" section.

- [ ] **Step 2: Add metric helper tests**

Create `src/tools/vtracer/svgMetrics.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { collectSvgMetricsFromText } from "../../../scripts/vtracer/svg-metrics.mjs";

describe("collectSvgMetricsFromText", () => {
  it("counts paths, groups, inline styles, unique fills, and viewBox", () => {
    const svg = `
      <svg viewBox="0 0 240 180" style="display: block;">
        <g class="corn-leaves">
          <path d="M0 0 L1 1" style="fill: #50A441;"/>
          <path d="M1 1 L2 2" style="fill: #50a441;"/>
          <path d="M2 2 L3 3" fill="#E8C84A"/>
        </g>
      </svg>
    `;

    expect(collectSvgMetricsFromText(svg)).toEqual({
      bytes: expect.any(Number),
      pathCount: 3,
      groupCount: 1,
      inlineStyleCount: 3,
      uniqueFillCount: 2,
      viewBox: "0 0 240 180"
    });
  });
});
```

- [ ] **Step 3: Add metric helper implementation**

Create `scripts/vtracer/svg-metrics.mjs`:

```js
import { readFileSync, statSync } from "node:fs";

export function collectSvgMetricsFromText(svgText) {
  const pathCount = count(svgText, /<path\b/gi);
  const groupCount = count(svgText, /<g\b/gi);
  const inlineStyleCount = count(svgText, /\bstyle=/gi);
  const viewBoxMatch = svgText.match(/\bviewBox=["']([^"']+)["']/i);
  const fills = new Set();

  const colorPatterns = [
    /\bfill\s*[:=]\s*["']?\s*(#[0-9a-f]{3,8})/gi,
    /\bfill\s*[:=]\s*["']?\s*(rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\))/gi,
    /\bfill\s*[:=]\s*["']?\s*(url\(#[-_a-z0-9]+\)|none|currentcolor|[a-z]+)/gi
  ];

  for (const pattern of colorPatterns) {
    for (const match of svgText.matchAll(pattern)) {
      fills.add(match[1].toLowerCase().replace(/\s+/g, ""));
    }
  }

  return {
    bytes: Buffer.byteLength(svgText, "utf8"),
    pathCount,
    groupCount,
    inlineStyleCount,
    uniqueFillCount: fills.size,
    viewBox: viewBoxMatch?.[1] ?? null
  };
}

export function collectSvgMetricsFromFile(filePath) {
  const svgText = readFileSync(filePath, "utf8");
  const metrics = collectSvgMetricsFromText(svgText);
  return {
    ...metrics,
    bytes: statSync(filePath).size
  };
}

function count(text, pattern) {
  return Array.from(text.matchAll(pattern)).length;
}
```

- [ ] **Step 4: Run focused metric test**

Run:

```powershell
npm test -- src/tools/vtracer/svgMetrics.test.ts
```

Expected:

```txt
1 passed
```

- [ ] **Step 5: Commit checkpoint only if the user asks**

```powershell
git add docs/Crops/vtracer-presets.json scripts/vtracer/svg-metrics.mjs src/tools/vtracer/svgMetrics.test.ts
git commit -m "chore: add vtracer crop presets and svg metrics"
```

---

### Task 3: Convert One PNG With Preset, Optimize, And Report

**Files:**
- Create: `scripts/vtracer/convert-crop.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add converter script**

Create `scripts/vtracer/convert-crop.mjs`:

```js
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { optimize } from "svgo";
import { collectSvgMetricsFromText } from "./svg-metrics.mjs";

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

const binary = process.env.VTRACER_BIN || "vtracer";
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
```

- [ ] **Step 2: Add npm script**

Modify `package.json` scripts:

```json
{
  "crop:vtracer:convert": "node scripts/vtracer/convert-crop.mjs"
}
```

- [ ] **Step 3: Convert Corn Stage03 with gameClean**

Run:

```powershell
npm run crop:vtracer:convert -- --input docs/Crops/Corn/World_Crop_Corn_Body_Stage03.png --outDir docs/Crops/Corn/SVG/Generated --preset gameClean
```

Expected output files:

```txt
docs/Crops/Corn/SVG/Generated/raw/World_Crop_Corn_Body_Stage03.gameClean.raw.svg
docs/Crops/Corn/SVG/Generated/optimized/World_Crop_Corn_Body_Stage03.gameClean.svg
docs/Crops/Corn/SVG/Generated/reports/World_Crop_Corn_Body_Stage03.gameClean.json
```

- [ ] **Step 4: Convert Corn Stage03 with animationCandidate**

Run:

```powershell
npm run crop:vtracer:convert -- --input docs/Crops/Corn/World_Crop_Corn_Body_Stage03.png --outDir docs/Crops/Corn/SVG/Generated --preset animationCandidate
```

Expected:
- `animationCandidate` has fewer colors/paths than the current raw Stage03 export.
- If it looks worse than `gameClean`, keep `gameClean` for visual asset and use `animationCandidate` only for grouping experiments.

- [ ] **Step 5: Commit checkpoint only if the user asks**

```powershell
git add package.json scripts/vtracer/convert-crop.mjs docs/Crops/Corn/SVG/Generated
git commit -m "chore: add vtracer crop conversion pipeline"
```

---

### Task 4: Batch Convert One Crop Folder

**Files:**
- Create: `scripts/vtracer/convert-crop-batch.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add batch script**

Create `scripts/vtracer/convert-crop-batch.mjs`:

```js
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
```

- [ ] **Step 2: Add npm script**

Modify `package.json` scripts:

```json
{
  "crop:vtracer:batch": "node scripts/vtracer/convert-crop-batch.mjs"
}
```

- [ ] **Step 3: Batch convert Corn**

Run:

```powershell
npm run crop:vtracer:batch -- --cropDir docs/Crops/Corn --outDir docs/Crops/Corn/SVG/Generated --preset gameClean
```

Expected:

```txt
Converted 5 PNG files with preset gameClean
docs/Crops/Corn/SVG/Generated/reports/_batch.gameClean.json
```

- [ ] **Step 4: Review metrics before visual integration**

Open:

```txt
docs/Crops/Corn/SVG/Generated/reports/_batch.gameClean.json
```

Accept if:
- Stage03 optimized file is materially smaller than the existing ~526KB raw export.
- Seed/sprout outputs stay visually recognizable and materially smaller than mature/ready.
- No output contains root `style="display: block;"`.
- Every PNG has a review note in `docs/Crops/Corn/SVG/Generated/reports/_preset-review.md` explaining whether `gameClean`, `gameDetailed`, `animationCandidate`, or `tinyRuntime` is the best export preset for that specific image.

- [ ] **Step 5: Commit checkpoint only if the user asks**

```powershell
git add package.json scripts/vtracer/convert-crop-batch.mjs docs/Crops/Corn/SVG/Generated
git commit -m "chore: add vtracer crop batch conversion"
```

---

### Task 5: Review Each PNG And Choose The Right Export Preset

**Files:**
- Create: `scripts/vtracer/review-crop-candidates.mjs`
- Create: `docs/Crops/Corn/SVG/Generated/reports/_preset-review.md`
- Create: `docs/Crops/Corn/SVG/Generated/review.html`
- Modify: `package.json`

- [ ] **Step 1: Add candidate review page generator**

Create `scripts/vtracer/review-crop-candidates.mjs`:

```js
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));
const cropDir = required(args.cropDir, "--cropDir");
const generatedDir = args.generatedDir || join(cropDir, "SVG", "Generated");
const reportsDir = join(generatedDir, "reports");
const optimizedDir = join(generatedDir, "optimized");
const output = args.output || join(generatedDir, "review.html");

const pngFiles = readdirSync(cropDir)
  .filter((file) => file.toLowerCase().endsWith(".png"))
  .sort();
const reportFiles = existsSync(reportsDir)
  ? readdirSync(reportsDir).filter((file) => file.endsWith(".json") && !file.startsWith("_")).sort()
  : [];

const reports = reportFiles.map((file) => JSON.parse(readFileSync(join(reportsDir, file), "utf8")));

const rows = pngFiles.map((pngFile) => {
  const imageBase = basename(pngFile, ".png");
  const candidates = reports.filter((report) => basename(report.input, ".png") === imageBase);
  return { pngFile, imageBase, candidates };
});

const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VTracer Crop Candidate Review</title>
    <style>
      body { margin: 0; padding: 24px; font-family: Inter, system-ui, sans-serif; background: #f7f1df; color: #173c27; }
      h1 { margin: 0 0 8px; color: #245d32; }
      .subtitle { margin: 0 0 24px; color: #63715c; }
      .image-review { margin-bottom: 28px; padding: 18px; border: 1px solid #e4d6ad; border-radius: 10px; background: #fff9e8; }
      .candidate-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
      .candidate { padding: 12px; border: 1px solid rgba(116, 83, 40, 0.18); border-radius: 8px; background: #fffdf6; }
      .candidate img { display: block; width: 100%; height: 220px; object-fit: contain; background: linear-gradient(180deg, #fffaf0, #eee0bf); border-radius: 6px; }
      .tile-sizes { display: flex; align-items: end; gap: 10px; min-height: 132px; margin-top: 10px; padding: 10px; border-radius: 6px; background: #f1e4c5; }
      .tile-sizes figure { margin: 0; text-align: center; color: #63715c; font-size: 11px; }
      .tile-sizes img { width: auto; max-width: none; background: transparent; border-radius: 0; }
      .tile-preview--80 img { height: 80px; }
      .tile-preview--100 img { height: 100px; }
      .tile-preview--120 img { height: 120px; }
      .metric { margin: 8px 0 0; color: #63715c; font-size: 12px; line-height: 1.45; }
      .missing { color: #a14a28; font-weight: 700; }
    </style>
  </head>
  <body>
    <h1>VTracer Crop Candidate Review</h1>
    <p class="subtitle">Review từng PNG trước khi chọn preset export. Không dùng một preset chung nếu ảnh/state khác nhau cho kết quả kém.</p>
    ${rows.map((row) => renderRow(row, cropDir, optimizedDir)).join("\n")}
  </body>
</html>`;

mkdirSync(resolve(generatedDir), { recursive: true });
writeFileSync(output, `${html}\n`);
console.log(output);

function renderRow(row, cropDir, optimizedDir) {
  const source = toBrowserPath(relative(dirnameFor(output), join(cropDir, row.pngFile)));
  const candidates = row.candidates.length > 0
    ? row.candidates.map((candidate) => renderCandidate(candidate, output)).join("\n")
    : `<p class="missing">No generated SVG candidates found for ${row.pngFile}.</p>`;

  return `<section class="image-review">
      <h2>${row.pngFile}</h2>
      <div class="candidate-grid">
        <article class="candidate">
          <h3>Source PNG</h3>
          <img src="${source}" alt="${row.pngFile}" />
          <p class="metric">Use this as the visual reference. The accepted SVG should preserve silhouette, color identity, and crop anchor.</p>
        </article>
        ${candidates}
      </div>
    </section>`;
}

function renderCandidate(candidate, htmlOutput) {
  const src = toBrowserPath(relative(dirnameFor(htmlOutput), candidate.optimizedSvg));
  return `<article class="candidate">
      <h3>${candidate.presetName}</h3>
      <img src="${src}" alt="${candidate.presetName}" />
      <div class="tile-sizes" aria-label="Tile-size preview">
        <figure class="tile-preview tile-preview--80"><img src="${src}" alt="" /><figcaption>80px</figcaption></figure>
        <figure class="tile-preview tile-preview--100"><img src="${src}" alt="" /><figcaption>100px</figcaption></figure>
        <figure class="tile-preview tile-preview--120"><img src="${src}" alt="" /><figcaption>120px</figcaption></figure>
      </div>
      <p class="metric">Raw: ${formatKb(candidate.raw.bytes)}KB, paths ${candidate.raw.pathCount}, colors ${candidate.raw.uniqueFillCount}</p>
      <p class="metric">Optimized: ${formatKb(candidate.optimized.bytes)}KB, paths ${candidate.optimized.pathCount}, colors ${candidate.optimized.uniqueFillCount}</p>
    </article>`;
}

function dirnameFor(filePath) {
  return resolve(filePath).replace(/[\\\\/][^\\\\/]+$/, "");
}

function formatKb(bytes) {
  return Math.round((bytes / 1024) * 10) / 10;
}

function toBrowserPath(path) {
  return path.replace(/\\\\/g, "/");
}

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
```

- [ ] **Step 2: Add npm script**

Modify `package.json` scripts:

```json
{
  "crop:vtracer:review": "node scripts/vtracer/review-crop-candidates.mjs"
}
```

- [ ] **Step 3: Generate candidates for at least two presets per image**

Run these before opening the review page:

```powershell
npm run crop:vtracer:batch -- --cropDir docs/Crops/Corn --outDir docs/Crops/Corn/SVG/Generated --preset gameClean
npm run crop:vtracer:batch -- --cropDir docs/Crops/Corn --outDir docs/Crops/Corn/SVG/Generated --preset animationCandidate
npm run crop:vtracer:review -- --cropDir docs/Crops/Corn --generatedDir docs/Crops/Corn/SVG/Generated
```

Expected:

```txt
docs/Crops/Corn/SVG/Generated/review.html
```

- [ ] **Step 4: Review every source PNG visually**

Open:

```txt
http://127.0.0.1:3000/docs/Crops/Corn/SVG/Generated/review.html
```

For every PNG/state, choose the preset using these rules:
- The SVG must keep the crop silhouette recognizable at the in-game tile size.
- The SVG must preserve important colors and outlines.
- The SVG must not include obvious speckle/noise blobs around the crop.
- The SVG should use the smallest path/color count that still looks good.
- Animation candidates should favor fewer layers and clearer regions over tiny texture details.

- [ ] **Step 5: Record the chosen preset per image**

Create `docs/Crops/Corn/SVG/Generated/reports/_preset-review.md`:

```md
# Corn VTracer Preset Review

| Source PNG | Chosen Preset | Reason | Accepted For |
|---|---|---|---|
| World_Crop_Corn_Body_Stage00.png | tinyRuntime | Small state stays readable and avoids unnecessary detail. | seed state |
| World_Crop_Corn_Body_Stage01.png | gameClean | Keeps sprout silhouette while limiting path count. | sprout state |
| World_Crop_Corn_Body_Stage02.png | gameClean | Preserves leaf shape with acceptable size. | young state |
| World_Crop_Corn_Body_Stage03.png | animationCandidate | Best tradeoff for grouping leaves, ears, tassels, and stalk. | ready state animation pilot |
| World_Crop_Corn_Body_Dead.png | gameClean | Keeps dry silhouette and avoids over-traced texture noise. | dead state |
```

Update the table with actual review results. The example values above are starting assumptions, not final truth.

- [ ] **Step 6: Commit checkpoint only if the user asks**

```powershell
git add package.json scripts/vtracer/review-crop-candidates.mjs docs/Crops/Corn/SVG/Generated/review.html docs/Crops/Corn/SVG/Generated/reports/_preset-review.md
git commit -m "chore: add vtracer candidate review workflow"
```

---

### Task 6: Prepare One Inline SVG Candidate For Per-Part Animation

**Files:**
- Create: `scripts/vtracer/prepare-inline-svg.mjs`
- Create: `docs/Crops/Corn/SVG/Prepared/World_Crop_Corn_Body_Stage03.inline.svg`

- [ ] **Step 1: Add inline preparation script**

Create `scripts/vtracer/prepare-inline-svg.mjs`:

```js
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
```

- [ ] **Step 2: Generate prepared inline SVG from the reviewed preset**

Read the selected preset for `World_Crop_Corn_Body_Stage03.png` from:

```txt
docs/Crops/Corn/SVG/Generated/reports/_preset-review.md
```

Use that selected optimized SVG as input. If the review selects `animationCandidate`, run:

Run:

```powershell
npm run crop:vtracer:inline -- --input docs/Crops/Corn/SVG/Generated/optimized/World_Crop_Corn_Body_Stage03.animationCandidate.svg --output docs/Crops/Corn/SVG/Prepared/World_Crop_Corn_Body_Stage03.inline.svg --rootClass "imported-crop imported-crop--corn imported-crop--stage03" --idPrefix "corn-stage03"
```

If review selects `gameClean`, replace `.animationCandidate.svg` with `.gameClean.svg`. Do not prepare an inline animation candidate before the PNG-specific review is recorded.

Expected:
- Prepared SVG exists.
- XML header/comment are removed.
- Root `<svg>` has classes.
- Referenced IDs and matching `url(#...)`/`href="#..."` references are prefixed with `corn-stage03-`.
- Unreferenced path IDs are removed to reduce duplicate DOM IDs when multiple inline crops render together.
- Paths have `imported-crop__path`.
- One temporary group `corn-part--unclassified` wraps raw paths.

- [ ] **Step 3: Manually classify the first pilot groups**

Open `docs/Crops/Corn/SVG/Prepared/World_Crop_Corn_Body_Stage03.inline.svg`.

Replace the single unclassified group with 4-6 semantic groups by moving path elements into:

```svg
<g class="corn-part corn-part--stalk"></g>
<g class="corn-part corn-part--leaves corn-part--leaves-left"></g>
<g class="corn-part corn-part--leaves corn-part--leaves-right"></g>
<g class="corn-part corn-part--ears"></g>
<g class="corn-part corn-part--tassels"></g>
<g class="corn-part corn-part--base"></g>
```

Classification guidance:
- green vertical center paths -> `corn-part--stalk`
- large green side leaf shapes -> `corn-part--leaves-left` or `corn-part--leaves-right`
- yellow corn cob shapes -> `corn-part--ears`
- thin yellow top hair/tassel shapes -> `corn-part--tassels`
- brown/gray bottom cluster -> `corn-part--base`

Accept if each group has at least one path and the SVG still renders visually close to the optimized input.

- [ ] **Step 4: Commit checkpoint only if the user asks**

```powershell
git add scripts/vtracer/prepare-inline-svg.mjs docs/Crops/Corn/SVG/Prepared/World_Crop_Corn_Body_Stage03.inline.svg
git commit -m "chore: prepare corn vtracer svg for grouped animation"
```

---

### Task 7: Demo Per-Part Animation With Inline SVG

**Files:**
- Create: `corn-vtracer-parts-demo.html`

- [ ] **Step 1: Create inline animation demo**

Create `corn-vtracer-parts-demo.html`:

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Corn VTracer Parts Animation Demo</title>
    <style>
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f7f1df;
        font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      }

      .demo-stage {
        width: min(720px, 92vw);
        aspect-ratio: 1.25;
        position: relative;
        display: grid;
        place-items: center;
        border: 1px solid #e4d6ad;
        border-radius: 12px;
        background: linear-gradient(180deg, #fffdf6, #fff6dc);
        overflow: hidden;
      }

      .soil {
        position: absolute;
        left: 50%;
        bottom: 15%;
        width: 52%;
        aspect-ratio: 1.95;
        transform: translateX(-50%) rotate(45deg) skew(-15deg, -15deg);
        border: 5px solid #7a4a2c;
        border-radius: 8px;
        background: linear-gradient(135deg, #c18447, #8d5631);
        box-shadow: 18px 18px 0 #5c3c2c;
      }

      .crop-anchor {
        position: absolute;
        left: 50%;
        bottom: 11%;
        width: 46%;
        transform: translateX(-50%);
        transform-origin: 50% 100%;
      }

      .imported-crop {
        width: 100%;
        height: auto;
        overflow: visible;
        filter: drop-shadow(0 16px 12px rgba(48, 36, 20, 0.18));
      }

      .corn-part {
        transform-box: fill-box;
        transform-origin: 50% 100%;
      }

      .corn-part--stalk {
        animation: stalk-sway 2.8s ease-in-out infinite;
      }

      .corn-part--leaves-left {
        transform-origin: 80% 85%;
        animation: leaf-left-sway 2.6s ease-in-out infinite;
      }

      .corn-part--leaves-right {
        transform-origin: 20% 85%;
        animation: leaf-right-sway 2.6s ease-in-out infinite;
      }

      .corn-part--ears {
        animation: ears-bob 2.9s ease-in-out infinite;
      }

      .corn-part--tassels {
        transform-origin: 50% 90%;
        animation: tassel-wave 1.9s ease-in-out infinite;
      }

      .corn-part--base {
        animation: base-settle 3s ease-in-out infinite;
      }

      @keyframes stalk-sway {
        0%, 100% { transform: rotate(-1deg); }
        50% { transform: rotate(1.4deg); }
      }

      @keyframes leaf-left-sway {
        0%, 100% { transform: rotate(1.5deg) translateY(0); }
        50% { transform: rotate(-4deg) translateY(-2px); }
      }

      @keyframes leaf-right-sway {
        0%, 100% { transform: rotate(-1.5deg) translateY(0); }
        50% { transform: rotate(4deg) translateY(-2px); }
      }

      @keyframes ears-bob {
        0%, 100% { transform: translateY(0) rotate(-0.5deg); }
        50% { transform: translateY(-3px) rotate(0.8deg); }
      }

      @keyframes tassel-wave {
        0%, 100% { transform: rotate(-3deg); }
        50% { transform: rotate(3deg); }
      }

      @keyframes base-settle {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.015); }
      }
    </style>
  </head>
  <body>
    <main class="demo-stage">
      <div class="soil"></div>
      <div class="crop-anchor">
        <!-- Paste the prepared inline SVG content here for the first pilot review. -->
      </div>
    </main>
  </body>
</html>
```

- [ ] **Step 2: Paste prepared inline SVG into the demo**

Replace:

```html
<!-- Paste the prepared inline SVG content here for the first pilot review. -->
```

with the full content of:

```txt
docs/Crops/Corn/SVG/Prepared/World_Crop_Corn_Body_Stage03.inline.svg
```

- [ ] **Step 3: Browser smoke review**

Open:

```txt
http://127.0.0.1:3000/corn-vtracer-parts-demo.html
```

Accept if:
- The crop renders on the 2.5D soil.
- Leaves, tassels, ears, stalk/base move independently.
- There is no whole-image-only motion.
- The SVG does not overflow badly on a 390px wide viewport.

- [ ] **Step 4: Commit checkpoint only if the user asks**

```powershell
git add corn-vtracer-parts-demo.html
git commit -m "demo: animate corn vtracer svg parts"
```

---

### Task 8: Decide Whether To Replace The Procedural Corn Renderer

**Files:**
- Modify later only if the pilot is approved:
  - `src/ui/crop-art/cornCrop.ts`
  - `src/styles/crop-art/_corn.scss`
  - `src/ui/crop-art/cropArt.test.ts`
  - `src/ui/render.test.ts`

- [ ] **Step 1: Compare the pilot against the current procedural corn**

Review side by side:

```txt
http://127.0.0.1:3000/review.html
http://127.0.0.1:3000/corn-vtracer-parts-demo.html
```

Accept replacement only if:
- The prepared SVG is clearly better visually.
- The optimized SVG size is acceptable for runtime.
- Per-part animation looks better than whole-image sway.
- Grouping effort is repeatable for other crop states.

- [ ] **Step 2: If accepted, write a focused integration plan**

Create a separate plan before app integration:

```txt
docs/plans/YYYY-MM-DD-integrate-vtracer-corn-crop.md
```

That plan must cover:
- How prepared SVG is embedded into `cornCrop.ts`.
- How stage variants are selected.
- How SCSS animates semantic groups.
- How tests verify no raw inline `style` leaks into renderer output.
- How review.html proves the corn states stay aligned.

- [ ] **Step 3: If rejected, adjust VTracer preset first**

Before redrawing SVG by hand, test these preset changes one at a time:

```txt
Increase filter_speckle: 8 -> 12
Increase gradient_step: 24 -> 32 or 40
Lower color_precision: 5 -> 4
Compare hierarchical: stacked vs cutout
Increase segment_length: 6 -> 8 or 10
```

Record results in:

```txt
docs/Crops/Corn/SVG/Generated/reports/_preset-comparison.md
```

---

## Verification Checklist

Run only focused checks for this setup:

```powershell
npm run crop:vtracer:setup
npm run crop:vtracer:check
npm test -- src/tools/vtracer/svgMetrics.test.ts
npm run crop:vtracer:convert -- --input docs/Crops/Corn/World_Crop_Corn_Body_Stage03.png --outDir docs/Crops/Corn/SVG/Generated --preset gameClean
npm run crop:vtracer:batch -- --cropDir docs/Crops/Corn --outDir docs/Crops/Corn/SVG/Generated --preset gameClean
npm run crop:vtracer:batch -- --cropDir docs/Crops/Corn --outDir docs/Crops/Corn/SVG/Generated --preset animationCandidate
npm run crop:vtracer:review -- --cropDir docs/Crops/Corn --generatedDir docs/Crops/Corn/SVG/Generated
```

Browser smoke:

```txt
http://127.0.0.1:3000/docs/Crops/Corn/SVG/Generated/review.html
http://127.0.0.1:3000/corn-vtracer-parts-demo.html
```

Do not run the full validation suite for this setup. It is an asset pipeline/demo change, so focused CLI checks and browser smoke are enough.

---

## Self-Review

- Spec coverage: The plan covers VTracer installation, automatic setup script, repeatable presets, tuning principles, single conversion, batch conversion, per-image candidate review, tile-size visual review, SVGO optimization, metrics reports, inline SVG preparation, ID prefixing, and per-part animation demo.
- Placeholder scan: No implementation step depends on vague "later" work. Manual grouping is explicitly scoped to named groups and acceptance criteria. Per-image preset review is required before accepting SVG outputs.
- Type consistency: Script names and npm script names are consistent across tasks.
- Project rules: The plan uses `docs/plans/`, avoids `.agent/`, avoids committing without explicit user approval, and uses narrow verification.
