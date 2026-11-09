import { SearchParseFailureKind } from './types';
import type { SearchParseFailure } from './types';

// One message per failure kind, so adding a kind without a message fails to compile. Messages
// read failure details only when their kind carries them.
export const SEARCH_FAILURE_MESSAGES: Readonly<
  Record<SearchParseFailureKind, (failure: SearchParseFailure) => string>
> = {
  [SearchParseFailureKind.Empty]: () => 'Type something to search for.',
  [SearchParseFailureKind.TooLong]: (failure) =>
    'maxLength' in failure
      ? `Keep the search under ${failure.maxLength} characters.`
      : 'The search is too long.',
  [SearchParseFailureKind.EmptyTag]: () => 'Add a label after #, e.g. #work.',
  [SearchParseFailureKind.InvalidTag]: (failure) =>
    'token' in failure
      ? `"${failure.token}" is not a valid tag. Use letters, digits, _ or -.`
      : 'A tag has invalid characters.',
  [SearchParseFailureKind.TextBetweenTags]: () =>
    'Put tags at the start or the end, not on both sides of the text.',
  [SearchParseFailureKind.TagsInsideText]: () =>
    'Put tags at the start or the end, not between words.',
};

// Turns a parse failure into the message shown under the search input.
export const formatSearchFailure = (failure: SearchParseFailure): string =>
  SEARCH_FAILURE_MESSAGES[failure.kind](failure);
