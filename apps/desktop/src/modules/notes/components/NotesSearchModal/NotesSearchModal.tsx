import { useMemo, useState } from "react";
import { Modal, SearchBox } from "@common/components";
import { useDebounce } from "@common/hooks/useDebounce";
import { NotesSearchResults } from "./NotesSearchResults";
import type { NotesSearchResult } from "./types";
import styles from "./styles.module.css";

interface NotesSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SEARCH_DEBOUNCE_MS = 250;
const SEARCH_MODAL_WIDTH = "min(880px, 92vw)";
const SEARCH_MODAL_HEIGHT = "min(720px, 82vh)";

const STATIC_SEARCH_RESULTS: NotesSearchResult[] = [
  {
    id: "daily-review",
    title: "Daily Review",
    shortContent: "A quick review of decisions, follow-ups, and loose thoughts.",
    tags: ["daily", "review"],
  },
  {
    id: "project-noetis",
    title: "Noetis Project Notes",
    shortContent: "Ideas for the desktop note flow, search surface, and storage boundaries.",
    tags: ["project", "desktop"],
  },
  {
    id: "reading-list",
    title: "Reading List",
    shortContent: "Papers, essays, and books to revisit when planning knowledge workflows.",
    tags: ["reading"],
  },
  {
    id: "meeting-design",
    title: "Design Meeting",
    shortContent: "Search modal layout decisions, spacing notes, and follow-up UI tasks.",
    tags: ["meeting", "design"],
  },
  {
    id: "storage-plan",
    title: "Storage Plan",
    shortContent: "Draft notes for record indexing, markdown files, and query boundaries.",
    tags: ["storage", "architecture"],
  },
  {
    id: "keyboard-flow",
    title: "Keyboard Flow",
    shortContent: "Ideas for fast note navigation, modal focus, and command shortcuts.",
    tags: ["ux", "keyboard"],
  },
  {
    id: "tag-cleanup",
    title: "Tag Cleanup",
    shortContent: "Possible rules for merging duplicate tags and keeping labels predictable.",
    tags: ["tags", "cleanup"],
  },
  {
    id: "weekly-plan",
    title: "Weekly Plan",
    shortContent: "Priorities for the notes module, search polish, and editor follow-ups.",
    tags: ["planning", "weekly"],
  },
  {
    id: "modal-states",
    title: "Modal States",
    shortContent: "Empty, loading, results, and error state sketches for reusable dialogs.",
    tags: ["modal", "states"],
  },
];

// Checks whether a static note preview matches the debounced search text.
function matchesSearchQuery({
  record,
  query,
}: {
  record: NotesSearchResult;
  query: string;
}): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const searchableText = [
    record.title,
    record.shortContent,
    ...record.tags,
  ].join(" ");

  return searchableText.toLocaleLowerCase().includes(normalizedQuery);
}

// Filters static notes while the real query path is still being shaped.
function getStaticSearchResults(query: string): NotesSearchResult[] {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length === 0) {
    return [];
  }

  return STATIC_SEARCH_RESULTS.filter((record) =>
    matchesSearchQuery({ record, query: normalizedQuery }),
  );
}

// Formats a compact status line for the current static search state.
function createStatusText({
  query,
  resultsCount,
}: {
  query: string;
  resultsCount: number;
}): string {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length === 0) {
    return "Start typing to search notes.";
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
  const [query, setQuery] = useState<string>("");
  const debouncedQuery = useDebounce({
    value: query,
    delayMs: SEARCH_DEBOUNCE_MS,
  });
  const results = useMemo<NotesSearchResult[]>(
    () => getStaticSearchResults(debouncedQuery),
    [debouncedQuery],
  );
  const statusText = createStatusText({
    query: debouncedQuery,
    resultsCount: results.length,
  });

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
        <p className={styles.status}>{statusText}</p>
      </div>
      <NotesSearchResults results={results} />
    </Modal>
  );
}
