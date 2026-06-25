export function isSvgGroupHidden(element: Element): boolean {
  const display = element.getAttribute("display")?.trim().toLowerCase();
  if (display === "none") return true;

  const style = element.getAttribute("style") || "";
  return /(?:^|;)\s*display\s*:\s*none\s*(?:;|$)/i.test(style);
}

export function getSvgGroupHiddenAttribute(hidden: boolean): string {
  return hidden ? ' display="none"' : "";
}
