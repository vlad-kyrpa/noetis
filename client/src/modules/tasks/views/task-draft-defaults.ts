import { ViewKind } from '../types';
import type { ResolveTaskDraftDefaultsParams, TaskDraftDefaults } from '../types';

const NO_DRAFT_DEFAULTS: TaskDraftDefaults = { dueTo: null, tags: [] };

// Prefills a new task from its origin so it shows up in the list it was created from: a Day
// view sets the due date, a saved view adds its tags. Week, All and search add nothing.
export const resolveTaskDraftDefaults = ({
  selection,
  views,
}: ResolveTaskDraftDefaultsParams): TaskDraftDefaults => {
  if (selection?.kind === ViewKind.Day) {
    return { dueTo: selection.anchor, tags: [] };
  }

  if (selection?.kind === ViewKind.Custom) {
    const savedView = views.find((view) => view.id === selection.viewId);

    return { dueTo: null, tags: savedView?.tags ?? [] };
  }

  return NO_DRAFT_DEFAULTS;
};
