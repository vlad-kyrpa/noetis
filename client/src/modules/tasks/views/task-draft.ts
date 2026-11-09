import { formatTagsText, parseTagsText } from '../../../common/tags/tags-text';
import type { Task, TaskDraftParams, TaskEditDraft, TaskInput } from '../types';

// Empty text fields mean "no value" for the optional description and due date.
const EMPTY_FIELD = '';

// Maps an optional text field to its saved value: trimmed text, or null when blank.
const toOptionalText = (text: string): string | null => {
  const trimmed = text.trim();

  return trimmed === EMPTY_FIELD ? null : trimmed;
};

// Seeds the editable fields from the saved task.
export const createTaskEditDraft = (task: Task): TaskEditDraft => ({
  description: task.description ?? EMPTY_FIELD,
  dueTo: task.dueTo ?? EMPTY_FIELD,
  status: task.status,
  tagsText: formatTagsText(task.tags),
  title: task.title,
});

// Builds the full replacement `PUT /tasks/:id` expects. Fields the editor does not show
// (linked tasks and notes) are carried over, so saving never drops them.
export const toTaskInput = ({ draft, task }: TaskDraftParams): TaskInput => ({
  description: toOptionalText(draft.description),
  dueTo: toOptionalText(draft.dueTo),
  linkedNoteIds: task.linkedNoteIds,
  linkedTaskIds: task.linkedTaskIds,
  status: draft.status,
  tags: parseTagsText(draft.tagsText),
  title: draft.title.trim(),
});

// Tags are a set (the backend keeps no order), so they are compared sorted.
const toTagSetKey = (tags: readonly string[]): string => formatTagsText([...tags].sort());

// Compares what would be saved with what is saved, so surrounding whitespace, tag letter case
// and tag order never count as a change.
export const hasTaskDraftChanges = ({ draft, task }: TaskDraftParams): boolean => {
  const { description, dueTo, status, tags, title } = toTaskInput({ draft, task });
  const haveTagsChanged = toTagSetKey(tags) !== toTagSetKey(task.tags);

  return (
    title !== task.title ||
    description !== task.description ||
    dueTo !== task.dueTo ||
    status !== task.status ||
    haveTagsChanged
  );
};
