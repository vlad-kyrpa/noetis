import type { Logger } from "./logger";
import type {
  CoreError,
  CoreStorage,
  CreateNotePayload,
  FileSystemAdapter,
  Query,
  Result,
  StoredRecord,
  StoredRecordHeader,
  UpdateStoredRecordParams,
} from "./types";
import { v4 as uuid } from "uuid";
import { normalizeTags } from "./utils/tag-utils";
import { parseStoredRecord, serializeRecord } from "./utils/record-codec";
import {
  createRecordIndexItem,
  getRecordIdFromRecordPath,
  matchesIndexQuery,
  parseRecordIndex,
  removeRecordIndexItem,
  type StoredRecordIndexItem,
  upsertRecordIndexItem,
} from "./utils/record-index";
import { createRecordNotFoundError } from "./utils/error-factory";

const RECORDS_DIRECTORY_NAME = "records";
const INDEX_FILE_NAME = "index.json";
const MARKDOWN_EXTENSION = ".md";
const SUMMARY_LENGTH = 160;

// Creates a compact read model for find results.
export function createStoredRecordHeader(
  record: StoredRecord,
): StoredRecordHeader {
  return {
    id: record.id,
    title: record.title,
    shortContent: record.content.slice(0, SUMMARY_LENGTH),
    tags: record.tags,
    createdAt: record.createdAt,
    ...(record.updatedAt === undefined ? {} : { updatedAt: record.updatedAt }),
    hasAttachments: record.attachments.length > 0,
  };
}

// Checks simple text and tag filters against a parsed record.
export function matchesQuery(record: StoredRecord, query: Query): boolean {
  const queryText = query.text.trim().toLocaleLowerCase();
  const recordText = `${record.title}\n${record.content}`.toLocaleLowerCase();
  const matchesText = queryText.length === 0 || recordText.includes(queryText);
  const matchesTags =
    query.tags.length === 0 ||
    query.tags.every((tag) => record.tags.includes(tag));

  return matchesText && matchesTags;
}

type FileStorageParams = {
  fileSystem: FileSystemAdapter;
  logger: Logger;
};

// Persists note records as markdown files with frontmatter metadata at the top.
export class FileStorage implements CoreStorage {
  private readonly fileSystem: FileSystemAdapter;
  private readonly logger: Logger;

  // Stores filesystem access behind an adapter so the storage boundary stays testable.
  constructor(params: FileStorageParams) {
    this.fileSystem = params.fileSystem;
    this.logger = params.logger;
  }

  // Creates a markdown note and generates a relative note id from the title.
  async addRecord(
    payload: CreateNotePayload,
  ): Promise<Result<StoredRecord, CoreError>> {
    this.logger.info({
      message: "FileStorage.addRecord started.",
      data: {
        title: payload.title,
        tagCount: payload.tags.length,
      },
    });

    const record: StoredRecord = {
      id: uuid(),
      title: payload.title.trim(),
      content: payload.content,
      tags: normalizeTags(payload.tags),
      attachments: [],
      createdAt: payload.createdAt,
    };

    const serialized = serializeRecord(record);

    if (!serialized.ok) {
      this.logger.error({
        message: "FileStorage.addRecord failed.",
        data: {
          id: record.id,
          errorCode: serialized.error.code,
          errorMessage: serialized.error.message,
        },
      });
      return serialized;
    }

    const path = this.fileSystem.combinePaths([
      this.getRecordsDirectoryPath(),
      serialized.value.name,
    ]);

    this.fileSystem.writeFileContent(path, serialized.value.content);
    this.saveRecordToIndex(record);
    this.logger.info({
      message: "FileStorage.addRecord succeeded.",
      data: { id: record.id, path },
    });

    return { ok: true, value: record };
  }

