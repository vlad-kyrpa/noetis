import { useCallback, useMemo, useState } from 'react';
import { useModuleClient } from '../../../common/backend-client/useModuleClient';
import { formatTagsText, parseTagsText } from '../../../common/tags/tags-text';
import { tasksClientModule } from '../api/tasks-client';
import { NO_TASK_FORM_FEEDBACK, toTaskFormFeedback } from '../api/task-form-feedback';
import { CreateTaskFormState, TaskStatus } from '../types';
import type { CreateTaskFormModel, TaskFormFeedback, UseCreateTaskFormParams } from '../types';

const NO_DUE_DATE = '';
const NO_FEEDBACK = NO_TASK_FORM_FEEDBACK;

// Owns the create task form: values seeded from the origin list, the saved form of the tags,
// feedback, and submit. New tasks start as `undone` without links; details come later.
export function useCreateTaskForm({
  defaults,
  onCreated,
}: UseCreateTaskFormParams): CreateTaskFormModel {
  const tasksClient = useModuleClient(tasksClientModule);
  const [title, setRawTitle] = useState('');
  const [tagsText, setRawTagsText] = useState(() => formatTagsText(defaults.tags));
  const [dueTo, setRawDueTo] = useState<string>(defaults.dueTo ?? NO_DUE_DATE);
  const [feedback, setFeedback] = useState<TaskFormFeedback>(NO_FEEDBACK);
  const [state, setState] = useState(CreateTaskFormState.Ready);
  const tags = useMemo(() => parseTagsText(tagsText), [tagsText]);

  const setTitle = useCallback((nextTitle: string): void => {
    setRawTitle(nextTitle);
    setFeedback(NO_FEEDBACK);
  }, []);

  const setTagsText = useCallback((nextTagsText: string): void => {
    setRawTagsText(nextTagsText);
    setFeedback(NO_FEEDBACK);
  }, []);

  const setDueTo = useCallback((nextDueTo: string): void => {
    setRawDueTo(nextDueTo);
    setFeedback(NO_FEEDBACK);
  }, []);

  const submit = useCallback(async (): Promise<void> => {
    setState(CreateTaskFormState.Submitting);
    setFeedback(NO_FEEDBACK);
    const createResult = await tasksClient.create({
      description: null,
      dueTo: dueTo === NO_DUE_DATE ? null : dueTo,
      linkedNoteIds: [],
      linkedTaskIds: [],
      status: TaskStatus.Undone,
      tags,
      title: title.trim(),
    });
    setState(CreateTaskFormState.Ready);

    if (createResult.ok) {
      onCreated(createResult.value);
      return;
    }

    setFeedback(toTaskFormFeedback(createResult.error));
  }, [dueTo, onCreated, tags, tasksClient, title]);

  return {
    feedback,
    setDueTo,
    setTagsText,
    setTitle,
    state,
    submit,
    tags,
    values: { dueTo, tagsText, title },
  };
}
