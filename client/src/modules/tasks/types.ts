import type { BackendResult } from '../../common/backend-client/types';
import type { DateRange, IsoDate, Weekday } from '../../common/regional/types';
import type { SearchInputState, SearchQuery } from '../../common/search/types';
import type { View } from '../views/types';

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

// What a task list asks the backend for; every field present combines with AND.
export interface TaskListQuery {
  readonly dueFrom?: IsoDate;
  readonly dueUntil?: IsoDate;
  // Lower-cased labels; the tasks client sends them comma-joined.
  readonly tags?: readonly string[];
  readonly title?: string;
  readonly viewId?: string;
}

export interface UpdateTaskParams {
  readonly id: TaskId;
  readonly input: TaskInput;
}

export interface RemoveTasksInput {
  readonly ids: readonly TaskId[];
}

// Reserved route ids of the hardcoded views; also their URL segment under `/tasks/views`.
export enum BuiltInViewId {
  Day = 'day',
  Week = 'week',
  All = 'all',
}

// What a selected view is, so query building and headers can be looked up by key.
export enum ViewKind {
  Day = 'day',
  Week = 'week',
  All = 'all',
  Custom = 'custom',
}

// Values are the day offset of one step, so ◀ / ▶ multiply them by the period length.
export enum PeriodDirection {
  Previous = -1,
  Next = 1,
}

export type PeriodViewKind = ViewKind.Day | ViewKind.Week;

// A Day or Week selection; Week's anchor is always the regional first day of that week.
export interface PeriodSelection {
  readonly anchor: IsoDate;
  readonly kind: PeriodViewKind;
}

export type ViewSelection =
  | PeriodSelection
  | { readonly kind: ViewKind.All }
  | { readonly kind: ViewKind.Custom; readonly viewId: string };

// How a built-in view is listed and which panel features it gets.
export interface BuiltInViewDefinition {
  readonly hasPeriodHeader: boolean;
  readonly hasViewActions: boolean;
  readonly id: BuiltInViewId;
  readonly kind: ViewKind;
  readonly label: string;
  readonly order: number;
}

// Wording of one period kind: the step's accessible labels.
export interface PeriodDefinition {
  readonly nextLabel: string;
  readonly previousLabel: string;
  readonly stepDays: number;
}

// Lifecycle of one remote read, shared by the views list and task lists. `Idle` means there is
// nothing to load yet, e.g. the search page before any search.
export enum LoadState {
  Idle,
  Loading,
  Ready,
  Failed,
}

// The user's saved task views as last loaded; `views` keeps the previous list while reloading.
export interface TaskViewsSnapshot {
  readonly state: LoadState;
  readonly views: readonly View[];
}

export interface TaskViewsState extends TaskViewsSnapshot {
  readonly reload: () => void;
}

// Where a search was submitted: a view id (`day`, `week`, `all` or a UUID) or the global scope.
export type SearchScope = string;

export interface ActiveSearch {
  readonly query: SearchQuery;
  readonly scope: SearchScope;
  // Increments on every submit, so re-submitting an identical query still sends one request.
  readonly submission: number;
}

export interface TaskSearchState {
  readonly active: ActiveSearch | null;
  readonly clear: () => void;
  readonly inputState: SearchInputState;
}

// Shared by the tasks shell with its panels through the router outlet.
export interface TasksOutletContext {
  readonly activeSearch: ActiveSearch | null;
  readonly clearSearch: () => void;
  readonly reloadViews: () => void;
  readonly views: TaskViewsSnapshot;
}

export interface UseTaskListParams {
  // `null` means nothing to fetch yet; the list stays `Idle`.
  readonly query: TaskListQuery | null;
  readonly submission: number;
}

export interface TaskListState {
  readonly reload: () => void;
  readonly state: LoadState;
  readonly tasks: readonly Task[];
}

// One finished load, tagged with the request it answers so stale results are never shown.
export interface TaskListSnapshot {
  readonly generation: number;
  readonly query: TaskListQuery | null;
  readonly state: LoadState;
  readonly submission: number;
  readonly tasks: readonly Task[];
}

export interface ViewSelectionState {
  readonly selection: ViewSelection;
  readonly step: (direction: PeriodDirection) => void;
  readonly viewId: string;
}

export interface ResolveViewSelectionParams {
  readonly dateParam: string | null;
  readonly firstDayOfWeek: Weekday;
  readonly today: IsoDate;
  readonly viewId: string;
}

