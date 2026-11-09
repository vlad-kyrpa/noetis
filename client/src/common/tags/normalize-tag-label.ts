// Client twin of the backend normalizer: trim + Unicode-aware lower case, so `#Робота` and
// `#робота` are the same tag everywhere.
export const normalizeTagLabel = (label: string): string => label.trim().toLowerCase();

// Normalizes a label list and drops empty and repeated labels, keeping input order.
export const normalizeTagLabels = (labels: readonly string[]): readonly string[] => [
  ...new Set(labels.map(normalizeTagLabel).filter((label) => label !== '')),
];
