import { describe, expect, it } from "vitest";
import { classifySvgPaths } from "./groupClassifier";

describe("classifySvgPaths", () => {
  it("clusters paths by color family and region with translate offsets", () => {
    const svg = `<svg viewBox="0 0 100 100">
      <path fill="#3f8f3f" transform="translate(60 0)" d="M0 10 L10 10 L10 40 Z" />
      <path fill="#d6aa32" d="M45 5 L55 5 L55 20 Z" />
      <path fill="#8a5a2d" d="M45 80 L55 80 L55 95 Z" />
    </svg>`;

    const result = classifySvgPaths(svg, "corn");

    expect(result.groups.map((group) => group.id)).toEqual([
      "candidate-group-1",
      "candidate-group-2",
      "candidate-group-3"
    ]);
    expect(result.groups[0].suggestedPart).toBe("leaf-candidate-1");
    expect(result.groups[1].suggestedPart).toBe("tassel-candidate-2");
    expect(result.groups[2].suggestedPart).toBe("base-candidate-3");
    expect(result.groups[0].paths[0].center.x).toBeGreaterThan(60);
  });

  it("uses fallback semantic suggestions for non-corn crops", () => {
    const svg = `<svg viewBox="0 0 100 100">
      <path fill="#e27122" d="M40 40 L60 40 L60 70 Z" />
    </svg>`;

    const result = classifySvgPaths(svg, "pumpkin");

    expect(result.groups[0].colorFamily).toBe("orange");
    expect(result.groups[0].suggestedPart).toBe("fruit-candidate-1");
  });
});
