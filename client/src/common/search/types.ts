// Module-agnostic result of parsing "#tag1 #tag2 some text".
export interface SearchQuery {
  // Labels without the prefix, lower-cased and deduped in input order.
  readonly tags: readonly string[];
  readonly text: string | null;
}

// Tunable rules, so another module can reuse the parser with different limits.
export interface SearchSyntax {
  readonly maxInputLength: number;
  readonly maxTagLength: number;
  readonly tagLabelPattern: RegExp;
  readonly tagPrefix: string;
}

export interface ParseSearchInputParams {
  readonly input: string;
  readonly syntax?: SearchSyntax;
}

export enum SearchParseFailureKind {
  Empty = 'empty',
  TooLong = 'tooLong',
  EmptyTag = 'emptyTag',
  InvalidTag = 'invalidTag',
  TextBetweenTags = 'textBetweenTags',
  TagsInsideText = 'tagsInsideText',
}

export type SearchParseFailure =
  | { readonly kind: SearchParseFailureKind.Empty }
  | { readonly kind: SearchParseFailureKind.TooLong; readonly maxLength: number }
  | { readonly kind: SearchParseFailureKind.EmptyTag }
  | { readonly kind: SearchParseFailureKind.InvalidTag; readonly token: string }
  | { readonly kind: SearchParseFailureKind.TextBetweenTags }
  | { readonly kind: SearchParseFailureKind.TagsInsideText };

export enum SearchTokenKind {
  Tag = 'tag',
  Word = 'word',
}

export interface SearchToken {
  readonly kind: SearchTokenKind;
  readonly text: string;
}

// Consecutive tokens of one kind; the layout check only looks at the run sequence.
export interface SearchTokenRun {
  readonly kind: SearchTokenKind;
  readonly tokens: readonly SearchToken[];
}

export interface TokenizeSearchInputParams {
  readonly input: string;
  readonly syntax: SearchSyntax;
}

export interface ValidateTagTokenParams {
  readonly syntax: SearchSyntax;
  readonly token: SearchToken;
}

export interface BuildSearchQueryParams {
  readonly syntax: SearchSyntax;
  readonly tokens: readonly SearchToken[];
}

export interface UseSearchInputParams {
  // Called once per successful submit, even when the query did not change.
  readonly onSearch: (query: SearchQuery) => void;
  readonly syntax?: SearchSyntax;
}

export interface SearchInputState {
  readonly failure: SearchParseFailure | null;
  readonly failureMessage: string | null;
  readonly input: string;
  // Also clears the failure, so a message never outlives the text it described.
  readonly setInput: (input: string) => void;
  readonly submit: () => void;
}
