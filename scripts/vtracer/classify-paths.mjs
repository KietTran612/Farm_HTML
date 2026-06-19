import { readFileSync, writeFileSync } from "node:fs";
import { optimize } from "svgo";

const rawFile = "docs/Crops/Corn/SVG/Generated/raw/World_Crop_Corn_Body_Stage03.animationCandidate.raw.svg";
const outputFile = "docs/Crops/Corn/SVG/Prepared/World_Crop_Corn_Body_Stage03.inline.svg";

const content = readFileSync(rawFile, "utf8");

// Parse SVG paths from raw file
const pathRegex = /<path([^>]+)>/g;
const paths = [];
let match;
while ((match = pathRegex.exec(content)) !== null) {
  const attrs = match[1];
  const fillMatch = attrs.match(/\bfill=["']([^"']+)["']/i);
  const dMatch = attrs.match(/\bd=["']([^"']+)["']/i);
  
  if (fillMatch && dMatch) {
    paths.push({
      fullElement: match[0],
      attrs: attrs,
      fill: fillMatch[1],
      d: dMatch[1]
    });
  }
}

console.log(`Found ${paths.length} raw paths to classify.`);

const groups = {
  stalk: [],
  leavesLeft: [],
  leavesRight: [],
  ears: [],
  tassels: [],
  base: []
};

for (const path of paths) {
  // Parse coordinates
  const coords = Array.from(path.d.matchAll(/-?\d+(?:\.\d+)?/g)).map(Number);
  const xs = coords.filter((_, idx) => idx % 2 === 0);
  const ys = coords.filter((_, idx) => idx % 2 === 1);
  const avgX = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  const avgY = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : 0;

  // Parse translation
  const transformMatch = path.attrs.match(/transform=["']translate\(([^,\s)]+)[,\s]+([^)]+)\)["']/i);
  let tx = 0, ty = 0;
  if (transformMatch) {
    tx = parseFloat(transformMatch[1]);
    ty = parseFloat(transformMatch[2]);
  }

  const actualX = avgX + tx;
  const actualY = avgY + ty;

  // Parse color
  const hex = path.fill.toLowerCase();
  let r = 0, g = 0, b = 0;
  if (hex.startsWith("#")) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }

  // Classification rules
  const isYellow = (r > 150 && g > 100 && b < 140);
  const isBrownish = (r > g);
  
  if (actualY > 800 || (actualY > 750 && isBrownish)) {
    // Anything at the very bottom or brownish at the bottom is base
    groups.base.push(path.fullElement);
  } else if (isYellow) {
    if (actualY < 320) {
      groups.tassels.push(path.fullElement);
    } else {
      groups.ears.push(path.fullElement);
    }
  } else {
    // Greenish / Stalk / Leaves
    if (actualX >= 350 && actualX <= 418 && actualY > 320) {
      groups.stalk.push(path.fullElement);
    } else if (actualX < 384) {
      groups.leavesLeft.push(path.fullElement);
    } else {
      groups.leavesRight.push(path.fullElement);
    }
  }
}

console.log("Classification Results:");
for (const [key, list] of Object.entries(groups)) {
  console.log(`  - ${key}: ${list.length} paths`);
}

// Generate the grouped raw SVG content
const svgHeaderMatch = content.match(/<svg[^>]*>/i);
if (!svgHeaderMatch) {
  console.error("Could not find <svg> tag in file.");
  process.exit(1);
}

const rootClass = "imported-crop imported-crop--corn imported-crop--stage03";
const idPrefix = "corn-stage03";
let svgHeader = svgHeaderMatch[0]
  .replace(/<svg\b/i, `<svg class="${rootClass}"`);

const rawGroupedSvg = `${svgHeader}
  <g class="corn-part corn-part--base">
    ${groups.base.join("\n    ")}
  </g>
  <g class="corn-part corn-part--stalk">
    ${groups.stalk.join("\n    ")}
  </g>
  <g class="corn-part corn-part--leaves corn-part--leaves-left">
    ${groups.leavesLeft.join("\n    ")}
  </g>
  <g class="corn-part corn-part--leaves corn-part--leaves-right">
    ${groups.leavesRight.join("\n    ")}
  </g>
  <g class="corn-part corn-part--ears">
    ${groups.ears.join("\n    ")}
  </g>
  <g class="corn-part corn-part--tassels">
    ${groups.tassels.join("\n    ")}
  </g>
</svg>`;

// Run SVGO optimization on the grouped SVG
console.log("Optimizing grouped SVG with SVGO...");
const optimized = optimize(rawGroupedSvg, {
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

let svgText = optimized.data;

// Clean up comments and displays
svgText = svgText
  .replace(/<\?xml[^>]*>\s*/i, "")
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/\sstyle=["']display:\s*block;?["']/i, "");

// Prefix IDs and handle url() references
const ids = Array.from(svgText.matchAll(/\bid=["']([^"']+)["']/gi)).map((match) => match[1]);
const referencedIds = new Set();
for (const match of svgText.matchAll(/url\(#([^)]+)\)/gi)) {
  referencedIds.add(match[1]);
}
for (const match of svgText.matchAll(/\b(?:href|xlink:href)=["']#([^"']+)["']/gi)) {
  referencedIds.add(match[1]);
}

for (const id of ids) {
  const prefixed = `${idPrefix}-${id}`;
  if (referencedIds.has(id)) {
    svgText = svgText
      .replace(new RegExp(`id=["']${escapeRegExp(id)}["']`, "g"), `id="${prefixed}"`)
      .replace(new RegExp(`url\\(#${escapeRegExp(id)}\\)`, "g"), `url(#${prefixed})`)
      .replace(new RegExp(`(href|xlink:href)=["']#${escapeRegExp(id)}["']`, "g"), `$1="#${prefixed}"`);
  } else {
    svgText = svgText.replace(new RegExp(`\\s+id=["']${escapeRegExp(id)}["']`, "g"), "");
  }
}

// Add imported-crop__path class to all paths
svgText = svgText.replace(/<path\b/gi, '<path class="imported-crop__path"');

writeFileSync(outputFile, svgText);
console.log(`Successfully generated optimized grouped inline SVG in ${outputFile}`);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
