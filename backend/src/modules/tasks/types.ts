/** Limits task lifecycle state to the values described by the domain. */
export type TaskStatus = 'undone' | 'inProgress' | 'done';

/** Represents a fully hydrated task returned from the Tasks module. */
export interface Task {
  readonly id: string;
  readonly tagId: string | null;
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
  readonly tagId: string | null;
  readonly dueTo: string | null;
  readonly status: TaskStatus;
  readonly linkedTaskIds: readonly string[];
  readonly linkedNoteIds: readonly string[];
}

/** Defines the documented Tasks query filters. */
export interface TaskFilters {
  readonly title?: string;
  readonly tagId?: string;
  readonly dueTo?: string;
  readonly status?: TaskStatus;
}

/** Defines the storage-agnostic behavior exposed by the Tasks module. */
export interface TasksService {
  create(input: TaskInput): Promise<Task>;
  update(params: { readonly id: string; readonly input: TaskInput }): Promise<Task | null>;
  remove(ids: readonly string[]): Promise<void>;
  get(ids: readonly string[]): Promise<readonly Task[]>;
  find(filters: TaskFilters): Promise<readonly Task[]>;
  findNoteByTitleAndLink(params: {
    readonly taskId: string;
    readonly title: string;
  }): Promise<string | null>;
  findTaskByTitleAndLink(params: {
    readonly taskId: string;
    readonly title: string;
  }): Promise<string | null>;
}
