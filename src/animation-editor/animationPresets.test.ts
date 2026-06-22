import { describe, expect, it } from "vitest";
import { ANIMATION_PRESETS, getAnimationPreset, getDefaultPivotForPart, PIVOT_PRESETS } from "./animationPresets";

describe("animation presets", () => {
  it("exposes stable preset ids and labels", () => {
    expect(ANIMATION_PRESETS.map((preset) => preset.id)).toEqual([
      "none",
      "soft-sway",
      "sway-left",
      "sway-right",
      "leaf-breathe",
      "bob"
    ]);
    expect(getAnimationPreset("soft-sway")?.label).toBe("Soft sway");
  });

  it("maps every non-none preset to a CSS class", () => {
    const animatedPresets = ANIMATION_PRESETS.filter((preset) => preset.id !== "none");

    expect(animatedPresets.every((preset) => preset.cssClass.startsWith("anim-"))).toBe(true);
  });

  it("provides pivot presets and semantic defaults", () => {
    expect(PIVOT_PRESETS.map((preset) => preset.id)).toEqual([
      "center",
      "bottom-center",
      "top-center",
      "left-base",
      "right-base",
      "custom"
    ]);
    expect(getDefaultPivotForPart("stem")).toEqual({ x: 50, y: 100 });
    expect(getDefaultPivotForPart("leaves-left")).toEqual({ x: 85, y: 90 });
    expect(getDefaultPivotForPart("leaves-right")).toEqual({ x: 15, y: 90 });
    expect(getDefaultPivotForPart("unknown")).toEqual({ x: 50, y: 100 });
  });
});
