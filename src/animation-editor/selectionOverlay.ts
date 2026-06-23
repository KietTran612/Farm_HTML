import type { PathBounds } from "./groupClassifier";

const SVG_NS = "http://www.w3.org/2000/svg";
const SELECTION_PADDING = 8;

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}

export function createSelectionBoundsRect(bounds: PathBounds): SVGRectElement {
  const rect = document.createElementNS(SVG_NS, "rect");
  const x = bounds.minX - SELECTION_PADDING;
  const y = bounds.minY - SELECTION_PADDING;
  const width = Math.max(1, bounds.maxX - bounds.minX + SELECTION_PADDING * 2);
  const height = Math.max(1, bounds.maxY - bounds.minY + SELECTION_PADDING * 2);

  rect.setAttribute("class", "selection-bounds");
  rect.setAttribute("x", formatNumber(x));
  rect.setAttribute("y", formatNumber(y));
  rect.setAttribute("width", formatNumber(width));
  rect.setAttribute("height", formatNumber(height));
  rect.setAttribute("rx", "6");

  return rect;
}
