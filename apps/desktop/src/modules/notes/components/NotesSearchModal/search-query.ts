import type { Query } from "@noetis/noetis";

export type ParsedSearchQuery =
  | {
      ok: true;
      query: Query;
    }
  | {
      ok: false;
      warning: string;
    };

const TAG_PREFIX = "#";
const SEARCH_QUERY_WARNING =
  "Put tags together at the beginning or end, like \"#tag #tag2 text\" or \"text #tag #tag2\".";

// Checks whether a token is a complete hash tag without embedded hashes.
function isTagToken(token: string): boolean {
  return (
    token.startsWith(TAG_PREFIX) &&
    token.length > TAG_PREFIX.length &&
    !token.slice(TAG_PREFIX.length).includes(TAG_PREFIX)
  );
}

// Checks whether a token contains tag syntax that cannot be parsed safely.
function isInvalidTagToken(token: string): boolean {
  return token.includes(TAG_PREFIX) && !isTagToken(token);
}

// Converts a hash-prefixed token into the core tag query format.
function createTagFromToken(token: string): string {
  return token.slice(TAG_PREFIX.length);
}

// Checks that tag tokens form one group at either edge of the search text.
function hasValidTagPosition(tagIndexes: number[], tokensCount: number): boolean {
  const firstTagIndex = tagIndexes[0];
  const lastTagIndex = tagIndexes.at(-1);

  if (firstTagIndex === undefined || lastTagIndex === undefined) {
    return true;
  }

  const tagsAreContiguous = lastTagIndex - firstTagIndex + 1 === tagIndexes.length;
  const tagsAreAtStart = firstTagIndex === 0;
  const tagsAreAtEnd = lastTagIndex === tokensCount - 1;

  return tagsAreContiguous && (tagsAreAtStart || tagsAreAtEnd);
}

// Parses search text into one text block plus an optional edge-aligned tag block.
export function parseSearchQuery(value: string): ParsedSearchQuery {
  const tokens = value.trim().split(/\s+/).filter((token) => token.length > 0);
  const invalidTagToken = tokens.find(isInvalidTagToken);

  if (invalidTagToken !== undefined) {
    return { ok: false, warning: SEARCH_QUERY_WARNING };
  }

  const tagIndexes = tokens
    .map((token, index) => (isTagToken(token) ? index : null))
    .filter((index): index is number => index !== null);

  if (!hasValidTagPosition(tagIndexes, tokens.length)) {
    return { ok: false, warning: SEARCH_QUERY_WARNING };
  }

  const firstTagIndex = tagIndexes[0];
  const lastTagIndex = tagIndexes.at(-1);
  const tags = tokens.filter(isTagToken).map(createTagFromToken);

  if (firstTagIndex === undefined || lastTagIndex === undefined) {
    return { ok: true, query: { text: tokens.join(" "), tags } };
  }

  const textTokens =
    firstTagIndex === 0
      ? tokens.slice(lastTagIndex + 1)
      : tokens.slice(0, firstTagIndex);

  return { ok: true, query: { text: textTokens.join(" "), tags } };
}
