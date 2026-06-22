import { existsSync, readdirSync, writeFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { optimize } from "svgo";

// 1. Detect VTracer binary
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
  ].filter(p => typeof p === "string" && p !== "");

  for (const p of possiblePaths) {
    if (p !== "vtracer" && !existsSync(p)) {
      continue;
    }
    try {
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
    } catch {
      // Ignore
    }
  }
  return null;
}

const vtracerBin = detectVTracer();
if (!vtracerBin) {
  console.error("VTracer CLI binary not found on this system.");
  process.exit(1);
}

// 2. Load Presets
const presetsPath = resolve("docs/Crops/vtracer-presets.json");
if (!existsSync(presetsPath)) {
  console.error("Presets file not found.");
  process.exit(1);
}
const presets = JSON.parse(readFileSync(presetsPath, "utf8"));
const params = presets.animationCandidate;
if (!params) {
  console.error("animationCandidate preset not found in presets file.");
  process.exit(1);
}

// 3. Scan Crops Directory
const cropsDir = resolve("docs/Crops");
if (!existsSync(cropsDir)) {
  console.error("Crops directory does not exist.");
  process.exit(1);
}

const entries = readdirSync(cropsDir, { withFileTypes: true });

for (const entry of entries) {
  if (entry.isDirectory() && entry.name !== "SVG" && entry.name !== "Generated") {
    const cropName = entry.name;
    const cropPath = join(cropsDir, cropName);
    console.log(`\nProcessing crop: ${cropName}...`);

    const files = readdirSync(cropPath);
    const pngs = files.filter(f => f.toLowerCase().endsWith(".png"));

    const stagesPayload = {};

    for (const file of pngs) {
      // Only trace standard crop stage PNG files
      const nameMatch = file.match(/_Body_(Stage\d+|Dead)\.png$/i);
      if (!nameMatch) {
        console.log(`  Skipping file: ${file} (does not match stage pattern)`);
        continue;
      }

      const stageName = nameMatch[1].toLowerCase();
      const inputPath = join(cropPath, file);
      console.log(`  Tracing: ${file} -> ${stageName}...`);

      const tmpDir = resolve("docs/Crops/Generated/tmp");
      if (!existsSync(tmpDir)) {
        mkdirSync(tmpDir, { recursive: true });
      }
      const tmpRawSvg = join(tmpDir, `auto_trace_${Date.now()}.raw.svg`);

      const cliArgs = [
        "--input", inputPath,
        "--output", tmpRawSvg,
        "--colormode", params.colormode || "color",
        "--mode", params.mode || "spline",
        "--hierarchical", params.hierarchical || "stacked",
        "--color_precision", String(params.color_precision ?? 7),
        "--filter_speckle", String(params.filter_speckle ?? 6),
        "--gradient_step", String(params.gradient_step ?? 14),
        "--corner_threshold", String(params.corner_threshold ?? 60),
        "--segment_length", String(params.segment_length ?? 4.0),
        "--splice_threshold", String(params.splice_threshold ?? 45),
        "--path_precision", String(params.path_precision ?? 2)
      ];

      const traceResult = spawnSync(vtracerBin, cliArgs, {
        encoding: "utf8",
        shell: process.platform === "win32"
      });

      if (traceResult.status !== 0) {
        console.error(`    Error tracing ${file}:`, traceResult.stderr || traceResult.error?.message);
        if (existsSync(tmpRawSvg)) rmSync(tmpRawSvg, { force: true });
        continue;
      }

      const rawText = readFileSync(tmpRawSvg, "utf8");
      rmSync(tmpRawSvg, { force: true });

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
        stagesPayload[stageName] = optimized.data;
      } else {
        console.error(`    Error optimizing SVG for ${file}`);
      }
    }

    const totalMapped = Object.keys(stagesPayload).length;
    if (totalMapped > 0) {
      console.log(`  Saving config and ${totalMapped} SVGs for ${cropName}...`);
      
      const targetDir = resolve("src/assets/crops", cropName.toLowerCase());
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }

      const metaStages = {};

      for (const [stageName, svgContent] of Object.entries(stagesPayload)) {
        const fileName = `${stageName}.svg`;
        const filePath = join(targetDir, fileName);
        writeFileSync(filePath, svgContent, "utf8");
        metaStages[stageName] = fileName;
      }

      const metaPath = join(targetDir, "meta.json");
      const metaContent = {
        cropName,
        stages: metaStages
      };
      writeFileSync(metaPath, JSON.stringify(metaContent, null, 2), "utf8");
      console.log(`  Saved configuration to ${metaPath}`);
    } else {
      console.log(`  No stages mapped for ${cropName}, skipping save.`);
    }
  }
}

console.log("\nAuto tracing completed successfully!");
