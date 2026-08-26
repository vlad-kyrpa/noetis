import { List, ListItem, Tag } from "@common/components";
import type { NotesSearchResult } from "./types";
import styles from "./styles.module.css";

interface NotesSearchResultsProps {
  results: NotesSearchResult[];
}

interface NotesSearchResultItemProps {
  result: NotesSearchResult;
}

// Renders one note hit with a compact preview and optional tags.
function NotesSearchResultItem({
  result,
}: NotesSearchResultItemProps): JSX.Element {
  return (
    <ListItem>
      <h3 className={styles.resultTitle}>{result.title}</h3>
      <p className={styles.resultContent}>{result.shortContent}</p>
      {result.tags.length > 0 ? (
        <ul className={styles.tagList} aria-label="Tags">
          {result.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </ul>
      ) : null}
    </ListItem>
  );
}

// Renders the full-width scrollable list body for notes search results.
export function NotesSearchResults({
  results,
}: NotesSearchResultsProps): JSX.Element {
  return (
    <List ariaLabel="Note search results">
      {results.map((result) => (
        <NotesSearchResultItem key={result.id} result={result} />
      ))}
    </List>
  );
}
