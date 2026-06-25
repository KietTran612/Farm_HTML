export function getInitialPsdLayerSelectedState(input: { sourceHidden: boolean }): boolean {
  return !input.sourceHidden;
}

export function getImportedPsdLayerHiddenState(input: { selectedForImport: boolean; sourceHidden: boolean }): boolean {
  return input.selectedForImport ? false : input.sourceHidden;
}

export function setPsdLayerCheckboxSelection(checkbox: HTMLInputElement, selected: boolean): void {
  checkbox.checked = selected;
  const item = checkbox.closest(".psd-layer-item");
  item?.classList.toggle("is-hidden-layer", !selected);
}
