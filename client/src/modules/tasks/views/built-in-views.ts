import { BuiltInViewId, ViewKind } from '../types';
import type { BuiltInViewDefinition } from '../types';

// The hardcoded views that always lead the list; built-ins have nothing to edit or delete.
export const BUILT_IN_VIEWS: Readonly<Record<BuiltInViewId, BuiltInViewDefinition>> = {
  [BuiltInViewId.Day]: {
    hasPeriodHeader: true,
    hasViewActions: false,
    id: BuiltInViewId.Day,
    kind: ViewKind.Day,
    label: 'Day',
    order: 0,
  },
  [BuiltInViewId.Week]: {
    hasPeriodHeader: true,
    hasViewActions: false,
    id: BuiltInViewId.Week,
    kind: ViewKind.Week,
    label: 'Week',
    order: 1,
  },
  [BuiltInViewId.All]: {
    hasPeriodHeader: false,
    hasViewActions: false,
    id: BuiltInViewId.All,
    kind: ViewKind.All,
    label: 'All tasks',
    order: 2,
  },
};

const BUILT_IN_VIEW_IDS: ReadonlySet<string> = new Set(Object.values(BuiltInViewId));

// Built-ins in display order, computed once because the record never changes. `Object.values`
// returns a fresh array, so sorting it in place touches no shared state.
export const ORDERED_BUILT_IN_VIEWS: readonly BuiltInViewDefinition[] = Object.values(
  BUILT_IN_VIEWS,
).sort((left, right) => left.order - right.order);

// Tells a reserved built-in route id apart from a saved view's UUID.
export const isBuiltInViewId = (viewId: string): viewId is BuiltInViewId =>
  BUILT_IN_VIEW_IDS.has(viewId);
