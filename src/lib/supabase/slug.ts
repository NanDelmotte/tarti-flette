//src/lib/slug.ts
export function slugify(input: string): string {
  const out = (input ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return out || "invite";
}
