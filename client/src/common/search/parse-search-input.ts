import { fail, ok } from '../result/result';
import type { Result } from '../result/types';
import { normalizeTagLabels } from '../tags/normalize-tag-label';
import { DEFAULT_SEARCH_SYNTAX, SEARCH_WORD_SEPARATOR } from './constants';
import { sanitizeSearchInput } from './sanitize-search-input';
import { collapseRuns, tokenizeSearchInput } from './tokenize';
import { SearchParseFailureKind, SearchTokenKind } from './types';
import type {
  BuildSearchQueryParams,
  ParseSearchInputParams,
  SearchParseFailure,
  SearchQuery,
  SearchTokenRun,
  ValidateTagTokenParams,
} from './types';

// `tags`, `words`, `tags words` and `words tags` are the only accepted layouts.
const MAX_ACCEPTED_RUNS = 2;
const THREE_RUNS = 3;

// Three runs are named after what sits in the middle: text between tags, or tags inside text.
const THREE_RUN_LAYOUT_FAILURES: Readonly<Record<SearchTokenKind, SearchParseFailure>> = {
  [SearchTokenKind.Tag]: { kind: SearchParseFailureKind.TextBetweenTags },
  [SearchTokenKind.Word]: { kind: SearchParseFailureKind.TagsInsideText },
};

// Checks one `#label` token; the failure quotes what the user typed.
const validateTagToken = ({ syntax, token }: ValidateTagTokenParams): SearchParseFailure | null => {
  const label = token.text.slice(syntax.tagPrefix.length);

  if (label === '') {
    return { kind: SearchParseFailureKind.EmptyTag };
  }

  const isValidLabel = syntax.tagLabelPattern.test(label) && label.length <= syntax.maxTagLength;

  return isValidLabel ? null : { kind: SearchParseFailureKind.InvalidTag, token: token.text };
};

// Accepts at most two runs; three or more mean tags were mixed into the text.
const findLayoutFailure = (runs: readonly SearchTokenRun[]): SearchParseFailure | null => {
  if (runs.length <= MAX_ACCEPTED_RUNS) {
    return null;
  }

  const firstRun = runs[0];

  return runs.length === THREE_RUNS && firstRun !== undefined
    ? THREE_RUN_LAYOUT_FAILURES[firstRun.kind]
    : { kind: SearchParseFailureKind.TagsInsideText };
};

// Joins the words into the text part and normalizes the tag labels.
const buildSearchQuery = ({ syntax, tokens }: BuildSearchQueryParams): SearchQuery => {
  const words = tokens.filter((token) => token.kind === SearchTokenKind.Word);
  const tagLabels = tokens
    .filter((token) => token.kind === SearchTokenKind.Tag)
    .map((token) => token.text.slice(syntax.tagPrefix.length));

  return {
    tags: normalizeTagLabels(tagLabels),
    text: words.length === 0 ? null : words.map((word) => word.text).join(SEARCH_WORD_SEPARATOR),
  };
};

// Sanitize → guard → tokenize → validate tags → check layout → build. Pure, so every module
// can reuse it with its own syntax.
export const parseSearchInput = ({
  input,
  syntax = DEFAULT_SEARCH_SYNTAX,
}: ParseSearchInputParams): Result<SearchQuery, SearchParseFailure> => {
  const sanitized = sanitizeSearchInput(input);

  if (sanitized === '') {
    return fail({ kind: SearchParseFailureKind.Empty });
  }

  if (sanitized.length > syntax.maxInputLength) {
    return fail({ kind: SearchParseFailureKind.TooLong, maxLength: syntax.maxInputLength });
  }

  const tokens = tokenizeSearchInput({ input: sanitized, syntax });
  const tagFailure = tokens
    .filter((token) => token.kind === SearchTokenKind.Tag)
    .map((token) => validateTagToken({ syntax, token }))
    .find((failure) => failure !== null);

  if (tagFailure !== undefined && tagFailure !== null) {
    return fail(tagFailure);
  }

  const layoutFailure = findLayoutFailure(collapseRuns(tokens));

  return layoutFailure === null ? ok(buildSearchQuery({ syntax, tokens })) : fail(layoutFailure);
};
