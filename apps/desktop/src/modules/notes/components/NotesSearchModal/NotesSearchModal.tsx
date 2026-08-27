import { useEffect, useMemo, useState } from "react";
import type { CoreEngine, CoreError, Query } from "@noetis/noetis";
import { useNavigate } from "react-router-dom";
import { Modal, SearchBox } from "@common/components";
import { useCoreContext } from "@common/contexts/CoreContext";
import { combineStyles } from "@common/utils/combineClasses";
import { useDebounce } from "@common/hooks/useDebounce";
import { NotesSearchResults } from "./NotesSearchResults";
import { parseSearchQuery } from "../../utils/search-query";
import type { NotesSearchResult } from "./types";
import styles from "./styles.module.css";

interface NotesSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SEARCH_DEBOUNCE_MS = 250;
const SEARCH_MODAL_WIDTH = "min(880px, 92vw)";
const SEARCH_MODAL_HEIGHT = "min(720px, 82vh)";

interface SearchNotesParams {
  core: CoreEngine;
  query: Query;
  signal: AbortSignal;
  onResults: (results: NotesSearchResult[]) => void;
  onError: (error: CoreError) => void;
  onSettled: () => void;
}

interface StatusTextParams {
  error: CoreError | null;
  isLoading: boolean;
  query: string;
  resultsCount: number;
  warning: string | null;
}

// Formats a compact status line for the current search state.
function createStatusText({
  error,
  isLoading,
  query,
  resultsCount,
  warning,
}: StatusTextParams): string {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length === 0) {
    return "Start typing to search notes.";
  }

  if (warning !== null) {
    return warning;
  }

  if (error !== null) {
    return error.message;
  }

  if (isLoading) {
    return "Searching notes.";
  }

  if (resultsCount === 0) {
    return "No notes found.";
  }

  return `${resultsCount} result${resultsCount === 1 ? "" : "s"}`;
}

// Queries the core engine by text and ignores stale async completions.
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

// Provides debounced note search inside a centered transparent modal surface.
export function NotesSearchModal({
  open,
  onOpenChange,
}: NotesSearchModalProps): JSX.Element {
  const { core } = useCoreContext();
  const navigate = useNavigate();
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<NotesSearchResult[]>([]);
  const [error, setError] = useState<CoreError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const debouncedQuery = useDebounce({
    value: query,
    delayMs: SEARCH_DEBOUNCE_MS,
  });
  const parsedQuery = useMemo(
    () => parseSearchQuery(debouncedQuery),
    [debouncedQuery],
  );
  const validationWarning = parsedQuery.ok ? null : parsedQuery.warning;
  const statusText = createStatusText({
    error,
    isLoading,
    query: debouncedQuery,
    resultsCount: results.length,
    warning: validationWarning,
  });

  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();

    if (!open || trimmedQuery.length === 0 || !parsedQuery.ok) {
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
      query: parsedQuery.query,
      signal: controller.signal,
      onResults: setResults,
      onError: setError,
      onSettled: () => setIsLoading(false),
    });

    return () => controller.abort();
  }, [core, debouncedQuery, open, parsedQuery]);

  // Opens the selected note route and dismisses search.
  function handleSelectResult(result: NotesSearchResult): void {
    navigate(`/notes/${encodeURIComponent(result.id)}`);
    onOpenChange(false);
  }

  return (
    <Modal
      className={styles.content}
      height={SEARCH_MODAL_HEIGHT}
      onOpenChange={onOpenChange}
      open={open}
      title="Search notes"
      width={SEARCH_MODAL_WIDTH}
    >
      <div className={styles.searchArea}>
        <SearchBox
          ariaLabel="Search notes"
          onChange={setQuery}
          placeholder="Search notes"
          value={query}
        />
        <p
          className={combineStyles(
            styles.status,
            validationWarning === null ? null : styles.warning,
          )}
        >
          {statusText}
        </p>
      </div>
      <NotesSearchResults onSelect={handleSelectResult} results={results} />
    </Modal>
  );
}
