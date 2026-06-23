import { getAnimationPreset, type PivotPoint } from "./animationPresets";
import type { MotionConfig } from "./motionConfig";

interface ValidationStage {
  stageId?: string;
  activeSvg?: string;
}

interface ValidationGroup {
  id?: string;
  label?: string;
  paths?: unknown[];
}

export interface StageAnimationValidationInput {
  stage: ValidationStage | null;
  groups: ValidationGroup[];
  animations: Record<string, string>;
  pivots: Record<string, PivotPoint>;
  motions: Record<string, MotionConfig>;
}

export interface StageAnimationValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateStageAnimationData(input: StageAnimationValidationInput): StageAnimationValidationResult {
  const errors: string[] = [];

  if (!input.stage) {
    errors.push("No active stage is selected.");
  } else {
    if (!input.stage.stageId) errors.push("The selected stage has no stage ID.");
    if (!input.stage.activeSvg) errors.push("The selected stage has no SVG data.");
  }

  if (input.groups.length === 0) {
    errors.push("The selected stage has no editable layers.");
  }

  input.groups.forEach((group, index) => {
    const groupName = group.id || group.label || `#${index + 1}`;
    if (!group.id) errors.push(`Layer ${groupName} has no group ID.`);
    if (!group.label) errors.push(`Layer ${groupName} has no label.`);
    if (!Array.isArray(group.paths) || group.paths.length === 0) {
      errors.push(`Layer ${groupName} has no paths.`);
    }

    const animation = input.animations[group.id || ""] || "none";
    if (!getAnimationPreset(animation)) {
      errors.push(`Layer ${groupName} uses an unknown animation preset.`);
    }

    const pivot = input.pivots[group.id || ""];
    if (pivot && (!isPercent(pivot.x) || !isPercent(pivot.y))) {
      errors.push(`Layer ${groupName} has an invalid pivot.`);
    }

    const motion = input.motions[group.id || ""];
    if (motion && Object.values(motion).some((value) => value !== undefined && !Number.isFinite(value))) {
      errors.push(`Layer ${groupName} has an invalid motion value.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

function isPercent(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}
