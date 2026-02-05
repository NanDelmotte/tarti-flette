// src/lib/palette.ts
export function paletteForGif(gifKey?: string | null): string {
  switch (gifKey) {
    case "girly":
      return "palette-girly";
    case "fiesta":
      return "palette-fiesta";
    case "zen":
      return "palette-zen";
    case "classy":
      return "palette-classy";
    default:
      return "palette-girly";
  }
}