export interface ShiftSelectionParams {
  readonly direction: PeriodDirection;
  readonly selection: PeriodSelection;
}

export interface FormatPeriodTitleParams {
  readonly locale: string;
  readonly selection: PeriodSelection;
}

// One weekday section of the Week view.
export interface DayGroup {
  readonly date: IsoDate;
  readonly label: string;
  readonly tasks: readonly Task[];
}

export interface GroupTasksByDayParams {
  readonly locale: string;
  readonly range: DateRange;
  readonly tasks: readonly Task[];
}

export interface MergeTaskListQueriesParams {
  readonly search: TaskListQuery | null;
  readonly view: TaskListQuery;
}

export interface SearchForScopeParams {
  readonly active: ActiveSearch | null;
  readonly scope: SearchScope;
}

export interface TasksClient {
  create: (input: TaskInput) => BackendResult<Task>;
  get: (id: TaskId) => BackendResult<Task>;
  list: (query: TaskListQuery) => BackendResult<readonly Task[]>;
  remove: (ids: readonly TaskId[]) => BackendResult<readonly TaskId[]>;
  update: (params: UpdateTaskParams) => BackendResult<Task>;
}

// What a new task starts with, taken from the list it was created from.
export interface TaskDraftDefaults {
  readonly dueTo: IsoDate | null;
  readonly tags: readonly string[];
}

export interface ResolveTaskDraftDefaultsParams {
  readonly selection: ViewSelection | null;
  readonly views: readonly View[];
}

export interface ResolveReturnSelectionParams {
  readonly firstDayOfWeek: Weekday;
  readonly returnTo: string | null;
  readonly today: IsoDate;
}

export interface UseCreateTaskFormParams {
  readonly defaults: TaskDraftDefaults;
  readonly onCreated: (task: Task) => void;
}

export enum CreateTaskFormState {
  Ready,
  Submitting,
}

// What the form shows after a failed submit: per-field issues and an optional form message.
export interface TaskFormFeedback {
  readonly issues: Readonly<Record<string, string>>;
  readonly message: string | null;
}

// Raw input values; `dueTo` is the date input's `YYYY-MM-DD` or an empty string.
export interface CreateTaskFormValues {
  readonly dueTo: string;
  readonly tagsText: string;
  readonly title: string;
}

export interface CreateTaskFormModel {
  readonly feedback: TaskFormFeedback;
  readonly setDueTo: (dueTo: string) => void;
  readonly setTagsText: (tagsText: string) => void;
  readonly setTitle: (title: string) => void;
  readonly state: CreateTaskFormState;
  readonly submit: () => Promise<void>;
  // Tags as they will be saved, shown as chips while typing.
  readonly tags: readonly string[];
  readonly values: CreateTaskFormValues;
}

export interface TaskDetailsState {
  // True once the backend answered 404: the task is gone or belongs to someone else.
  readonly isMissing: boolean;
  readonly reload: () => void;
  // Shows a task the caller already has (e.g. the response of a save) without refetching.
  readonly replaceTask: (task: Task) => void;
  readonly state: LoadState;
  readonly task: Task | null;
}

// One finished lookup, tagged with the id and generation it answers so stale results are hidden.
export interface TaskDetailsSnapshot {
  readonly generation: number;
  readonly isMissing: boolean;
  readonly state: LoadState;
  readonly task: Task | null;
  readonly taskId: TaskId;
}

// One editable task as typed: raw input values, normalized only when compared or saved.
export interface TaskEditDraft {
  readonly description: string;
  // The date input's `YYYY-MM-DD`, or an empty string for "no due date".
  readonly dueTo: string;
  readonly status: TaskStatus;
  readonly tagsText: string;
  readonly title: string;
}

export interface TaskDraftParams {
  readonly draft: TaskEditDraft;
  readonly task: Task;
}

export interface UseTaskEditFormParams {
  readonly onSaved: (task: Task) => void;
  readonly task: Task;
}

export enum TaskEditFormState {
  Ready,
  Saving,
}

export interface TaskEditFormModel {
  readonly draft: TaskEditDraft;
  readonly feedback: TaskFormFeedback;
  // True when any field differs from the saved task; only then is saving offered.
  readonly isDirty: boolean;
  readonly save: () => Promise<void>;
  readonly state: TaskEditFormState;
  // Tags as they will be saved, shown as chips while typing.
  readonly tags: readonly string[];
  readonly updateDraft: (changes: Partial<TaskEditDraft>) => void;
}
