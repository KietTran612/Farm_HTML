import { describe, expect, it } from "vitest";
import { validateStageAnimationData } from "./stageValidation";

const validGroup = {
  id: "leaves",
  label: "leaves",
  paths: [{ id: "path-0", markup: "<path />" }]
};

describe("stage animation validation", () => {
  it("accepts a valid editable stage payload", () => {
    const result = validateStageAnimationData({
      stage: { stageId: "stage00", activeSvg: "<svg><path /></svg>" },
      groups: [validGroup],
      animations: { leaves: "soft-sway" },
      pivots: { leaves: { x: 50, y: 90 } },
      motions: { leaves: { durationMs: 2400, delayMs: 50, angleDeg: 1.5 } }
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects missing stage data and empty layer lists", () => {
    const result = validateStageAnimationData({
      stage: null,
      groups: [],
      animations: {},
      pivots: {},
      motions: {}
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("No active stage is selected.");
    expect(result.errors).toContain("The selected stage has no editable layers.");
  });

  it("rejects invalid animation, pivot, and motion values", () => {
    const result = validateStageAnimationData({
      stage: { stageId: "stage00", activeSvg: "<svg><path /></svg>" },
      groups: [validGroup],
      animations: { leaves: "bad-preset" },
      pivots: { leaves: { x: 120, y: Number.NaN } },
      motions: { leaves: { durationMs: -1, scale: Number.POSITIVE_INFINITY } }
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Layer leaves uses an unknown animation preset.");
    expect(result.errors).toContain("Layer leaves has an invalid pivot.");
    expect(result.errors).toContain("Layer leaves has an invalid motion value.");
  });
});
