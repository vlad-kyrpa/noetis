import { ViewKind } from '../types';
import type { TaskListQuery, ViewSelection } from '../types';
import { isPeriodSelection, resolvePeriodRange } from './periods';

const ALL_TASKS_QUERY: TaskListQuery = {};

// Turns a selected view into its backend filters: a date range, a view id, or nothing (All).
export const toTaskListQuery = (selection: ViewSelection): TaskListQuery => {
  if (isPeriodSelection(selection)) {
    const { from, until } = resolvePeriodRange(selection);

    return { dueFrom: from, dueUntil: until };
  }

  return selection.kind === ViewKind.Custom ? { viewId: selection.viewId } : ALL_TASKS_QUERY;
};
