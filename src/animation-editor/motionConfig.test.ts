import { describe, expect, it } from "vitest";
import {
  buildAnimationPartsConfig,
  getDefaultMotionForAnimation,
  mergeStageAnimationCache,
  type MotionConfig
} from "./motionConfig";

describe("animation motion config", () => {
  it("provides stable default motion parameters for animation presets", () => {
    expect(getDefaultMotionForAnimation("soft-sway")).toEqual({
      durationMs: 2800,
      delayMs: 0,
      angleDeg: 1.2,
      yPx: 0,
      scale: 1.02
    });
    expect(getDefaultMotionForAnimation("bob")).toEqual({
      durationMs: 2200,
      delayMs: 0,
      angleDeg: 1,
      yPx: 4,
      scale: 1.02
    });
  });

  it("serializes motion configs into the saved stage parts payload", () => {
    const parts = buildAnimationPartsConfig(
      [
        { id: "leaves", label: "leaves" },
        { id: "stem", label: "stem" }
      ],
      {
        leaves: "soft-sway",
        stem: "none"
      },
      {
        leaves: { x: 50, y: 95 },
        stem: { x: 50, y: 100 }
      },
      {
        leaves: {
          durationMs: 3200,
          delayMs: 150,
          angleDeg: 2.4,
          yPx: 1,
          scale: 1.03
        }
      }
    );

    expect(parts.leaves).toEqual({
      label: "leaves",
      animation: "soft-sway",
      pivot: { x: 50, y: 95 },
      motion: {
        durationMs: 3200,
        delayMs: 150,
        angleDeg: 2.4,
        yPx: 1,
        scale: 1.03
      }
    });
    expect(parts.stem.motion).toBeUndefined();
  });

  it("merges saved motion parts into cache without dropping existing stage fields", () => {
    const motion: MotionConfig = {
      durationMs: 2500,
      delayMs: 75,
      angleDeg: 1.8,
      yPx: 2,
      scale: 1.04
    };
    const existing = {
      crop: "corn",
      stages: {
        stage03: {
          sourceFile: "stage03.svg",
          groupedFile: "stage03.grouped.svg",
          customNote: "keep me",
          parts: {
            old: { label: "old", animation: "none" }
          }
        }
      }
    };

    const next = mergeStageAnimationCache(existing, "corn", "stage03", {
      sourceFile: "stage03.svg",
      groupedFile: "stage03.grouped.svg",
      parts: {
        leaves: {
          label: "leaves",
          animation: "soft-sway",
          pivot: { x: 50, y: 95 },
          motion
        }
      }
    });

    expect(next.stages.stage03.customNote).toBe("keep me");
    expect(next.stages.stage03.parts.leaves.motion).toEqual(motion);
    expect(next.stages.stage03.parts.old).toBeUndefined();
  });

  it("records the newly created grouped file in the cache after first save", () => {
    const next = mergeStageAnimationCache(null, "corn", "stage00", {
      sourceFile: "stage00.svg",
      groupedFile: "stage00.grouped.svg",
      parts: {
        leaves: {
          label: "leaves",
          animation: "soft-sway",
          pivot: { x: 50, y: 100 }
        }
      }
    });

    expect(next).toMatchObject({
      crop: "corn",
      stages: {
        stage00: {
          sourceFile: "stage00.svg",
          groupedFile: "stage00.grouped.svg"
        }
      }
    });
  });
});
