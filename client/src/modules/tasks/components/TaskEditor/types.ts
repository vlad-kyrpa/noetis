import type { Task } from '../../types';

export interface TaskEditorProps {
  // Where the back link in the editor's top line goes.
  readonly backTo: string;
  readonly onSaved: (task: Task) => void;
  // The saved version; remount the editor (key on `updatedAt`) when it changes.
  readonly task: Task;
}

export interface TaskTimestampsProps {
  readonly task: Task;
}

export interface TaskEditorSaveButtonProps {
  readonly isDirty: boolean;
  readonly isSaving: boolean;
}
