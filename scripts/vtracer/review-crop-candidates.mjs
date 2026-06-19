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
  return resolve(filePath).replace(/[\\\/][^\\\/]+$/, "");
}

function formatKb(bytes) {
  return Math.round((bytes / 1024) * 10) / 10;
}

function toBrowserPath(path) {
  return path.replace(/\\/g, "/");
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
