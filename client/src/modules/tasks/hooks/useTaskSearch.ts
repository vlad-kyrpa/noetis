import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SearchQuery } from '../../../common/search/types';
import { useSearchInput } from '../../../common/search/useSearchInput';
import { routes } from '../../../routes';
import { GLOBAL_SEARCH_SCOPE } from '../search/scope';
import type { ActiveSearch, SearchScope, TaskSearchState } from '../types';
import { useCurrentSearchScope } from './useCurrentSearchScope';
import { useIsTaskDetailsOpen } from './useIsTaskDetailsOpen';

// The applied search plus a submit counter that never goes backwards, even after a clear.
interface SearchRecord {
  readonly active: ActiveSearch | null;
  readonly submissionCount: number;
}

interface DropForeignSearchParams {
  readonly record: SearchRecord;
  readonly scope: SearchScope | null;
}

const NO_SEARCH: SearchRecord = { active: null, submissionCount: 0 };

// Drops a search submitted in another scope, so leaving a view never carries its search along.
const dropForeignSearch = ({ record, scope }: DropForeignSearchParams): SearchRecord =>
  record.active !== null && record.active.scope !== scope ? { ...record, active: null } : record;

// Owns the tasks search: the input, and the active search tagged with the scope it was
// submitted in. With no view open a submit searches everything and opens `/tasks/search`.
export function useTaskSearch(): TaskSearchState {
  const navigate = useNavigate();
  const currentScope = useCurrentSearchScope();
  const isTaskDetailsOpen = useIsTaskDetailsOpen();
  const [record, setRecord] = useState<SearchRecord>(NO_SEARCH);
  const [observedScope, setObservedScope] = useState(currentScope);

  // Adjusting state while rendering (not in an effect) drops the search in the same render the
  // view changes, so a foreign search is never fetched. The typed text stays in the input.
  // Opening a task's details is neutral: going back to the same list keeps its search.
  if (!isTaskDetailsOpen && observedScope !== currentScope) {
    setObservedScope(currentScope);
    setRecord((previous) => dropForeignSearch({ record: previous, scope: currentScope }));
  }

  const applySearch = useCallback(
    (query: SearchQuery): void => {
      const scope = currentScope ?? GLOBAL_SEARCH_SCOPE;

      setRecord((previous) => ({
        active: { query, scope, submission: previous.submissionCount + 1 },
        submissionCount: previous.submissionCount + 1,
      }));

      if (currentScope === null) {
        void navigate(routes.tasks.search);
      }
    },
    [currentScope, navigate],
  );

  const inputState = useSearchInput({ onSearch: applySearch });

  const clear = useCallback((): void => {
    setRecord((previous) => ({ ...previous, active: null }));
  }, []);

  return { active: record.active, clear, inputState };
}
