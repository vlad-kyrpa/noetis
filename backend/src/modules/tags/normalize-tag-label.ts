/**
 * Canonicalizes a tag label so `Work` and `work` resolve to one tag. JS `toLowerCase()` is
 * Unicode-aware (unlike SQLite `lower()`), so `Робота` folds correctly too.
 */
export const normalizeTagLabel = (label: string): string => label.trim().toLowerCase();

/** Normalizes a label list and drops empty and repeated labels while keeping input order. */
export const normalizeTagLabels = (labels: readonly string[]): readonly string[] => [
  ...new Set(labels.map(normalizeTagLabel).filter((label) => label !== '')),
];
