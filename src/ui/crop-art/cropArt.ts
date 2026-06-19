import { renderCarrotCrop } from "./carrotCrop";
import { renderCornCrop } from "./cornCrop";
import { renderPotatoCrop } from "./potatoCrop";
import { renderPumpkinCrop } from "./pumpkinCrop";
import { renderStrawberryCrop } from "./strawberryCrop";
import { renderTomatoCrop } from "./tomatoCrop";
import { renderWheatCrop } from "./wheatCrop";
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

  let plantHtml = "";
  let defsHtml = "";
  switch (input.cropId) {
    case "corn":
      plantHtml = renderCornCrop(artState);
      break;
    case "potato":
      plantHtml = renderPotatoCrop(artState);
      break;
    case "pumpkin":
      plantHtml = renderPumpkinCrop(artState);
      break;
    case "strawberry":
      plantHtml = renderStrawberryCrop(artState);
      break;
    case "tomato":
      plantHtml = renderTomatoCrop(artState);
      break;
    case "wheat":
      plantHtml = renderWheatCrop(artState);
      break;
    default:
      defsHtml = `
        <defs>
          <linearGradient id="${rootGradientId}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffbd61" />
            <stop offset="100%" stop-color="#e5651e" />
          </linearGradient>
        </defs>
      `;
      plantHtml = renderCarrotCrop(artState, { rootGradientId });
      break;
  }

  return `
    <svg class="${stateClasses}" viewBox="0 0 240 180" role="img" aria-label="${escapeAttribute(input.cropName)}" focusable="false">
      ${defsHtml}
      ${renderSoilPatch(soilState)}
      ${plantHtml}
    </svg>
  `;
}
