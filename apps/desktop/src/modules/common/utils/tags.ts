// Converts comma-separated editor text into normalized tag labels.
export function createTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}
