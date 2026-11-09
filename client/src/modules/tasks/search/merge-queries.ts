import type { MergeTaskListQueriesParams, TaskListQuery } from '../types';

// Narrows a view by a search: the view contributes its range or view id, the search its title
// and tags, and the backend ANDs them all.
export const mergeTaskListQueries = ({
  search,
  view,
}: MergeTaskListQueriesParams): TaskListQuery => (search === null ? view : { ...view, ...search });
