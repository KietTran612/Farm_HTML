import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("review page controls", () => {
  beforeEach(() => {
    document.body.className = "";
    document.body.innerHTML = `
      <button class="btn active" id="toggle-sway">Bật/Tắt Animation Đung Đưa</button>
      <div class="review-container" id="review-container"></div>
    `;
  });

  it("toggles animation state without writing inline styles", async () => {
    const { initReview } = await import("./review");

    initReview();

    const toggle = document.getElementById("toggle-sway");
    toggle?.click();

    expect(document.body.classList.contains("review-animations-paused")).toBe(true);
    expect(document.querySelector("[style]")).toBeNull();
  });

  it("keeps the review grid single-column on narrow mobile screens", () => {
    const html = readFileSync(resolve("review.html"), "utf8");

    expect(html).toContain("@media (max-width: 520px)");
    expect(html).toContain("grid-template-columns: 1fr;");
  });
});
