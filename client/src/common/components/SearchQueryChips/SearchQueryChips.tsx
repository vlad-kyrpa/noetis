import { X } from 'lucide-react';
import type { ReactElement } from 'react';
import { TagChips } from '../TagChips/TagChips';
import type { SearchQueryChipsProps } from './types';
import './SearchQueryChips.css';

// Shows an applied search as its text plus tag chips, with an optional ✕ to clear it.
export function SearchQueryChips({ onClear, query }: SearchQueryChipsProps): ReactElement {
  return (
    <div aria-label="active search" className="search-query-chips" role="group">
      {query.text !== null && <span className="search-query-chips-text">{query.text}</span>}
      <TagChips tags={query.tags} />
      {onClear !== undefined && (
        <button
          aria-label="clear search"
          className="search-query-chips-clear"
          onClick={onClear}
          title="clear search"
          type="button"
        >
          <X aria-hidden="true" size="var(--icon-size-1)" />
        </button>
      )}
    </div>
  );
}
