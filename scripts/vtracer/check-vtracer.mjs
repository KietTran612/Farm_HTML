import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

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

let foundBinary = null;
for (const p of possiblePaths) {
  // If it is not the global "vtracer" command and the file doesn't exist, skip it
  if (p !== "vtracer" && !existsSync(p)) {
    continue;
  }

  // Test running it
  const result = spawnSync(p, ["--help"], {
    encoding: "utf8",
    shell: process.platform === "win32"
  });

  if (result.status === 0) {
    const output = `${result.stdout}\n${result.stderr}`.trim();
    if (output.includes("--input") && output.includes("--output")) {
      foundBinary = p;
      break;
    }
  }
}

if (!foundBinary) {
  console.error("VTracer CLI was not found in any of these paths:");
  possiblePaths.forEach((p) => console.error(`  - ${p}`));
  console.error("Install with `cargo install vtracer`, download the official GitHub release, or set VTRACER_BIN.");
  process.exit(1);
}

// Set process env so child processes can inherit the resolved path
process.env.VTRACER_BIN = foundBinary;
console.log(`VTracer CLI is available via ${foundBinary}`);
