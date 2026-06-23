import { describe, expect, it } from "vitest";
import { calculatePivotFromSvgPoint } from "./pivotDrag";

describe("calculatePivotFromSvgPoint", () => {
  it("converts an SVG point inside bounds into clamped pivot percentages", () => {
    const pivot = calculatePivotFromSvgPoint(
      { x: 150, y: 260 },
      { minX: 100, minY: 200, maxX: 300, maxY: 500 }
    );

    expect(pivot).toEqual({ x: 25, y: 20 });
  });

  it("clamps SVG points outside bounds to the editable pivot range", () => {
    const pivot = calculatePivotFromSvgPoint(
      { x: 80, y: 550 },
      { minX: 100, minY: 200, maxX: 300, maxY: 500 }
    );

    expect(pivot).toEqual({ x: 0, y: 100 });
  });

  it("keeps the previous pivot when bounds are empty", () => {
    const previousPivot = { x: 45, y: 75 };
    const pivot = calculatePivotFromSvgPoint(
      { x: 100, y: 100 },
      { minX: 20, minY: 20, maxX: 20, maxY: 60 },
      previousPivot
    );

    expect(pivot).toEqual(previousPivot);
  });
});