  // Updates a markdown note while preserving storage-owned fields.
  async updateRecord(
    params: UpdateStoredRecordParams,
  ): Promise<Result<StoredRecord, CoreError>> {
    this.logger.info({
      message: "FileStorage.updateRecord started.",
      data: { id: params.id },
    });

    const existingRecord = this.readStoredRecord(params.id);

    if (!existingRecord.ok) {
      this.logger.error({
        message: "FileStorage.updateRecord failed.",
        data: {
          id: params.id,
          errorCode: existingRecord.error.code,
          errorMessage: existingRecord.error.message,
        },
      });
      return existingRecord;
    }

    const record: StoredRecord = {
      ...existingRecord.value,
      title: params.payload.title.trim(),
      content: params.payload.content,
      tags: normalizeTags(params.payload.tags),
      updatedAt: params.payload.updatedAt,
    };
    const serialized = serializeRecord(record);

    if (!serialized.ok) {
      this.logger.error({
        message: "FileStorage.updateRecord failed.",
        data: {
          id: record.id,
          errorCode: serialized.error.code,
          errorMessage: serialized.error.message,
        },
      });
      return serialized;
    }

    this.fileSystem.writeFileContent(
      this.getRecordPath(record.id),
      serialized.value.content,
    );
    this.saveRecordToIndex(record);
    this.logger.info({
      message: "FileStorage.updateRecord succeeded.",
      data: { id: record.id },
    });

    return { ok: true, value: record };
  }

  // Removes a stored markdown file by record id.
  async removeRecord(id: string): Promise<Result<void, CoreError>> {
    this.logger.info({
      message: "FileStorage.removeRecord started.",
      data: { id },
    });

    const path = this.getRecordPath(id);
    const fileExists =
      this.fileSystem.isExists(path) && this.fileSystem.isFile(path);

    if (!fileExists) {
      const error: CoreError = {
        code: "record-not-found",
        message: `Record "${id}" was not found.`,
      };
      this.logger.error({
        message: "FileStorage.removeRecord failed.",
        data: {
          id,
          path,
          errorCode: error.code,
          errorMessage: error.message,
        },
      });
      return { ok: false, error };
    }

    this.fileSystem.removeFile(path);
    this.removeRecordFromIndex(id);
    this.logger.info({
      message: "FileStorage.removeRecord succeeded.",
      data: { id, path },
    });

    return { ok: true, value: undefined };
  }

  // Reads stored markdown records by id and stops on the first invalid record.
  async getRecords(ids: string[]): Promise<Result<StoredRecord[], CoreError>> {
    this.logger.info({
      message: "FileStorage.getRecords started.",
      data: { count: ids.length },
    });

    const results = ids.map((id) => this.readStoredRecord(id));
    const failure = results.find((result) => !result.ok);

    if (failure !== undefined && !failure.ok) {
      this.logger.error({
        message: "FileStorage.getRecords failed.",
        data: {
          count: ids.length,
          errorCode: failure.error.code,
          errorMessage: failure.error.message,
        },
      });
      return failure;
    }

    const records = results
      .filter(
        (
          result: Result<StoredRecord, CoreError>,
        ): result is { ok: true; value: StoredRecord } => result.ok,
      )
      .map((result) => result.value);

    this.logger.info({
      message: "FileStorage.getRecords succeeded.",
      data: { count: records.length },
    });

    return {
      ok: true,
      value: records,
    };
  }

  // Reads indexed record candidates and filters parsed records by the query.
  async findRecords(
    query: Query,
  ): Promise<Result<StoredRecordHeader[], CoreError>> {
    this.logger.info({
      message: "FileStorage.findRecords started.",
      data: {
        text: query.text,
        tagCount: query.tags.length,
      },
    });

    const recordsDirectoryPath = this.getRecordsDirectoryPath();

    if (!this.fileSystem.isExists(recordsDirectoryPath)) {
      this.logger.info({
        message: "FileStorage.findRecords succeeded.",
        data: { count: 0 },
      });
      return { ok: true, value: [] };
    }

    const indexItems = this.readRecordIndexOrCreate();
    const records = indexItems
      .filter((item) => matchesIndexQuery(item, query))
      .map((item) => this.readStoredRecord(item.id))
      .filter(
        (
          result: Result<StoredRecord, CoreError>,
        ): result is { ok: true; value: StoredRecord } => result.ok,
      )
      .map((result) => result.value);

    const headers = records
      .filter((record) => matchesQuery(record, query))
      .map((record) => createStoredRecordHeader(record));

    this.logger.info({
      message: "FileStorage.findRecords succeeded.",
      data: { count: headers.length },
    });

    return { ok: true, value: headers };
  }

