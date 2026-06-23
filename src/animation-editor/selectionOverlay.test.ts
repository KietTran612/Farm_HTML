import { describe, expect, it } from "vitest";
import { createSelectionBoundsRect } from "./selectionOverlay";

describe("selection overlay", () => {
  it("creates a padded SVG rect for the selected layer bounds", () => {
    const rect = createSelectionBoundsRect({
      minX: 10,
      minY: 20,
      maxX: 110,
      maxY: 220
    });

    expect(rect.getAttribute("class")).toBe("selection-bounds");
    expect(rect.getAttribute("x")).toBe("2");
    expect(rect.getAttribute("y")).toBe("12");
    expect(rect.getAttribute("width")).toBe("116");
    expect(rect.getAttribute("height")).toBe("216");
    expect(rect.getAttribute("rx")).toBe("6");
  });
});
