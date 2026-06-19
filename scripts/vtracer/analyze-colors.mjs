import { readFileSync } from "node:fs";

const file = "docs/Crops/Corn/SVG/Prepared/World_Crop_Corn_Body_Stage03.inline.svg";
const content = readFileSync(file, "utf8");

// Extract fills using a robust regex that matches fill="..." attributes
const fills = {};
const pathRegex = /<path[^>]+fill=["']([^"']+)["']/g;
let match;
while ((match = pathRegex.exec(content)) !== null) {
  const fill = match[1];
  fills[fill] = (fills[fill] || 0) + 1;
}

console.log(JSON.stringify(fills, null, 2));
