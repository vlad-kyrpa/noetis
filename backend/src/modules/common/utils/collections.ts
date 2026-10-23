import type { CollectionDiff } from "../types";

/** Finds the additions, retained values, and removals needed to reach a desired collection. */
export const collectionDiff = <T>(params: {
  readonly current: readonly T[];
  readonly desired: readonly T[];
}): CollectionDiff<T> => {
  const current = [...new Set(params.current)];
  const desired = [...new Set(params.desired)];
  const currentValues = new Set(current);
  const desiredValues = new Set(desired);
  return {
    added: desired.filter((value) => !currentValues.has(value)),
    retained: desired.filter((value) => currentValues.has(value)),
    removed: current.filter((value) => !desiredValues.has(value)),
  };
};
