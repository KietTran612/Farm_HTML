import type { PivotPoint } from "./animationPresets";

export interface SvgPoint {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculatePivotFromSvgPoint(
  point: SvgPoint,
  bounds: Bounds,
  fallback: PivotPoint = { x: 50, y: 50 }
): PivotPoint {
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  if (width <= 0 || height <= 0) {
    return fallback;
  }

  return {
    x: clampPercent(((point.x - bounds.minX) / width) * 100),
    y: clampPercent(((point.y - bounds.minY) / height) * 100)
  };
}
