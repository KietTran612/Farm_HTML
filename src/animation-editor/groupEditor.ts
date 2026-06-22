import type { ClassifiedPath, ColorFamily, CropGroup, RegionX, RegionY } from "./groupClassifier";

export type SplitMode = "left-right" | "top-bottom" | "fill-color";

export function relabelGroup(groups: CropGroup[], groupId: string, label: string): CropGroup[] {
  return groups.map((group) => group.id === groupId ? { ...group, label, suggestedPart: label } : group);
}

export function mergeGroups(groups: CropGroup[], groupIds: string[], label: string): CropGroup[] {
  const selected = new Set(groupIds);
  const mergedPaths = groups
    .filter((group) => selected.has(group.id))
    .flatMap((group) => group.paths)
    .sort((a, b) => a.pathIndex - b.pathIndex);

  if (mergedPaths.length === 0) {
    return groups;
  }

  const mergedGroup = createGroup(`merged-${label}`, label, mergedPaths);
  return [
    ...groups.filter((group) => !selected.has(group.id)),
    mergedGroup
  ];
}

export function splitGroup(groups: CropGroup[], groupId: string, mode: SplitMode): CropGroup[] {
  const target = groups.find((group) => group.id === groupId);
  if (!target) return groups;

  const replacementGroups = splitPaths(target, mode);
  return groups.flatMap((group) => group.id === groupId ? replacementGroups : [group]);
}

export function serializeGroupedSvg(svgText: string, groups: CropGroup[], cropId: string, stageId: string): string {
  const safeSvg = sanitizeSvgText(svgText);
  const svgOpen = safeSvg.match(/<svg\b[^>]*>/i)?.[0];
  if (!svgOpen) {
    throw new Error("Grouped SVG must include a root <svg> element.");
  }

  const viewBox = svgOpen.match(/\bviewBox=["'][^"']+["']/i)?.[0];
  const className = `imported-crop imported-crop--${sanitizeClassToken(cropId)} imported-crop--${sanitizeClassToken(stageId)}`;
  const rootAttrs = viewBox ? ` ${viewBox}` : "";
  const body = groups
    .filter((group) => !group.hidden)
    .map((group) => {
      const label = sanitizeClassToken(group.label);
      const paths = group.paths
        .sort((a, b) => a.pathIndex - b.pathIndex)
        .map((path) => path.markup)
        .join("\n    ");

      return `  <g class="crop-part crop-part--${label}" data-group-id="${escapeHtml(group.id)}">\n    ${paths}\n  </g>`;
    })
    .join("\n");

  return `<svg class="${className}"${rootAttrs}>\n${body}\n</svg>`;
}

export function sanitizeSvgText(svgText: string): string {
  const withoutUnsafeElements = svgText
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject\b[\s\S]*?<\/foreignObject>/gi, "");

  return withoutUnsafeElements
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*')/gi, "")
    .replace(/\s+(?:href|xlink:href)\s*=\s*(["'])(?!#)[\s\S]*?\1/gi, "");
}

function splitPaths(group: CropGroup, mode: SplitMode): CropGroup[] {
  if (mode === "fill-color") {
    const byColor = new Map<ColorFamily, ClassifiedPath[]>();
    for (const path of group.paths) {
      byColor.set(path.colorFamily, [...(byColor.get(path.colorFamily) || []), path]);
    }
    return Array.from(byColor.entries()).map(([color, paths]) => createGroup(`${group.id}-${color}`, `${group.label}-${color}`, paths));
  }

  if (mode === "left-right") {
    const midpoint = average(group.paths.map((path) => path.center.x));
    return compactGroups([
      createGroup(`${group.id}-left`, `${group.label}-left`, group.paths.filter((path) => path.center.x <= midpoint)),
      createGroup(`${group.id}-right`, `${group.label}-right`, group.paths.filter((path) => path.center.x > midpoint))
    ]);
  }

  const midpoint = average(group.paths.map((path) => path.center.y));
  return compactGroups([
    createGroup(`${group.id}-top`, `${group.label}-top`, group.paths.filter((path) => path.center.y <= midpoint)),
    createGroup(`${group.id}-bottom`, `${group.label}-bottom`, group.paths.filter((path) => path.center.y > midpoint))
  ]);
}

function createGroup(id: string, label: string, paths: ClassifiedPath[]): CropGroup {
  return {
    id,
    label,
    suggestedPart: label,
    colorFamily: paths[0]?.colorFamily || "unknown",
    regionX: readRegionX(paths),
    regionY: readRegionY(paths),
    hidden: false,
    paths: [...paths].sort((a, b) => a.pathIndex - b.pathIndex)
  };
}

function compactGroups(groups: CropGroup[]): CropGroup[] {
  return groups.filter((group) => group.paths.length > 0);
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function readRegionX(paths: ClassifiedPath[]): RegionX {
  const x = average(paths.map((path) => path.center.x));
  if (x < 33) return "left";
  if (x > 66) return "right";
  return "center";
}

function readRegionY(paths: ClassifiedPath[]): RegionY {
  const y = average(paths.map((path) => path.center.y));
  if (y < 33) return "top";
  if (y > 66) return "bottom";
  return "middle";
}

function sanitizeClassToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "part";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
