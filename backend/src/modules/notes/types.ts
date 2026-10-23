/** Represents a fully hydrated note returned from the Notes module. */
export interface Note {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly tags: readonly string[];
  readonly linkedTaskIds: readonly string[];
  readonly linkedNoteIds: readonly string[];
}

/** Defines the write model required to create or replace a note. */
export interface NoteInput {
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
  readonly linkedTaskIds: readonly string[];
  readonly linkedNoteIds: readonly string[];
}

/** Defines the documented Notes query filters. */
export interface NoteFilters {
  readonly title?: string;
  readonly body?: string;
  readonly tag?: string;
}

/** Defines the storage-agnostic behavior exposed by the Notes module. */
export interface NotesService {
  create(input: NoteInput): Promise<Note>;
  update(params: { readonly id: string; readonly input: NoteInput }): Promise<Result<Note>>;
  remove(ids: readonly string[]): Promise<void>;
  get(ids: readonly string[]): Promise<readonly Note[]>;
  find(filters: NoteFilters): Promise<readonly Note[]>;
}
import type { Result } from '../common/utils/result';
