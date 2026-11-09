import { normalizeTagLabels } from './normalize-tag-label';

// Tag labels never contain commas, so a comma-separated text field round-trips losslessly.
const TAGS_TEXT_SEPARATOR = ',';
const TAGS_TEXT_JOINER = ', ';

// Splits a comma-separated tags field into the labels that will be saved (lower-cased, unique).
export const parseTagsText = (tagsText: string): readonly string[] =>
  normalizeTagLabels(tagsText.split(TAGS_TEXT_SEPARATOR));

// Turns saved labels back into the editable comma-separated text.
export const formatTagsText = (tags: readonly string[]): string => tags.join(TAGS_TEXT_JOINER);
