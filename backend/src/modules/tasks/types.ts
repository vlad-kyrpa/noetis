/** Limits task lifecycle state to the values described by the domain. */
export type TaskStatus = 'undone' | 'inProgress' | 'done';

/** Represents a fully hydrated task returned from the Tasks module. */
export interface Task {
  readonly id: string;
  readonly userId: string;
  readonly tags: readonly string[];
  readonly title: string;
  readonly description: string | null;
  readonly dueTo: string | null;
  readonly status: TaskStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly linkedTaskIds: readonly string[];
  readonly linkedNoteIds: readonly string[];
}

/** Defines the write model required to create or replace a task. */
export interface TaskInput {
  readonly title: string;
  readonly description: string | null;
  readonly tags: readonly string[];
  readonly dueTo: string | null;
  readonly status: TaskStatus;
  readonly linkedTaskIds: readonly string[];
  readonly linkedNoteIds: readonly string[];
}

/** Defines the documented Tasks query filters; every supplied filter combines with AND. */
export interface TaskFilters {
  /** Case-insensitive substring of the title. */
  readonly title?: string;
  readonly tagId?: string;
  /** Exact YYYY-MM-DD day, or 'defined' for any task with a due date. */
  readonly dueTo?: string;
  /** Inclusive lower YYYY-MM-DD bound of the due date. */
  readonly dueFrom?: string;
  /** Inclusive upper YYYY-MM-DD bound of the due date. */
  readonly dueUntil?: string;
  /** Tasks carrying every tag of this owned view; an unknown view matches nothing. */
  readonly viewId?: string;
  /** Tasks carrying every one of these lower-cased labels (query: comma-joined). */
  readonly tags?: readonly string[];
  readonly status?: TaskStatus;
}

/** Defines the storage-agnostic behavior exposed by the Tasks module. */
export interface TasksService {
  create(input: TaskInput): Promise<Task>;
  update(params: { readonly id: string; readonly input: TaskInput }): Promise<Result<Task>>;
  remove(ids: readonly string[]): Promise<void>;
  get(ids: readonly string[]): Promise<readonly Task[]>;
  find(filters: TaskFilters): Promise<readonly Task[]>;
  findNoteByTitleAndLink(params: {
    readonly taskId: string;
    readonly title: string;
  }): Promise<Result<string>>;
  findTaskByTitleAndLink(params: {
    readonly taskId: string;
    readonly title: string;
  }): Promise<Result<string>>;
}
import type { Result } from '../common/utils/result';
