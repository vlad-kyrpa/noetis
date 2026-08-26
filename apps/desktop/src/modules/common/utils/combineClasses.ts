type Style = string | undefined | null;
const STYLE_SEPARATOR = " ";

export function combineStyles(...styles: Style[]): string {
  return styles
    .map((style) => (style ? style.trim() : style))
    .filter((style) => !!style)
    .join(STYLE_SEPARATOR);
}
