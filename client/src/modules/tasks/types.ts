import type { BackendResult } from '../../common/backend-client/types';

// Values match the backend wire format.
export enum TaskStatus {
  Undone = 'undone',
  InProgress = 'inProgress',
  Done = 'done',
}

export type TaskId = string;

// Timestamps stay ISO strings as sent over JSON; `dueTo` is a `YYYY-MM-DD` date or null.
export interface Task {
  readonly createdAt: string;
  readonly description: string | null;
  readonly dueTo: string | null;
  readonly id: TaskId;
  readonly linkedNoteIds: readonly string[];
  readonly linkedTaskIds: readonly TaskId[];
  readonly status: TaskStatus;
  readonly tags: readonly string[];
  readonly title: string;
  readonly updatedAt: string;
  readonly userId: string;
}

// The full write model accepted by create and update (update replaces the task).
export interface TaskInput {
  readonly description: string | null;
  readonly dueTo: string | null;
  readonly linkedNoteIds: readonly string[];
  readonly linkedTaskIds: readonly TaskId[];
  readonly status: TaskStatus;
  readonly tags: readonly string[];
  readonly title: string;
}

export interface TaskFilters {
  readonly dueTo?: string;
  readonly status?: TaskStatus;
  readonly tagId?: string;
  readonly title?: string;
}

export interface UpdateTaskParams {
  readonly id: TaskId;
  readonly input: TaskInput;
}

export interface RemoveTasksInput {
  readonly ids: readonly TaskId[];
}

export interface TasksClient {
  create: (input: TaskInput) => BackendResult<Task>;
  get: (id: TaskId) => BackendResult<Task>;
  list: (filters: TaskFilters) => BackendResult<readonly Task[]>;
  remove: (ids: readonly TaskId[]) => BackendResult<readonly TaskId[]>;
  update: (params: UpdateTaskParams) => BackendResult<Task>;
}
