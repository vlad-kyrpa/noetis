import type { Logger } from "./logger";
import type {
  CoreError,
  CoreStorage,
  CreateNotePayload,
  CreateStoredQueryContainerPayload,
  CreateStoredQueryPayload,
  FileSystemAdapter,
  Query,
  RemoveStoredQueryContainerPayload,
  RemoveStoredQueryPayload,
  Result,
  StoredQueryContainer,
  StoredQueryId,
  StoredQueryItem,
  StoredRecord,
  StoredRecordHeader,
  UpdateStoredQueryContainerPayload,
  UpdateStoredQueryPayload,
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
const STORED_QUERIES_FILE_PATH = "stored-queries.json";
const DEFAULT_STORED_QUERY_CONTAINER_NAME = "Stored Queries";
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

// Finds the target container or falls back to the default container.
function findStoredQueryContainer(params: {
  containers: StoredQueryContainer[];
  containerId?: StoredQueryId;
}): StoredQueryContainer | undefined {
  if (params.containerId === undefined) {
    return params.containers[0];
  }

  return params.containers.find(
    (container) => container.id === params.containerId,
  );
}

// Creates the default stored-query container with a storage-owned id.
function createDefaultStoredQueryContainer(): StoredQueryContainer {
  return {
    id: uuid(),
    name: DEFAULT_STORED_QUERY_CONTAINER_NAME,
    queries: [],
  };
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

  // Reads stored query containers or creates the default container in memory.
  private async getStoredQueryContainers(): Promise<StoredQueryContainer[]> {
    const path = await this.getStoredQueryIndexPath();

    if (await this.fileSystem.isExists(path)) {
      const containers = JSON.parse(
        await this.fileSystem.getFileContent(path),
      ) as StoredQueryContainer[];

      return containers.length === 0
        ? [createDefaultStoredQueryContainer()]
        : containers;
    }

    return [createDefaultStoredQueryContainer()];
  }

  // Writes all stored query containers to the single JSON file.
  private async writeStoredQueryContainers(
    containers: StoredQueryContainer[],
  ): Promise<void> {
    const path = await this.getStoredQueryIndexPath();
    await this.fileSystem.writeFileContent(
      path,
      JSON.stringify(containers, null, 2),
    );
  }

  // Reads stored query containers and persists the default container when absent.
  async getStoredQueries(): Promise<
    Result<StoredQueryContainer[], CoreError>
  > {
    const containers = await this.getStoredQueryContainers();
    const path = await this.getStoredQueryIndexPath();

    if (!(await this.fileSystem.isExists(path))) {
      await this.writeStoredQueryContainers(containers);
    }

    if (containers.length === 1 && containers[0]?.queries.length === 0) {
      const content = await this.fileSystem.getFileContent(path);

      if (content.trim() === "[]") {
        await this.writeStoredQueryContainers(containers);
      }
    }

    return { ok: true, value: containers };
  }

  // Creates a query item inside an existing or default stored-query container.
  async createStoredQuery(
    payload: CreateStoredQueryPayload,
  ): Promise<Result<StoredQueryItem, CoreError>> {
    const containers = await this.getStoredQueryContainers();
    const container = findStoredQueryContainer({
      containers,
      ...(payload.containerId === undefined
        ? {}
        : { containerId: payload.containerId }),
    });

    if (container === undefined) {
      return createRecordNotFoundError(payload.containerId ?? "");
    }

    const item: StoredQueryItem = {
      id: uuid(),
      name: payload.query.name.trim(),
      query: {
        tags: normalizeTags(payload.query.query.tags),
      },
    };
    const nextContainers = containers.map((storedContainer) =>
      storedContainer.id === container.id
        ? {
            ...storedContainer,
            queries: [...storedContainer.queries, item],
          }
        : storedContainer,
    );

    await this.writeStoredQueryContainers(nextContainers);

    return { ok: true, value: item };
  }

  // Creates a new empty query container in the stored-query file.
  async createStoredQueryContainer(
    payload: CreateStoredQueryContainerPayload,
  ): Promise<Result<StoredQueryContainer, CoreError>> {
    const containers = await this.getStoredQueryContainers();
    const container: StoredQueryContainer = {
      id: uuid(),
      name: payload.container.name.trim(),
      queries: [],
    };

    await this.writeStoredQueryContainers([...containers, container]);

    return { ok: true, value: container };
  }

  // Updates a query container while preserving its existing queries.
  async updateStoredQueryContainer(
    payload: UpdateStoredQueryContainerPayload,
  ): Promise<Result<StoredQueryContainer, CoreError>> {
    const containers = await this.getStoredQueryContainers();
    const existingContainer = containers.find(
      (container) => container.id === payload.id,
    );

    if (existingContainer === undefined) {
      return createRecordNotFoundError(payload.id);
    }

    const container: StoredQueryContainer = {
      ...existingContainer,
      name: payload.container.name.trim(),
    };

    await this.writeStoredQueryContainers(
      containers.map((storedContainer) =>
        storedContainer.id === payload.id ? container : storedContainer,
      ),
    );

    return { ok: true, value: container };
  }

  // Removes a query container and the queries it owns.
  async removeStoredQueryContainer(
    payload: RemoveStoredQueryContainerPayload,
  ): Promise<Result<void, CoreError>> {
    const containers = await this.getStoredQueryContainers();
    const existingContainer = containers.find(
      (container) => container.id === payload.id,
    );

    if (existingContainer === undefined) {
      return createRecordNotFoundError(payload.id);
    }

    await this.writeStoredQueryContainers(
      containers.filter((container) => container.id !== payload.id),
    );

    return { ok: true, value: undefined };
  }

  // Updates a query item while keeping it inside its current container.
  async updateStoredQuery(
    payload: UpdateStoredQueryPayload,
  ): Promise<Result<StoredQueryItem, CoreError>> {
    const containers = await this.getStoredQueryContainers();
    const container = containers.find((storedContainer) =>
      storedContainer.queries.some((query) => query.id === payload.id),
    );

    if (container === undefined) {
      return createRecordNotFoundError(payload.id);
    }

    const item: StoredQueryItem = {
      id: payload.id,
      name: payload.query.name.trim(),
      query: {
        tags: normalizeTags(payload.query.query.tags),
      },
    };
    const nextContainers = containers.map((storedContainer) =>
      storedContainer.id === container.id
        ? {
            ...storedContainer,
            queries: storedContainer.queries.map((query) =>
              query.id === payload.id ? item : query,
            ),
          }
        : storedContainer,
    );

    await this.writeStoredQueryContainers(nextContainers);

    return { ok: true, value: item };
  }

  // Removes a query item from whichever container owns it.
  async removeStoredQuery(
    payload: RemoveStoredQueryPayload,
  ): Promise<Result<void, CoreError>> {
    const containers = await this.getStoredQueryContainers();
    const container = containers.find((storedContainer) =>
      storedContainer.queries.some((query) => query.id === payload.id),
    );

    if (container === undefined) {
      return createRecordNotFoundError(payload.id);
    }

    await this.writeStoredQueryContainers(
      containers.map((storedContainer) =>
        storedContainer.id === container.id
          ? {
              ...storedContainer,
              queries: storedContainer.queries.filter(
                (query) => query.id !== payload.id,
              ),
            }
          : storedContainer,
      ),
    );

    return { ok: true, value: undefined };
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

    const path = await this.fileSystem.combinePaths([
      await this.getRecordsDirectoryPath(),
      serialized.value.name,
    ]);

    await this.ensureDirectoryExists(
      await this.fileSystem.getDirectoryName(path),
    );
    await this.fileSystem.writeFileContent(path, serialized.value.content);
    await this.saveRecordToIndex(record);
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

    const existingRecord = await this.readStoredRecord(params.id);

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

    const path = await this.getRecordPath(record.id);
    await this.ensureDirectoryExists(
      await this.fileSystem.getDirectoryName(path),
    );
    await this.fileSystem.writeFileContent(path, serialized.value.content);
    await this.saveRecordToIndex(record);
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

    const path = await this.getRecordPath(id);
    const fileExists =
      (await this.fileSystem.isExists(path)) &&
      (await this.fileSystem.isFile(path));

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

    await this.fileSystem.removeFile(path);
    await this.removeRecordFromIndex(id);
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

    const results = await Promise.all(
      ids.map((id) => this.readStoredRecord(id)),
    );
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

    const recordsDirectoryPath = await this.getRecordsDirectoryPath();

    if (!(await this.fileSystem.isExists(recordsDirectoryPath))) {
      this.logger.info({
        message: "FileStorage.findRecords succeeded.",
        data: { count: 0 },
      });
      return { ok: true, value: [] };
    }

    const indexItems = await this.readRecordIndexOrCreate();
    const recordResults = await Promise.all(
      indexItems
        .filter((item) => matchesIndexQuery(item, query))
        .map((item) => this.readStoredRecord(item.id)),
    );
    const records = recordResults
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
  private async readStoredRecord(
    id: string,
  ): Promise<Result<StoredRecord, CoreError>> {
    return this.readStoredRecordFromPath({
      id,
      path: await this.getRecordPath(id),
    });
  }

  // Reads one stored markdown file from a known path.
  private async readStoredRecordFromPath(params: {
    id: string;
    path: string;
  }): Promise<Result<StoredRecord, CoreError>> {
    const fileExists =
      (await this.fileSystem.isExists(params.path)) &&
      (await this.fileSystem.isFile(params.path));

    if (!fileExists) {
      return createRecordNotFoundError(params.id);
    }

    return parseStoredRecord({
      id: params.id,
      content: await this.fileSystem.getFileContent(params.path),
    });
  }

  // Resolves the storage path for a record id.
  private async getRecordPath(id: string): Promise<string> {
    return this.fileSystem.combinePaths([
      await this.getRecordsDirectoryPath(),
      `${id}${MARKDOWN_EXTENSION}`,
    ]);
  }

  // Resolves the directory where records are stored.
  private async getRecordsDirectoryPath(): Promise<string> {
    return this.fileSystem.combinePaths([
      await this.fileSystem.getRootDirectory(),
      RECORDS_DIRECTORY_NAME,
    ]);
  }

  // Reads the lightweight record search index from storage.
  private async readRecordIndex(): Promise<StoredRecordIndexItem[]> {
    const path = await this.getRecordIndexPath();

    if (
      !(await this.fileSystem.isExists(path)) ||
      !(await this.fileSystem.isFile(path))
    ) {
      return [];
    }

    return parseRecordIndex(await this.fileSystem.getFileContent(path));
  }

  // Builds the index from existing records when the index file is missing.
  private async readRecordIndexOrCreate(): Promise<StoredRecordIndexItem[]> {
    const path = await this.getRecordIndexPath();

    if (
      (await this.fileSystem.isExists(path)) &&
      (await this.fileSystem.isFile(path))
    ) {
      return this.readRecordIndex();
    }

    const recordPaths = await this.fileSystem.getDirectoryContent(
      await this.getRecordsDirectoryPath(),
    );
    const recordFilePaths: string[] = [];

    for (const recordPath of recordPaths) {
      if (
        (await this.fileSystem.isFile(recordPath)) &&
        recordPath.endsWith(MARKDOWN_EXTENSION)
      ) {
        recordFilePaths.push(recordPath);
      }
    }

    const recordResults = await Promise.all(
      recordFilePaths.map((recordPath) =>
        this.readStoredRecordFromPath({
          id: getRecordIdFromRecordPath({
            path: recordPath,
            extension: MARKDOWN_EXTENSION,
          }),
          path: recordPath,
        }),
      ),
    );
    const indexItems = recordResults
      .filter(
        (
          result: Result<StoredRecord, CoreError>,
        ): result is { ok: true; value: StoredRecord } => result.ok,
      )
      .map((result) => createRecordIndexItem(result.value));

    await this.writeRecordIndex(indexItems);

    return indexItems;
  }

  // Writes the lightweight record search index to storage.
  private async writeRecordIndex(
    indexItems: StoredRecordIndexItem[],
  ): Promise<void> {
    const path = await this.getRecordIndexPath();
    await this.ensureDirectoryExists(
      await this.fileSystem.getDirectoryName(path),
    );
    await this.fileSystem.writeFileContent(
      path,
      JSON.stringify(indexItems, null, 2),
    );
  }

  // Saves or replaces one record entry in the search index.
  private async saveRecordToIndex(record: StoredRecord): Promise<void> {
    const indexItems = await this.readRecordIndex();
    const nextIndexItems = upsertRecordIndexItem({
      indexItems,
      record,
    });

    await this.writeRecordIndex(nextIndexItems);
  }

  // Removes one record entry from the search index.
  private async removeRecordFromIndex(id: string): Promise<void> {
    const indexItems = await this.readRecordIndex();
    const nextIndexItems = removeRecordIndexItem({
      indexItems,
      id,
    });

    await this.writeRecordIndex(nextIndexItems);
  }

  // Resolves the storage path for the record search index.
  private async getRecordIndexPath(): Promise<string> {
    return this.fileSystem.combinePaths([
      await this.fileSystem.getRootDirectory(),
      INDEX_FILE_NAME,
    ]);
  }

  // Resolves the storage path for the flat stored query index.
  private async getStoredQueryIndexPath(): Promise<string> {
    return this.fileSystem.combinePaths([
      await this.fileSystem.getRootDirectory(),
      STORED_QUERIES_FILE_PATH,
    ]);
  }

  private async ensureDirectoryExists(path: string): Promise<void> {
    if (!(await this.fileSystem.isExists(path))) {
      await this.fileSystem.createDirectory(path);
    }
  }
}
