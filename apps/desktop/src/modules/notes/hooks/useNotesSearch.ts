import { useEffect, useState } from "react";
import type { CoreEngine, CoreError, Query } from "@noetis/noetis";
import { useCoreContext } from "@common/contexts/CoreContext";
import type { NotesSearchResult } from "../components/NotesSearchModal/types";

export interface UseNotesSearchParams {
  query: Query | null;
  enabled: boolean;
}

export interface UseNotesSearchResult {
  results: NotesSearchResult[];
  error: CoreError | null;
  isLoading: boolean;
}

interface SearchNotesParams {
  core: CoreEngine;
  query: Query;
  signal: AbortSignal;
  onResults: (results: NotesSearchResult[]) => void;
  onError: (error: CoreError) => void;
  onSettled: () => void;
}

// Queries the core engine and ignores stale async completions.
async function searchNotes({
  core,
  query,
  signal,
  onResults,
  onError,
  onSettled,
}: SearchNotesParams): Promise<void> {
  const result = await core.query(query);

  if (signal.aborted) {
    return;
  }

  if (!result.ok) {
    onError(result.error);
    onSettled();
    return;
  }

  onResults(result.value);
  onSettled();
}

// Shares note-search loading, result, and error state across modal and pages.
export function useNotesSearch({
  query,
  enabled,
}: UseNotesSearchParams): UseNotesSearchResult {
  const { core } = useCoreContext();
  const [results, setResults] = useState<NotesSearchResult[]>([]);
  const [error, setError] = useState<CoreError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!enabled || query === null) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    setIsLoading(true);
    setError(null);
    void searchNotes({
      core,
      query,
      signal: controller.signal,
      onResults: setResults,
      onError: setError,
      onSettled: () => setIsLoading(false),
    });

    return () => controller.abort();
  }, [core, enabled, query]);

  return {
    results,
    error,
    isLoading,
  };
}
