import type { DayGroup, LoadState, Task } from '../../types';

export interface TaskListProps {
  // Week view: tasks grouped under seven day headings; `null` renders a flat list.
  readonly dayGroups: readonly DayGroup[] | null;
  readonly emptyMessage: string;
  // Hidden in the Day view, where every task shares the same date.
  readonly isDueDateShown: boolean;
  readonly onRetry: () => void;
  readonly state: LoadState;
  readonly tasks: readonly Task[];
}

export interface TaskRowsProps {
  readonly isDueDateShown: boolean;
  readonly tasks: readonly Task[];
}

export interface TaskRowProps {
  readonly isDueDateShown: boolean;
  readonly task: Task;
}

export interface DayGroupsProps {
  readonly dayGroups: readonly DayGroup[];
}
