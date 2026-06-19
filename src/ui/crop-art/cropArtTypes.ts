import type { CropGrowthState } from "../../core/types";

export type CropArtCropId = "carrot" | "strawberry" | "rice" | "corn" | "potato" | "pumpkin" | "tomato" | "wheat";

export type CropArtState = "seed" | "sprout" | "mature" | "ready" | "dead";

export type SoilPatchState = "normal" | "dry" | "upgraded" | "neglected";

export type CropArtInput = {
  instanceId: string;
  cropId: string;
  cropName: string;
  growthState: CropGrowthState;
  soilLevel: number;
  isDry: boolean;
  hasPest: boolean;
  isDead: boolean;
};

export function sanitizeSvgId(value: string): string {
  const sanitized = value.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return sanitized || "crop-art";
}

export function normalizeCropArtState(growthState: CropGrowthState, isDead: boolean): CropArtState {
  if (isDead || growthState === "dead") return "dead";

  switch (growthState) {
    case "seeded":
      return "seed";
    case "sprout":
      return "sprout";
    case "grown":
    case "preHarvest":
      return "mature";
    case "harvestable":
      return "ready";
  }
}

export function getSoilPatchState(input: Pick<CropArtInput, "isDry" | "isDead" | "soilLevel">): SoilPatchState {
  if (input.isDead) return "neglected";
  if (input.isDry) return "dry";
  if (input.soilLevel > 1) return "upgraded";
  return "normal";
}
