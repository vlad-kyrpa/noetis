import { List, ListItem, Tag } from "@common/components";
import type { NotesSearchResult } from "./types";
import styles from "./styles.module.css";

interface NotesSearchResultsProps {
  results: NotesSearchResult[];
  onSelect: (result: NotesSearchResult) => void;
}

interface NotesSearchResultItemProps {
  result: NotesSearchResult;
  onSelect: (result: NotesSearchResult) => void;
}

// Renders one note hit with a compact preview and optional tags.
function NotesSearchResultItem({
  result,
  onSelect,
}: NotesSearchResultItemProps): JSX.Element {
  return (
    <ListItem>
      <button
        className={styles.resultButton}
        onClick={() => onSelect(result)}
        type="button"
      >
        <h3 className={styles.resultTitle}>{result.title}</h3>
        <p className={styles.resultContent}>{result.shortContent}</p>
        {result.tags.length > 0 ? (
          <ul className={styles.tagList} aria-label="Tags">
            {result.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </ul>
        ) : null}
      </button>
    </ListItem>
  );
}

// Renders the full-width scrollable list body for notes search results.
export function NotesSearchResults({
  results,
  onSelect,
}: NotesSearchResultsProps): JSX.Element {
  return (
    <List ariaLabel="Note search results">
      {results.map((result) => (
        <NotesSearchResultItem
          key={result.id}
          onSelect={onSelect}
          result={result}
        />
      ))}
    </List>
  );
}
