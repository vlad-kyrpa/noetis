import { useCallback, useMemo, useState } from 'react';
import { useModuleClient } from '../../../common/backend-client/useModuleClient';
import { parseTagsText } from '../../../common/tags/tags-text';
import { tasksClientModule } from '../api/tasks-client';
import { NO_TASK_FORM_FEEDBACK, toTaskFormFeedback } from '../api/task-form-feedback';
import { TaskEditFormState } from '../types';
import type {
  TaskEditDraft,
  TaskEditFormModel,
  TaskFormFeedback,
  UseTaskEditFormParams,
} from '../types';
import { createTaskEditDraft, hasTaskDraftChanges, toTaskInput } from '../views/task-draft';

// Owns the always-editable details form. The draft starts as the saved task; `isDirty` tells
// whether saving is worth offering. Remount it (keyed on the saved version) to pick up a new
// saved task, so a save or reload never fights with what the user is typing.
export function useTaskEditForm({ onSaved, task }: UseTaskEditFormParams): TaskEditFormModel {
  const tasksClient = useModuleClient(tasksClientModule);
  const [draft, setDraft] = useState<TaskEditDraft>(() => createTaskEditDraft(task));
  const [feedback, setFeedback] = useState<TaskFormFeedback>(NO_TASK_FORM_FEEDBACK);
  const [state, setState] = useState(TaskEditFormState.Ready);
  const tags = useMemo(() => parseTagsText(draft.tagsText), [draft.tagsText]);
  const isDirty = useMemo(() => hasTaskDraftChanges({ draft, task }), [draft, task]);

  const updateDraft = useCallback((changes: Partial<TaskEditDraft>): void => {
    setDraft((current) => ({ ...current, ...changes }));
    setFeedback(NO_TASK_FORM_FEEDBACK);
  }, []);

  const save = useCallback(async (): Promise<void> => {
    setState(TaskEditFormState.Saving);
    setFeedback(NO_TASK_FORM_FEEDBACK);
    const updateResult = await tasksClient.update({
      id: task.id,
      input: toTaskInput({ draft, task }),
    });
    setState(TaskEditFormState.Ready);

    if (updateResult.ok) {
      onSaved(updateResult.value);
      return;
    }

    setFeedback(toTaskFormFeedback(updateResult.error));
  }, [draft, onSaved, task, tasksClient]);

  return { draft, feedback, isDirty, save, state, tags, updateDraft };
}
