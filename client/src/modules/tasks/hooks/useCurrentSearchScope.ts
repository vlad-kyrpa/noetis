import { useMatch } from 'react-router-dom';
import { routes } from '../../../routes';
import { GLOBAL_SEARCH_SCOPE } from '../search/scope';
import type { SearchScope } from '../types';

// Where a search submitted right now applies: the open view, the global results page, or
// `null` when no view is open (`/tasks`, the create view form).
export function useCurrentSearchScope(): SearchScope | null {
  const searchMatch = useMatch(routes.tasks.search);
  const createViewMatch = useMatch(routes.tasks.createView);
  const viewMatch = useMatch(routes.tasks.list);

  if (searchMatch !== null) {
    return GLOBAL_SEARCH_SCOPE;
  }

  // `views/new` also matches `views/:viewId`, so it is ruled out first.
  return createViewMatch === null ? (viewMatch?.params.viewId ?? null) : null;
}
