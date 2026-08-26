import type { CoreError, Result } from "../types";
import { createValidationError } from "./error-factory";

export const TAG_PREFIX = "#";
export const TAG_LINE_PREFIX = "tags: ";

// Normalizes free-form tag input into single-token stored tags.
export function normalizeTags(tags: string[]): string[] {
  return tags
    .flatMap((tag) => tag.split(" "))
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

// Keeps tag lines parseable as hash-prefixed space-separated tokens.
export function validateTags(tags: string[]): Result<void, CoreError> {
  const invalidTag = tags.find((tag) => {
    const normalizedTag = tag.trim();
    return (
      normalizedTag.length === 0 ||
      normalizedTag.includes("\n---\n") ||
      normalizedTag.includes(" ") ||
      normalizedTag.includes(TAG_PREFIX)
    );
  });

  if (invalidTag !== undefined) {
    return createValidationError(
      `Tag "${invalidTag}" must be non-empty and cannot include spaces, hashes, or the content separator.`,
    );
  }

  return { ok: true, value: undefined };
}

// Parses the stored tag line back into clean tag tokens.
export function parseStoredTags(value: string): Result<string[], CoreError> {
  const hasTagPrefix = value.startsWith(TAG_LINE_PREFIX);

  if (!hasTagPrefix) {
    return createValidationError("Stored tags line is invalid.");
  }

  const tags = value
    .slice(TAG_LINE_PREFIX.length)
    .split(" ")
    .filter((tag) => tag.length > 0)
    .map((tag) =>
      tag.startsWith(TAG_PREFIX) ? tag.slice(TAG_PREFIX.length) : tag,
    );
  const validation = validateTags(tags);

  if (!validation.ok) {
    return validation;
  }

  return { ok: true, value: tags };
}
