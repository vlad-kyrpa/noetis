export type Result<Success, Failure> =
  { ok: true; value: Success } | { ok: false; error: Failure };

export type CoreError = {
  code: "record-not-found" | "storage-failed" | "validation-failed";
  message: string;
};

export type NoteId = string;

export type AttachmentId = string;

export type UpdateStoredRecordParams = {
  id: NoteId;
  payload: UpdateNotePayload;
};

export interface FileSystemAdapter {
  isExists: (path: string) => boolean;
  isFile: (path: string) => boolean;
  isDirectory: (path: string) => boolean;
  getDirectoryContent: (directoryPath: string) => readonly string[];
  getFileContent: (path: string) => string;
  writeFileContent: (path: string, content: string) => void;
  removeFile: (path: string) => void;
  createDirectory: (path: string) => void;
  getRootDirectory: () => string;
  getRelativePath: (path: string) => string;
  getDirectoryName: (path: string) => string;
  combinePaths: (parts: readonly string[]) => string;
}

export interface CoreStorage {
  addRecord: (
    payload: CreateNotePayload,
  ) => Promise<Result<StoredRecord, CoreError>>;
  updateRecord: (
    params: UpdateStoredRecordParams,
  ) => Promise<Result<StoredRecord, CoreError>>;
  removeRecord: (id: NoteId) => Promise<Result<void, CoreError>>;
  getRecords: (ids: NoteId[]) => Promise<Result<StoredRecord[], CoreError>>;
  findRecords: (
    query: Query,
  ) => Promise<Result<StoredRecordHeader[], CoreError>>;
}

export type CreateNotePayload = {
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
};

export type CreateNoteCommand = {
  id: "create-note";
  payload: CreateNotePayload;
};

export type UpdateNotePayload = {
  id: NoteId;
  title: string;
  content: string;
  tags: string[];
  updatedAt: Date;
};

export type UpdateNoteCommand = {
  id: "update-note";
  payload: UpdateNotePayload;
};

export type RemoveNotePayload = {
  id: NoteId;
};

export type RemoveNoteCommand = {
  id: "remove-note";
  payload: RemoveNotePayload;
};

export type Command = CreateNoteCommand | UpdateNoteCommand | RemoveNoteCommand;

export type Query = {
  text: string;
  tags: string[];
};

export type Attachment = {
  id: AttachmentId;
  title: string;
  attachedAt: Date;
};

export type StoredRecord = {
  id: NoteId;
  title: string;
  content: string;
  tags: string[];
  attachments: Attachment[];
  createdAt: Date;
  updatedAt?: Date;
};

export type StoredRecordHeader = {
  id: NoteId;
  title: string;
  shortContent: string;
  tags: string[];
  createdAt: Date;
  updatedAt?: Date;
  hasAttachments: boolean;
};
