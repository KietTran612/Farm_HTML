import { getDefaultPivotForPart, type PivotPoint } from "./animationPresets";

export interface MotionConfig {
  durationMs?: number;
  delayMs?: number;
  angleDeg?: number;
  yPx?: number;
  scale?: number;
}

export interface AnimationPartConfig {
  label: string;
  animation: string;
  pivot: PivotPoint;
  motion?: MotionConfig;
}

export type AnimationPartsConfig = Record<string, AnimationPartConfig>;

const DEFAULT_MOTIONS: Record<string, Required<MotionConfig>> = {
  "soft-sway": {
    durationMs: 2800,
    delayMs: 0,
    angleDeg: 1.2,
    yPx: 0,
    scale: 1.02
  },
  "sway-left": {
    durationMs: 2400,
    delayMs: 0,
    angleDeg: 4,
    yPx: 2,
    scale: 1.02
  },
  "sway-right": {
    durationMs: 2400,
    delayMs: 0,
    angleDeg: 4,
    yPx: 2,
    scale: 1.02
  },
  "leaf-breathe": {
    durationMs: 2600,
    delayMs: 0,
    angleDeg: 1,
    yPx: 0,
    scale: 1.025
  },
  bob: {
    durationMs: 2200,
    delayMs: 0,
    angleDeg: 1,
    yPx: 4,
    scale: 1.02
  },
  none: {
    durationMs: 2800,
    delayMs: 0,
    angleDeg: 1,
    yPx: 0,
    scale: 1.02
  }
};

export function getDefaultMotionForAnimation(animation: string): Required<MotionConfig> {
  return { ...(DEFAULT_MOTIONS[animation] || DEFAULT_MOTIONS.none) };
}

export function buildAnimationPartsConfig(
  groups: Array<{ id: string; label: string }>,
  animations: Record<string, string>,
  pivots: Record<string, PivotPoint>,
  motions: Record<string, MotionConfig>
): AnimationPartsConfig {
  return Object.fromEntries(
    groups.map((group) => [group.id, {
      label: group.label,
      animation: animations[group.id] || "none",
      pivot: pivots[group.id] || getDefaultPivotForPart(group.label),
      ...(motions[group.id] ? { motion: motions[group.id] } : {})
    }])
  );
}

export function mergeStageAnimationCache(
  metadata: any,
  crop: string,
  stageId: string,
  stageConfig: { sourceFile?: string; groupedFile?: string; parts: AnimationPartsConfig }
): any {
  return {
    ...(metadata || {}),
    crop,
    stages: {
      ...(metadata?.stages || {}),
      [stageId]: {
        ...(metadata?.stages?.[stageId] || {}),
        ...stageConfig
      }
    }
  };
}
