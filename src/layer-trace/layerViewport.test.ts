import { describe, expect, it } from "vitest";
import { toUnscaledCanvasPoint } from "./layerViewport";

describe("layer viewport coordinate mapping", () => {
  it("maps zoomed pointer positions back to original canvas coordinates", () => {
    const point = toUnscaledCanvasPoint(
      { clientX: 260, clientY: 170 },
      { left: 20, top: 10, width: 400, height: 300 },
      { width: 200, height: 150 }
    );

    expect(point).toEqual({ x: 120, y: 80 });
  });
});
