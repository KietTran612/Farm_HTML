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
