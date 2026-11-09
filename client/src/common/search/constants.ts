import type { SearchSyntax } from './types';

// Unicode letters, digits, `_` and `-`: `#робота` is fine, `#a,b` is not, so commas can safely
// join tags in a query string.
const TAG_LABEL_PATTERN = /^[\p{L}\p{N}_-]+$/u;

export const DEFAULT_SEARCH_SYNTAX: SearchSyntax = {
  maxInputLength: 200,
  maxTagLength: 32,
  tagLabelPattern: TAG_LABEL_PATTERN,
  tagPrefix: '#',
};

// Words of the free-text part are rejoined with a single space.
export const SEARCH_WORD_SEPARATOR = ' ';
