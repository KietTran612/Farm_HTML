import { renderCarrotCrop } from "./carrotCrop";
import { getSoilPatchState, normalizeCropArtState, sanitizeSvgId, type CropArtInput } from "./cropArtTypes";
import { renderSoilPatch } from "./soilPatch";

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function renderCropArt(input: CropArtInput): string {
  const artState = normalizeCropArtState(input.growthState, input.isDead);
  const soilState = getSoilPatchState(input);
  const instanceId = sanitizeSvgId(input.instanceId);
  const rootGradientId = `crop-art-${instanceId}-carrot-root`;
  const cropClass = `crop-art--${input.cropId}`;
  const stateClasses = [
    "crop-art",
    cropClass,
    `crop-art--${artState}`,
    `soil-${soilState}`,
    input.hasPest ? "has-pest" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <svg class="${stateClasses}" viewBox="0 0 240 180" role="img" aria-label="${escapeAttribute(input.cropName)}" focusable="false">
      <defs>
        <linearGradient id="${rootGradientId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffbd61" />
          <stop offset="100%" stop-color="#e5651e" />
        </linearGradient>
      </defs>
      ${renderSoilPatch(soilState)}
      ${renderCarrotCrop(artState, { rootGradientId })}
    </svg>
  `;
}
