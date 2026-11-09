import type { HttpValidationIssues } from '../../common/api/types';
import type { BackendResult } from '../../common/backend-client/types';
import type { Result } from '../../common/result/types';

// Wire values match the backend `ViewType`; every area that saves views owns one member.
export enum ViewType {
  Task = 'task',
  Note = 'note',
  Expense = 'expense',
}

export type ViewId = string;

// A saved view: a titled set of tags that filters one record collection.
export interface View {
  readonly id: ViewId;
  readonly tags: readonly string[];
  readonly title: string;
  readonly type: ViewType;
}

// The write model of `POST /views`; tags are already lower-cased and deduped.
export interface ViewInput {
  readonly tags: readonly string[];
  readonly title: string;
  readonly type: ViewType;
}

// Per-type wording, so the create form never branches on the type.
export interface ViewTypeDefinition {
  readonly label: string;
  readonly titlePlaceholder: string;
}

export interface ListViewsParams {
  readonly type: ViewType;
}

export enum CreateViewFailureKind {
  DuplicateTitle,
  Invalid,
  Network,
  Unknown,
}

export type CreateViewFailure =
  | { readonly kind: CreateViewFailureKind.DuplicateTitle }
  | { readonly issues: HttpValidationIssues; readonly kind: CreateViewFailureKind.Invalid }
  | { readonly kind: CreateViewFailureKind.Network }
  | { readonly kind: CreateViewFailureKind.Unknown; readonly message: string };

export interface ViewsClient {
  create: (input: ViewInput) => Promise<Result<View, CreateViewFailure>>;
  list: (params: ListViewsParams) => BackendResult<readonly View[]>;
}

export interface CreateViewPageProps {
  // Non-empty; one type is fixed, several show a type picker.
  readonly onCancel: () => void;
  readonly onCreated: (view: View) => void;
  readonly types: readonly ViewType[];
}

export interface UseCreateViewFormParams {
  readonly onCreated: (view: View) => void;
  readonly types: readonly ViewType[];
}

export enum CreateViewFormState {
  Ready,
  Submitting,
}

// What the form shows after a failed submit: per-field issues and an optional form message.
export interface CreateViewFeedback {
  readonly issues: HttpValidationIssues;
  readonly message: string | null;
}

export interface CreateViewFormValues {
  readonly tagsText: string;
  readonly title: string;
  readonly type: ViewType;
}

export interface CreateViewFormModel {
  readonly feedback: CreateViewFeedback;
  readonly setTagsText: (tagsText: string) => void;
  readonly setTitle: (title: string) => void;
  readonly setType: (type: ViewType) => void;
  readonly state: CreateViewFormState;
  readonly submit: () => Promise<void>;
  // Tags as they will be saved, shown as chips while typing.
  readonly tags: readonly string[];
  readonly types: readonly ViewType[];
  readonly values: CreateViewFormValues;
}
