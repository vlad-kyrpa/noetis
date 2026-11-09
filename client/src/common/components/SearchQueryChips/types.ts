import type { SearchQuery } from '../../search/types';

export interface SearchQueryChipsProps {
  // Omitted: the chips are read-only and show no ✕.
  readonly onClear?: () => void;
  readonly query: SearchQuery;
}
