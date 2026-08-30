import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchBox, Tag } from "@common/components";
import type {
  StoredQueryContainer,
  StoredQueryId,
  StoredQueryItem,
} from "@noetis/noetis";
import { useDebounce } from "@common/hooks/useDebounce";
import { NotesSearchResults } from "../../../notes/components/NotesSearchModal/NotesSearchResults";
import type { NotesSearchResult } from "../../../notes/components/NotesSearchModal/types";
import { useNotesSearch } from "../../../notes/hooks/useNotesSearch";
import { parseSearchQuery } from "../../../notes/utils/search-query";
import { useStoredQueriesTree } from "../../hooks/useStoredQueriesTree";
import styles from "./styles.module.css";

interface StoredQueryPageProps {
  storedQueryId?: StoredQueryId | undefined;
}

const SEARCH_DEBOUNCE_MS = 250;

// Finds a stored query in the category tree returned by the core read model.
function findStoredQuery({
  storedQueriesTree,
  storedQueryId,
}: {
  storedQueriesTree: StoredQueryContainer[];
  storedQueryId?: StoredQueryId | undefined;
}): StoredQueryItem | undefined {
  if (storedQueryId === undefined) {
    return undefined;
  }

  return storedQueriesTree
    .flatMap((container) => container.queries)
    .find((query) => query.id === storedQueryId);
}

// Preserves saved tags while appending any extra tags typed into the search box.
function appendSearchTags({
  savedTags,
  searchTags,
}: {
  savedTags: string[];
  searchTags: string[];
}): string[] {
  return Array.from(new Set([...savedTags, ...searchTags]));
}

// Hosts a saved-query note search as a full page with editable text and fixed tags.
export function StoredQueryPage({
  storedQueryId,
}: StoredQueryPageProps): JSX.Element {
  const navigate = useNavigate();
  const { storedQueriesTree, error, isLoading } = useStoredQueriesTree();
  const [searchText, setSearchText] = useState<string>("");
  const debouncedSearchText = useDebounce({
    value: searchText,
    delayMs: SEARCH_DEBOUNCE_MS,
  });
  const storedQuery = useMemo(
    () => findStoredQuery({ storedQueriesTree, storedQueryId }),
    [storedQueriesTree, storedQueryId],
  );
  const parsedSearch = useMemo(
    () => parseSearchQuery(debouncedSearchText),
    [debouncedSearchText],
  );
  const appliedTags = useMemo(
    () =>
      storedQuery === undefined
        ? []
        : appendSearchTags({
            savedTags: storedQuery.query.tags,
            searchTags: parsedSearch.ok ? parsedSearch.query.tags : [],
          }),
    [parsedSearch, storedQuery],
  );
  const query = useMemo(
    () =>
      storedQuery === undefined || !parsedSearch.ok
        ? null
        : {
            text: parsedSearch.query.text,
            tags: appliedTags,
          },
    [appliedTags, parsedSearch, storedQuery],
  );
  const noteSearch = useNotesSearch({
    enabled: storedQuery !== undefined && parsedSearch.ok,
    query,
  });
  const statusText =
    error?.message ??
    (parsedSearch.ok ? null : parsedSearch.warning) ??
    noteSearch.error?.message ??
    (isLoading ? "Loading query." : null) ??
    (noteSearch.isLoading ? "Searching notes." : null) ??
    (storedQuery === undefined ? "Stored query was not found." : null) ??
    `${noteSearch.results.length} result${
      noteSearch.results.length === 1 ? "" : "s"
    }`;

  // Opens a selected result in the existing note editor route.
  function handleSelectResult(result: NotesSearchResult): void {
    navigate(`/notes/${encodeURIComponent(result.id)}`);
  }

  return (
    <section className={styles.page}>
      <div className={styles.content}>
        <div className={styles.searchArea}>
          <SearchBox
            ariaLabel="Search notes in stored query"
            onChange={setSearchText}
            placeholder="Search notes"
            value={searchText}
          />
          {storedQuery === undefined ? null : (
            <ul aria-label="Applied tags" className={styles.tagList}>
              {appliedTags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </ul>
          )}
          <p className={styles.status}>{statusText}</p>
        </div>
        <NotesSearchResults
          onSelect={handleSelectResult}
          results={noteSearch.results}
        />
      </div>
    </section>
  );
}
