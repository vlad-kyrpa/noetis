import type {
  CoreError,
  CoreStorage,
  Result,
  StoredRecord,
  StoredRecordHeader,
} from "../types";

export const MOCK_NOTE_ID: string = "note-1";

export const MOCK_STORED_RECORD: StoredRecord = {
  id: MOCK_NOTE_ID,
  title: "Title",
  content: "Content",
  tags: [],
  attachments: [],
  createdAt: new Date("2026-08-15T00:00:00.000Z"),
};

export const MOCK_STORED_RECORD_HEADER: StoredRecordHeader = {
  id: MOCK_NOTE_ID,
  title: "Title",
  shortContent: "Content",
  tags: [],
  createdAt: new Date("2026-08-15T00:00:00.000Z"),
  hasAttachments: false,
};

export const MOCK_STORAGE_FAILURE: CoreError = {
  code: "storage-failed",
  message: "Storage failed",
};

// Builds a complete storage double so tests can override only the behavior they care about.
export function createMockCoreStorage(
  overrides: Partial<CoreStorage> = {},
): CoreStorage {
  return {
    addRecord: async (): Promise<Result<StoredRecord, CoreError>> => ({
      ok: true,
      value: MOCK_STORED_RECORD,
    }),
    updateRecord: async (): Promise<Result<StoredRecord, CoreError>> => ({
      ok: true,
      value: MOCK_STORED_RECORD,
    }),
    removeRecord: async (): Promise<Result<void, CoreError>> => ({
      ok: true,
      value: undefined,
    }),
    getRecords: async (): Promise<Result<StoredRecord[], CoreError>> => ({
      ok: true,
      value: [MOCK_STORED_RECORD],
    }),
    findRecords: async (): Promise<
      Result<StoredRecordHeader[], CoreError>
    > => ({
      ok: true,
      value: [MOCK_STORED_RECORD_HEADER],
    }),
    ...overrides,
  };
}
