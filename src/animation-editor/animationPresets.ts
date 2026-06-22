export type AnimationPresetId =
  | "none"
  | "soft-sway"
  | "sway-left"
  | "sway-right"
  | "leaf-breathe"
  | "bob";

export interface AnimationPreset {
  id: AnimationPresetId;
  label: string;
  cssClass: string;
}

export interface PivotPoint {
  x: number;
  y: number;
}

export interface PivotPreset {
  id: string;
  label: string;
  pivot: PivotPoint;
}

export const ANIMATION_PRESETS: AnimationPreset[] = [
  { id: "none", label: "None", cssClass: "" },
  { id: "soft-sway", label: "Soft sway", cssClass: "anim-soft-sway" },
  { id: "sway-left", label: "Sway left", cssClass: "anim-sway-left" },
  { id: "sway-right", label: "Sway right", cssClass: "anim-sway-right" },
  { id: "leaf-breathe", label: "Leaf breathe", cssClass: "anim-leaf-breathe" },
  { id: "bob", label: "Bob", cssClass: "anim-bob" }
];

export const PIVOT_PRESETS: PivotPreset[] = [
  { id: "center", label: "Center", pivot: { x: 50, y: 50 } },
  { id: "bottom-center", label: "Bottom center", pivot: { x: 50, y: 100 } },
  { id: "top-center", label: "Top center", pivot: { x: 50, y: 0 } },
  { id: "left-base", label: "Left base", pivot: { x: 85, y: 90 } },
  { id: "right-base", label: "Right base", pivot: { x: 15, y: 90 } },
  { id: "custom", label: "Custom", pivot: { x: 50, y: 100 } }
];

const SEMANTIC_PIVOTS: Record<string, PivotPoint> = {
  base: { x: 50, y: 100 },
  stem: { x: 50, y: 100 },
  "leaves-left": { x: 85, y: 90 },
  "leaves-right": { x: 15, y: 90 },
  fruit: { x: 50, y: 65 },
  ears: { x: 50, y: 65 },
  tassels: { x: 50, y: 95 },
  other: { x: 50, y: 100 }
};

export function getAnimationPreset(id: string): AnimationPreset | undefined {
  return ANIMATION_PRESETS.find((preset) => preset.id === id);
}

export function getDefaultPivotForPart(part: string): PivotPoint {
  return SEMANTIC_PIVOTS[part] || SEMANTIC_PIVOTS.other;
}
