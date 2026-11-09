import type { SearchQuery } from '../../../common/search/types';
import type { SearchForScopeParams, SearchScope } from '../types';

// Scope of a search run with no view open; it is shown on `/tasks/search`.
export const GLOBAL_SEARCH_SCOPE: SearchScope = 'global';

// Returns the active search only where it was submitted, so it never filters another view.
export const searchForScope = ({ active, scope }: SearchForScopeParams): SearchQuery | null =>
  active !== null && active.scope === scope ? active.query : null;
