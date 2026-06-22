import { existsSync, readdirSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";

const args = parseArgs(process.argv.slice(2));
const targetCrop = args.crop;

const cropsDir = resolve("docs/Crops");
if (!existsSync(cropsDir)) {
  console.log("Docs Crops directory does not exist.");
  process.exit(0);
}

const entries = readdirSync(cropsDir, { withFileTypes: true });
let count = 0;

if (targetCrop) {
  const match = entries.find(e => e.isDirectory() && e.name.toLowerCase() === targetCrop.toLowerCase());
  if (match) {
    const targetGeneratedDir = join(cropsDir, match.name, "SVG", "Generated");
    if (existsSync(targetGeneratedDir)) {
      console.log(`Deleting: ${targetGeneratedDir}`);
      rmSync(targetGeneratedDir, { recursive: true, force: true });
      count++;
    } else {
      console.log(`No Generated directory found for crop: ${match.name}`);
    }
  } else {
    console.error(`Crop directory not found for: ${targetCrop}`);
    process.exit(1);
  }
} else {
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== "SVG" && entry.name !== "Generated") {
      const targetGeneratedDir = join(cropsDir, entry.name, "SVG", "Generated");
      if (existsSync(targetGeneratedDir)) {
        console.log(`Deleting: ${targetGeneratedDir}`);
        rmSync(targetGeneratedDir, { recursive: true, force: true });
        count++;
      }
    }
  }
}

console.log(`Successfully cleaned up ${count} crop generated directories.`);

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
