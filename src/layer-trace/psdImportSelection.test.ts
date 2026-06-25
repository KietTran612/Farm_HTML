import { describe, expect, it } from "vitest";
import {
  getInitialPsdLayerSelectedState,
  getImportedPsdLayerHiddenState,
  setPsdLayerCheckboxSelection
} from "./psdImportSelection";

describe("PSD import selection", () => {
  it("uses PSD hidden state only for initial layer selection", () => {
    expect(getInitialPsdLayerSelectedState({ sourceHidden: false })).toBe(true);
    expect(getInitialPsdLayerSelectedState({ sourceHidden: true })).toBe(false);
  });

  it("keeps selected PSD layers visible in the imported SVG layer", () => {
    expect(getImportedPsdLayerHiddenState({ selectedForImport: true, sourceHidden: true })).toBe(false);
  });

  it("syncs the hidden visual class when a PSD checkbox is selected in bulk", () => {
    document.body.innerHTML = `
      <div class="psd-layer-item is-hidden-layer">
        <input type="checkbox" class="psd-layer-checkbox" />
      </div>
    `;
    const checkbox = document.querySelector<HTMLInputElement>(".psd-layer-checkbox")!;
    const item = document.querySelector<HTMLElement>(".psd-layer-item")!;

    setPsdLayerCheckboxSelection(checkbox, true);

    expect(checkbox.checked).toBe(true);
    expect(item.classList.contains("is-hidden-layer")).toBe(false);

    setPsdLayerCheckboxSelection(checkbox, false);

    expect(checkbox.checked).toBe(false);
    expect(item.classList.contains("is-hidden-layer")).toBe(true);
  });
});
