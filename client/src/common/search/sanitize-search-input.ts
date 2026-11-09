import { SEARCH_WORD_SEPARATOR } from './constants';

// Control and format characters, e.g. zero-width spaces pasted along with text.
const INVISIBLE_CHARACTERS = /[\p{Cc}\p{Cf}]/gu;
const WHITESPACE_RUNS = /\s+/gu;
const UNICODE_COMPATIBILITY_FORM = 'NFKC';

// Folds look-alike characters, turns invisible ones into spaces and collapses whitespace, so
// the tokenizer only ever sees single-space-separated tokens.
export const sanitizeSearchInput = (raw: string): string =>
  raw
    .normalize(UNICODE_COMPATIBILITY_FORM)
    .replace(INVISIBLE_CHARACTERS, SEARCH_WORD_SEPARATOR)
    .replace(WHITESPACE_RUNS, SEARCH_WORD_SEPARATOR)
    .trim();
