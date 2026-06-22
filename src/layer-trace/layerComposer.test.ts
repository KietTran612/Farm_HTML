import { describe, expect, it } from "vitest";
import { composeLayeredSvg } from "./layerComposer";

describe("composeLayeredSvg", () => {
  it("combines masked trace SVG layers into one grouped SVG and prefixes internal ids", () => {
    const result = composeLayeredSvg({
      width: 768,
      height: 1024,
      cropId: "corn",
      stageId: "stage03",
      layers: [
        {
          groupId: "group-leaves-left",
          label: "leaves-left",
          svgText: `<svg viewBox="0 0 768 1024"><defs><linearGradient id="paint0"><stop stop-color="#7fb642"/></linearGradient></defs><path fill="url(#paint0)" d="M0 0H10V10Z"/></svg>`
        },
        {
          groupId: "group-ears",
          label: "ears",
          svgText: `<svg viewBox="0 0 768 1024"><defs><linearGradient id="paint0"><stop stop-color="#f2be3f"/></linearGradient></defs><path fill="url(#paint0)" d="M20 20H30V30Z"/></svg>`
        }
      ]
    });

    expect(result).toContain('viewBox="0 0 768 1024"');
    expect(result).toContain('class="crop-part crop-part--leaves-left" data-group-id="group-leaves-left"');
    expect(result).toContain('class="crop-part crop-part--ears" data-group-id="group-ears"');
    expect(result).toContain('id="group-leaves-left-paint0"');
    expect(result).toContain('fill="url(#group-leaves-left-paint0)"');
    expect(result).toContain('id="group-ears-paint0"');
    expect(result).toContain('fill="url(#group-ears-paint0)"');
    expect(result.match(/<svg\b/g)).toHaveLength(1);
  });

  it("does not prefix internal ids again when re-saving a loaded layer", () => {
    const result = composeLayeredSvg({
      width: 64,
      height: 64,
      cropId: "carrot",
      stageId: "stage03",
      layers: [
        {
          groupId: "leaves-123",
          label: "leaves",
          svgText: `<svg viewBox="0 0 64 64"><defs><linearGradient id="leaves-123-grad"><stop stop-color="#4c6522"/></linearGradient></defs><path fill="url(#leaves-123-grad)" d="M0 0H10V10Z"/></svg>`
        }
      ]
    });

    expect(result).toContain('id="leaves-123-grad"');
    expect(result).toContain('fill="url(#leaves-123-grad)"');
    expect(result).not.toContain("leaves-123-leaves-123-grad");
  });

  it("keeps hidden editor layers in saved SVG output", () => {
    const result = composeLayeredSvg({
      width: 64,
      height: 64,
      cropId: "carrot",
      stageId: "stage03",
      layers: [
        {
          groupId: "hidden-layer",
          label: "leaves",
          svgText: `<svg viewBox="0 0 64 64"><path fill="#4c6522" d="M0 0H10V10Z"/></svg>`,
          hidden: true
        }
      ]
    });

    expect(result).toContain('data-group-id="hidden-layer"');
    expect(result).toContain('fill="#4c6522"');
  });
});
