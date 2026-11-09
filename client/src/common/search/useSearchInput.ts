import { useCallback, useState } from 'react';
import { formatSearchFailure } from './messages';
import { parseSearchInput } from './parse-search-input';
import type { SearchInputState, SearchParseFailure, UseSearchInputParams } from './types';

// Holds the raw input and its parse failure. Typing never searches; every successful submit
// calls `onSearch`, even for an unchanged query, so the user can refresh results. No fetching.
export function useSearchInput({ onSearch, syntax }: UseSearchInputParams): SearchInputState {
  const [input, setRawInput] = useState('');
  const [failure, setFailure] = useState<SearchParseFailure | null>(null);

  const setInput = useCallback((nextInput: string): void => {
    setRawInput(nextInput);
    setFailure(null);
  }, []);

  const submit = useCallback((): void => {
    const parseResult = parseSearchInput({ input, syntax });

    if (parseResult.ok) {
      setFailure(null);
      onSearch(parseResult.value);
      return;
    }

    setFailure(parseResult.error);
  }, [input, onSearch, syntax]);

  return {
    failure,
    failureMessage: failure === null ? null : formatSearchFailure(failure),
    input,
    setInput,
    submit,
  };
}
