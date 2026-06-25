import { describe, expect, it } from "vitest";
import { isSvgGroupHidden } from "./groupVisibility";

describe("group visibility", () => {
  it("detects grouped SVG layers hidden with display none", () => {
    const document = new DOMParser().parseFromString(
      `<svg><g class="crop-part crop-part--leaves" display="none"><path d="M0 0" /></g></svg>`,
      "image/svg+xml"
    );

    const group = document.querySelector("g")!;

    expect(isSvgGroupHidden(group)).toBe(true);
  });
});
