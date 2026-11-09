import { SEARCH_WORD_SEPARATOR } from './constants';
import { SearchTokenKind } from './types';
import type { SearchToken, SearchTokenRun, TokenizeSearchInputParams } from './types';

// Classifies each space-separated token of sanitized input as a tag or a word.
export const tokenizeSearchInput = ({
  input,
  syntax,
}: TokenizeSearchInputParams): readonly SearchToken[] =>
  input.split(SEARCH_WORD_SEPARATOR).map((text) => ({
    kind: text.startsWith(syntax.tagPrefix) ? SearchTokenKind.Tag : SearchTokenKind.Word,
    text,
  }));

// Appends a token to the last run when the kind matches, otherwise opens a new run.
const appendToRuns = (
  runs: readonly SearchTokenRun[],
  token: SearchToken,
): readonly SearchTokenRun[] => {
  const lastRun = runs.at(-1);

  return lastRun?.kind === token.kind
    ? [...runs.slice(0, -1), { kind: lastRun.kind, tokens: [...lastRun.tokens, token] }]
    : [...runs, { kind: token.kind, tokens: [token] }];
};

// Groups consecutive tokens of the same kind so the layout check can compare run shapes.
export const collapseRuns = (tokens: readonly SearchToken[]): readonly SearchTokenRun[] =>
  tokens.reduce(appendToRuns, []);
