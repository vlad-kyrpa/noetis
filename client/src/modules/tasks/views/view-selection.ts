import { parseIsoDate } from '../../../common/regional/iso-date';
import type { IsoDate, Weekday } from '../../../common/regional/types';
import { startOfWeek } from '../../../common/regional/weeks';
import { BuiltInViewId, ViewKind } from '../types';
import type { ResolveViewSelectionParams, ViewSelection } from '../types';
import { isBuiltInViewId } from './built-in-views';

interface BuiltInSelectionParams {
  readonly anchor: IsoDate;
  readonly firstDayOfWeek: Weekday;
}

// How each built-in turns the anchor day into its selection; Week snaps to its first day.
const BUILT_IN_VIEW_TO_SELECTION: Readonly<
  Record<BuiltInViewId, (params: BuiltInSelectionParams) => ViewSelection>
> = {
  [BuiltInViewId.Day]: ({ anchor }) => ({ anchor, kind: ViewKind.Day }),
  [BuiltInViewId.Week]: ({ anchor, firstDayOfWeek }) => ({
    anchor: startOfWeek({ date: anchor, firstDayOfWeek }),
    kind: ViewKind.Week,
  }),
  [BuiltInViewId.All]: () => ({ kind: ViewKind.All }),
};

// Maps the route's view id and `?date=` to a selection. A missing or invalid date falls back to
// regional today; any id that is not a built-in is a saved view.
export const resolveViewSelection = ({
  dateParam,
  firstDayOfWeek,
  today,
  viewId,
}: ResolveViewSelectionParams): ViewSelection => {
  if (!isBuiltInViewId(viewId)) {
    return { kind: ViewKind.Custom, viewId };
  }

  const anchor = (dateParam === null ? undefined : parseIsoDate(dateParam)) ?? today;

  return BUILT_IN_VIEW_TO_SELECTION[viewId]({ anchor, firstDayOfWeek });
};
