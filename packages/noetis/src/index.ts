export { CoreEngine } from "./core/core";
export { FileStorage } from "./core/file-storage";
export { ConsoleLogger } from "./core/console-logger";
export type { CoreEngineConfig, StateChangeCallback } from "./core/core";
export type { Logger } from "./core/logger";
export type {
  Attachment,
  AttachmentId,
  Command,
  CoreError,
  CoreStorage,
  CreateNoteCommand,
  CreateNotePayload,
  FileSystemAdapter,
  NoteId,
  Query,
  RemoveNoteCommand,
  RemoveNotePayload,
  Result,
  StoredRecord,
  StoredRecordHeader,
  UpdateNoteCommand,
  UpdateNotePayload,
  UpdateStoredRecordParams,
} from "./core/types";
