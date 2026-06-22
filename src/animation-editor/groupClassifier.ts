export type ColorFamily = "green" | "yellow" | "red" | "orange" | "brown" | "neutral" | "unknown";
export type RegionX = "left" | "center" | "right";
export type RegionY = "top" | "middle" | "bottom";

export interface PathBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ClassifiedPath {
  id: string;
  markup: string;
  fill: string;
  colorFamily: ColorFamily;
  pathIndex: number;
  bounds: PathBounds;
  center: {
    x: number;
    y: number;
  };
}

export interface CropGroup {
  id: string;
  label: string;
  suggestedPart: string;
  colorFamily: ColorFamily;
  regionX: RegionX;
  regionY: RegionY;
  hidden: boolean;
  paths: ClassifiedPath[];
}

export interface ClassificationResult {
  groups: CropGroup[];
}

export function classifySvgPaths(svgText: string, cropId: string): ClassificationResult {
  const paths = Array.from(svgText.matchAll(/<path\b[^>]*>/gi)).map((match, pathIndex) => {
    const markup = match[0];
    const fill = readFill(markup);
    const colorFamily = classifyColor(fill);
    const bounds = readBounds(markup);

    return {
      id: `path-${pathIndex}`,
      markup,
      fill,
      colorFamily,
      pathIndex,
      bounds,
      center: {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2
      }
    };
  });

  if (paths.length === 0) {
    return { groups: [] };
  }

  const allBounds = readViewBoxBounds(svgText) || combineBounds(paths.map((path) => path.bounds));
  const grouped = new Map<string, CropGroup>();

  for (const path of paths) {
    const regionX = classifyRegionX(path.center.x, allBounds);
    const regionY = classifyRegionY(path.center.y, allBounds);
    const id = `cluster-${path.colorFamily}-${regionX}-${regionY}`;
    const existing = grouped.get(id);

    if (existing) {
      existing.paths.push(path);
      continue;
    }

    const suggestedPart = suggestPart(cropId, path.colorFamily, regionX, regionY);
    grouped.set(id, {
      id,
      label: suggestedPart,
      suggestedPart,
      colorFamily: path.colorFamily,
      regionX,
      regionY,
      hidden: false,
      paths: [path]
    });
  }

  return { groups: Array.from(grouped.values()) };
}

function readFill(markup: string): string {
  const fillAttr = markup.match(/\bfill=["']([^"']+)["']/i)?.[1];
  if (fillAttr) return fillAttr;

  const styleFill = markup.match(/\bstyle=["'][^"']*fill:\s*([^;"']+)/i)?.[1];
  return styleFill?.trim() || "unknown";
}

function readBounds(markup: string): PathBounds {
  const d = markup.match(/\bd=["']([^"']+)["']/i)?.[1] || "";
  const numbers = Array.from(d.matchAll(/-?\d+(?:\.\d+)?/g)).map((match) => Number(match[0]));
  const translate = readTranslate(markup);
  const xs: number[] = [];
  const ys: number[] = [];

  for (let index = 0; index < numbers.length; index += 2) {
    xs.push(numbers[index] + translate.x);
    if (typeof numbers[index + 1] === "number") {
      ys.push(numbers[index + 1] + translate.y);
    }
  }

  if (xs.length === 0 || ys.length === 0) {
    return { minX: translate.x, minY: translate.y, maxX: translate.x, maxY: translate.y };
  }

  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys)
  };
}

function readTranslate(markup: string): { x: number; y: number } {
  const match = markup.match(/\btransform=["'][^"']*translate\(\s*(-?\d+(?:\.\d+)?)(?:[\s,]+(-?\d+(?:\.\d+)?))?\s*\)/i);
  return {
    x: match ? Number(match[1]) : 0,
    y: match && match[2] ? Number(match[2]) : 0
  };
}

function classifyColor(fill: string): ColorFamily {
  const rgb = parseColor(fill);
  if (!rgb) return "unknown";
  const { r, g, b } = rgb;

  if (g > r + 20 && g > b + 20) return "green";
  if (r > 150 && g > 100 && b < 120) return r - g > 55 ? "orange" : "yellow";
  if (r > 140 && g < 110 && b < 110) return "red";
  if (r > 80 && r > g + 15 && g > b + 10) return "brown";
  if (Math.abs(r - g) < 18 && Math.abs(g - b) < 18) return "neutral";
  return "unknown";
}

function parseColor(fill: string): { r: number; g: number; b: number } | null {
  const value = fill.trim().toLowerCase();
  if (value.startsWith("#")) {
    const hex = value.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16)
      };
    }
    if (hex.length >= 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
      };
    }
  }

  const rgb = value.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (rgb) {
    return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  }

  return null;
}

function combineBounds(bounds: PathBounds[]): PathBounds {
  return {
    minX: Math.min(...bounds.map((bound) => bound.minX)),
    minY: Math.min(...bounds.map((bound) => bound.minY)),
    maxX: Math.max(...bounds.map((bound) => bound.maxX)),
    maxY: Math.max(...bounds.map((bound) => bound.maxY))
  };
}

function readViewBoxBounds(svgText: string): PathBounds | null {
  const viewBox = svgText.match(/\bviewBox=["']([^"']+)["']/i)?.[1];
  if (!viewBox) return null;

  const values = viewBox.trim().split(/[\s,]+/).map(Number);
  if (values.length !== 4 || values.some((value) => Number.isNaN(value))) {
    return null;
  }

  const [x, y, width, height] = values;
  return {
    minX: x,
    minY: y,
    maxX: x + width,
    maxY: y + height
  };
}

function classifyRegionX(x: number, bounds: PathBounds): RegionX {
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const ratio = (x - bounds.minX) / width;
  if (ratio < 0.4) return "left";
  if (ratio > 0.6) return "right";
  return "center";
}

function classifyRegionY(y: number, bounds: PathBounds): RegionY {
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const ratio = (y - bounds.minY) / height;
  if (ratio < 0.2) return "top";
  if (ratio > 0.66) return "bottom";
  return "middle";
}

function suggestPart(cropId: string, colorFamily: ColorFamily, regionX: RegionX, regionY: RegionY): string {
  if (cropId.toLowerCase() === "corn") {
    if (colorFamily === "brown" && regionY === "bottom") return "base";
    if (colorFamily === "yellow" && regionY === "top") return "tassels";
    if (colorFamily === "yellow") return "ears";
    if (colorFamily === "green" && regionX === "left") return "leaves-left";
    if (colorFamily === "green" && regionX === "right") return "leaves-right";
    if (colorFamily === "green") return "stem";
    return "other";
  }

  if (colorFamily === "brown" && regionY === "bottom") return "base";
  if (colorFamily === "green" && regionY === "top") return "leaves";
  if (colorFamily === "green") return "stem";
  if (colorFamily === "red" || colorFamily === "orange" || colorFamily === "yellow") return "fruit";
  return "other";
}
