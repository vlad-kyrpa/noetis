import { matchPath } from 'react-router-dom';
import { routes } from '../../../routes';
import type { ResolveReturnSelectionParams, ViewSelection } from '../types';
import { PERIOD_DATE_PARAM } from './view-path';
import { resolveViewSelection } from './view-selection';

// Only used to split a same-app path into pathname and query; never requested.
const PARSING_ORIGIN = 'https://app.invalid';

// Recovers which list a flow was opened from (e.g. `/tasks/views/day?date=…`), so it can use
// that context. Anything that is not an open view (search, create view, none) gives `null`.
export const resolveReturnSelection = ({
  firstDayOfWeek,
  returnTo,
  today,
}: ResolveReturnSelectionParams): ViewSelection | null => {
  if (returnTo === null) {
    return null;
  }

  const { pathname, searchParams } = new URL(returnTo, PARSING_ORIGIN);
  // `views/new` also matches `views/:viewId`, so it is ruled out first.
  const viewId =
    matchPath(routes.tasks.createView, pathname) === null
      ? matchPath(routes.tasks.list, pathname)?.params.viewId
      : undefined;

  return viewId === undefined
    ? null
    : resolveViewSelection({
        dateParam: searchParams.get(PERIOD_DATE_PARAM),
        firstDayOfWeek,
        today,
        viewId,
      });
};
