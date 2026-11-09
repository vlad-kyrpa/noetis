import { ViewType } from './types';
import type { ViewTypeDefinition } from './types';

// Every view type must be described, so a new area cannot reach the form without wording.
export const VIEW_TYPE_DEFINITIONS: Readonly<Record<ViewType, ViewTypeDefinition>> = {
  [ViewType.Task]: { label: 'Tasks', titlePlaceholder: 'e.g. Work' },
  [ViewType.Note]: { label: 'Notes', titlePlaceholder: 'e.g. Reading list' },
  [ViewType.Expense]: { label: 'Expenses', titlePlaceholder: 'e.g. Groceries' },
};
