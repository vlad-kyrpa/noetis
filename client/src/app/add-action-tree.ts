import type { AddActionTrees, ContextAddAction } from '../common/components/ContextAddButton/types';
import { AppArea } from '../common/navigation/types';
import { routes } from '../routes';

const CREATE_VIEW: ContextAddAction = { label: 'create view', route: routes.tasks.createView };
const CREATE_TASK: ContextAddAction = { label: 'create task', route: routes.tasks.create };

// What + does at each URL. Every area owns one subtree rooted at its route root; the deepest
// matching node with a value wins. `null` hides the button, `route: null` only logs (no flow yet).
// In tasks: the views list and the create view form create views, any open list creates tasks.
export const ADD_ACTION_TREES: AddActionTrees = {
  [AppArea.Home]: { pattern: routes.home, value: { label: 'quick add', route: null } },
  [AppArea.Tasks]: {
    children: [
      // Static `views/new` before `views/:viewId`, which would also match it.
      { pattern: routes.tasks.createView, value: CREATE_VIEW },
      { pattern: routes.tasks.list, value: CREATE_TASK },
      { pattern: routes.tasks.search, value: CREATE_TASK },
      { pattern: routes.tasks.create, value: CREATE_TASK },
      // Last: `:taskId` would also match `search` and `new`.
      { pattern: routes.tasks.details, value: CREATE_TASK },
    ],
    pattern: routes.tasks.root,
    value: CREATE_VIEW,
  },
  [AppArea.Notes]: { pattern: routes.notes.root, value: { label: 'create note', route: null } },
  [AppArea.Expenses]: {
    pattern: routes.expenses.root,
    value: { label: 'add expense', route: null },
  },
  [AppArea.Menu]: { pattern: routes.menu, value: null },
};
