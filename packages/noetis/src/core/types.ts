export type Result<Success, Failure> =
  { ok: true; value: Success } | { ok: false; error: Failure };

export type CoreError = {
  code: "record-not-found" | "storage-failed" | "validation-failed";
  message: string;
};

export type NoteId = string;

export type AttachmentId = string;

export type StoredQueryId = string;

export type StoredQuery = {
  tags: string[];
};

export type StoredQueryPayload = {
  name: string;
  query: StoredQuery;
};

export type StoredQueryItem = {
  id: StoredQueryId;
  name: string;
  query: StoredQuery;
};

export type StoredQueryContainer = {
  id: StoredQueryId;
  name: string;
  queries: StoredQueryItem[];
};

export type StoredQueryContainerPayload = {
  name: string;
};

export type UpdateStoredRecordParams = {
  id: NoteId;
  payload: UpdateNotePayload;
};

export interface FileSystemAdapter {
  isExists: (path: string) => Promise<boolean>;
  isFile: (path: string) => Promise<boolean>;
  isDirectory: (path: string) => Promise<boolean>;
  getDirectoryContent: (directoryPath: string) => Promise<readonly string[]>;
  getFileContent: (path: string) => Promise<string>;
  writeFileContent: (path: string, content: string) => Promise<void>;
  removeFile: (path: string) => Promise<void>;
  createDirectory: (path: string) => Promise<void>;
  getRootDirectory: () => Promise<string>;
  getRelativePath: (path: string) => Promise<string>;
  getDirectoryName: (path: string) => Promise<string>;
  combinePaths: (parts: readonly string[]) => Promise<string>;
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
  createStoredQuery: (
    payload: CreateStoredQueryPayload,
  ) => Promise<Result<StoredQueryItem, CoreError>>;
  createStoredQueryContainer: (
    payload: CreateStoredQueryContainerPayload,
  ) => Promise<Result<StoredQueryContainer, CoreError>>;
  updateStoredQueryContainer: (
    payload: UpdateStoredQueryContainerPayload,
  ) => Promise<Result<StoredQueryContainer, CoreError>>;
  removeStoredQueryContainer: (
    payload: RemoveStoredQueryContainerPayload,
  ) => Promise<Result<void, CoreError>>;
  updateStoredQuery: (
    payload: UpdateStoredQueryPayload,
  ) => Promise<Result<StoredQueryItem, CoreError>>;
  removeStoredQuery: (
    payload: RemoveStoredQueryPayload,
  ) => Promise<Result<void, CoreError>>;
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

export type CreateStoredQueryPayload = {
  containerId?: StoredQueryId;
  query: StoredQueryPayload;
};

export type CreateStoredQueryCommand = {
  id: "create-stored-query";
  payload: CreateStoredQueryPayload;
};

export type CreateStoredQueryContainerPayload = {
  container: StoredQueryContainerPayload;
};

export type CreateStoredQueryContainerCommand = {
  id: "create-stored-query-container";
  payload: CreateStoredQueryContainerPayload;
};

export type UpdateStoredQueryContainerPayload = {
  id: StoredQueryId;
  container: StoredQueryContainerPayload;
};

export type UpdateStoredQueryContainerCommand = {
  id: "update-stored-query-container";
  payload: UpdateStoredQueryContainerPayload;
};

export type RemoveStoredQueryContainerPayload = {
  id: StoredQueryId;
};

export type RemoveStoredQueryContainerCommand = {
  id: "remove-stored-query-container";
  payload: RemoveStoredQueryContainerPayload;
};

export type UpdateStoredQueryPayload = {
  id: StoredQueryId;
  query: StoredQueryPayload;
};

export type UpdateStoredQueryCommand = {
  id: "update-stored-query";
  payload: UpdateStoredQueryPayload;
};

export type RemoveStoredQueryPayload = {
  id: StoredQueryId;
};

export type RemoveStoredQueryCommand = {
  id: "remove-stored-query";
  payload: RemoveStoredQueryPayload;
};

export type Command =
  | CreateNoteCommand
  | UpdateNoteCommand
  | RemoveNoteCommand
  | CreateStoredQueryCommand
  | CreateStoredQueryContainerCommand
  | UpdateStoredQueryContainerCommand
  | RemoveStoredQueryContainerCommand
  | UpdateStoredQueryCommand
  | RemoveStoredQueryCommand;

export type CommandResultById = {
  "create-note": StoredRecord;
  "update-note": StoredRecord;
  "remove-note": void;
  "create-stored-query": StoredQueryItem;
  "create-stored-query-container": StoredQueryContainer;
  "update-stored-query-container": StoredQueryContainer;
  "remove-stored-query-container": void;
  "update-stored-query": StoredQueryItem;
  "remove-stored-query": void;
};

export type CommandResult<Id extends Command["id"]> = Result<
  CommandResultById[Id],
  CoreError
>;

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