  // Reads one stored markdown file and maps its sections back to a record.
  private readStoredRecord(id: string): Result<StoredRecord, CoreError> {
    return this.readStoredRecordFromPath({
      id,
      path: this.getRecordPath(id),
    });
  }

  // Reads one stored markdown file from a known path.
  private readStoredRecordFromPath(params: {
    id: string;
    path: string;
  }): Result<StoredRecord, CoreError> {
    const fileExists =
      this.fileSystem.isExists(params.path) &&
      this.fileSystem.isFile(params.path);

    if (!fileExists) {
      return createRecordNotFoundError(params.id);
    }

    return parseStoredRecord({
      id: params.id,
      content: this.fileSystem.getFileContent(params.path),
    });
  }

  // Resolves the storage path for a record id.
  private getRecordPath(id: string): string {
    return this.fileSystem.combinePaths([
      this.getRecordsDirectoryPath(),
      `${id}${MARKDOWN_EXTENSION}`,
    ]);
  }

  // Resolves the directory where records are stored.
  private getRecordsDirectoryPath(): string {
    return this.fileSystem.combinePaths([
      this.fileSystem.getRootDirectory(),
      RECORDS_DIRECTORY_NAME,
    ]);
  }

  // Reads the lightweight record search index from storage.
  private readRecordIndex(): StoredRecordIndexItem[] {
    const path = this.getRecordIndexPath();

    if (!this.fileSystem.isExists(path) || !this.fileSystem.isFile(path)) {
      return [];
    }

    return parseRecordIndex(this.fileSystem.getFileContent(path));
  }

  // Builds the index from existing records when the index file is missing.
  private readRecordIndexOrCreate(): StoredRecordIndexItem[] {
    const path = this.getRecordIndexPath();

    if (this.fileSystem.isExists(path) && this.fileSystem.isFile(path)) {
      return this.readRecordIndex();
    }

    const indexItems = this.fileSystem
      .getDirectoryContent(this.getRecordsDirectoryPath())
      .filter((recordPath) => this.fileSystem.isFile(recordPath))
      .filter((recordPath) => recordPath.endsWith(MARKDOWN_EXTENSION))
      .map((recordPath) =>
        this.readStoredRecordFromPath({
          id: getRecordIdFromRecordPath({
            path: recordPath,
            extension: MARKDOWN_EXTENSION,
          }),
          path: recordPath,
        }),
      )
      .filter(
        (
          result: Result<StoredRecord, CoreError>,
        ): result is { ok: true; value: StoredRecord } => result.ok,
      )
      .map((result) => createRecordIndexItem(result.value));

    this.writeRecordIndex(indexItems);

    return indexItems;
  }

  // Writes the lightweight record search index to storage.
  private writeRecordIndex(indexItems: StoredRecordIndexItem[]): void {
    this.fileSystem.writeFileContent(
      this.getRecordIndexPath(),
      JSON.stringify(indexItems, null, 2),
    );
  }

  // Saves or replaces one record entry in the search index.
  private saveRecordToIndex(record: StoredRecord): void {
    const indexItems = this.readRecordIndex();
    const nextIndexItems = upsertRecordIndexItem({
      indexItems,
      record,
    });

    this.writeRecordIndex(nextIndexItems);
  }

  // Removes one record entry from the search index.
  private removeRecordFromIndex(id: string): void {
    const indexItems = this.readRecordIndex();
    const nextIndexItems = removeRecordIndexItem({
      indexItems,
      id,
    });

    this.writeRecordIndex(nextIndexItems);
  }

  // Resolves the storage path for the record search index.
  private getRecordIndexPath(): string {
    return this.fileSystem.combinePaths([
      this.fileSystem.getRootDirectory(),
      INDEX_FILE_NAME,
    ]);
  }
}
