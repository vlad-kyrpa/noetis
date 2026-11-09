import type { HttpValidationIssues } from '../../../common/api/types';
import { normalizeTagLabel } from '../../../common/tags/normalize-tag-label';
import { ViewType } from '../types';
import type { ViewInput } from '../types';

const VIEW_TYPES: ReadonlySet<string> = new Set(Object.values(ViewType));

// Mirrors the backend rules so an invalid view is never sent: a known type, a title, and tags
// that are already in their saved (normalized, unique) form.
export const validateViewInput = ({ tags, title, type }: ViewInput): HttpValidationIssues => {
  const hasCanonicalTags =
    tags.every((tag) => tag !== '' && normalizeTagLabel(tag) === tag) &&
    new Set(tags).size === tags.length;

  return {
    ...(VIEW_TYPES.has(type) ? {} : { type: 'Choose what the view shows.' }),
    ...(title.trim() === '' ? { title: 'Enter a view title.' } : {}),
    ...(hasCanonicalTags ? {} : { tags: 'Tags must be unique, lower-case labels.' }),
  };
};
