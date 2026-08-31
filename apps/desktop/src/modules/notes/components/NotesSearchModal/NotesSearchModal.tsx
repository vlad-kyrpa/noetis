import { useEffect, useMemo, useState } from "react";
import type { CoreError } from "@noetis/noetis";
import { useNavigate } from "react-router-dom";
import { Modal, SearchBox } from "@common/components";
import { combineStyles } from "@common/utils/combineClasses";
import { useDebounce } from "@common/hooks/useDebounce";
import { useNotesSearch } from "../../hooks/useNotesSearch";
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

// Provides debounced note search inside a centered transparent modal surface.
export function NotesSearchModal({
  open,
  onOpenChange,
}: NotesSearchModalProps): JSX.Element {
  const navigate = useNavigate();
  const [query, setQuery] = useState<string>("");
  const debouncedQuery = useDebounce({
    value: query,
    delayMs: SEARCH_DEBOUNCE_MS,
  });
  const parsedQuery = useMemo(
    () => parseSearchQuery(debouncedQuery),
    [debouncedQuery],
  );
  const validationWarning = parsedQuery.ok ? null : parsedQuery.warning;
  const trimmedQuery = debouncedQuery.trim();
  const noteSearch = useNotesSearch({
    enabled: open && trimmedQuery.length > 0 && parsedQuery.ok,
    query: parsedQuery.ok ? parsedQuery.query : null,
  });
  const statusText = createStatusText({
    error: noteSearch.error,
    isLoading: noteSearch.isLoading,
    query: debouncedQuery,
    resultsCount: noteSearch.results.length,
    warning: validationWarning,
  });

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

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
      <NotesSearchResults
        onSelect={handleSelectResult}
        results={noteSearch.results}
      />
    </Modal>
  );
}
