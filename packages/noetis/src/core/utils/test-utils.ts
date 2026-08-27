import type {
  CoreError,
  CoreStorage,
  FileSystemAdapter,
  Result,
  StoredRecord,
  StoredRecordHeader,
  StoredQueryContainer,
  StoredQueryItem,
} from "../types";
import type { Logger } from "../logger";

export const MOCK_ROOT_PATH: string = "/notes";

type LogEntry = {
  message: string;
  data: Record<string, unknown>;
};

// Provides a deterministic filesystem boundary for file storage behavior tests.
export class InMemoryFileSystemAdapter implements FileSystemAdapter {
  private readonly files: Map<string, string>;
  private readonly directories: Set<string>;

  // Seeds the root directory plus any requested files.
  constructor(files: Record<string, string> = {}) {
    this.files = new Map(
      Object.entries(files).map(([path, content]) => [
        this.normalize(path),
        content,
      ]),
    );
    this.directories = new Set([MOCK_ROOT_PATH, `${MOCK_ROOT_PATH}/records`]);
  }

  // Checks whether a path exists as either a file or directory.
  async isExists(path: string): Promise<boolean> {
    const normalizedPath = this.normalize(path);
    return (
      this.files.has(normalizedPath) || this.directories.has(normalizedPath)
    );
  }

  // Checks whether a path points to a seeded or written file.
  async isFile(path: string): Promise<boolean> {
    return this.files.has(this.normalize(path));
  }

  // Checks whether a path points to a known directory.
  async isDirectory(path: string): Promise<boolean> {
    return this.directories.has(this.normalize(path));
  }

  // Lists direct children for storage scans.
  async getDirectoryContent(directoryPath: string): Promise<readonly string[]> {
    const normalizedDirectoryPath = this.normalize(directoryPath);
    const childPrefix = `${normalizedDirectoryPath}/`;
    const paths = [
      ...Array.from(this.directories),
      ...Array.from(this.files.keys()),
    ];

    return paths.filter((path) => {
      const isChild = path.startsWith(childPrefix);
      const childPath = path.slice(childPrefix.length);
      return isChild && childPath.length > 0 && !childPath.includes("/");
    });
  }

  // Reads file content by normalized path.
  async getFileContent(path: string): Promise<string> {
    return this.files.get(this.normalize(path)) ?? "";
  }

  // Writes file content by normalized path.
  async writeFileContent(path: string, content: string): Promise<void> {
    this.files.set(this.normalize(path), content);
  }

  // Removes a file by normalized path.
  async removeFile(path: string): Promise<void> {
    this.files.delete(this.normalize(path));
  }

  // Creates a directory path and its missing parents.
  async createDirectory(path: string): Promise<void> {
    const normalizedPath = this.normalize(path);
    const parts = normalizedPath.split("/").filter((part) => part.length > 0);
    let currentPath = normalizedPath.startsWith("/") ? "/" : "";

    parts.forEach((part) => {
      currentPath = this.normalize(`${currentPath}/${part}`);
      this.directories.add(currentPath);
    });
  }

  // Returns the configured root directory.
  async getRootDirectory(): Promise<string> {
    return MOCK_ROOT_PATH;
  }

  // Converts an absolute path to a path relative to the root directory.
  async getRelativePath(path: string): Promise<string> {
    return this.normalize(path).slice(MOCK_ROOT_PATH.length + 1);
  }

  // Returns the parent directory for a file path.
  async getDirectoryName(path: string): Promise<string> {
    const normalizedPath = this.normalize(path);
    return normalizedPath.slice(0, normalizedPath.lastIndexOf("/"));
  }

  // Combines path segments with slash normalization.
  async combinePaths(parts: readonly string[]): Promise<string> {
    return this.normalize(parts.join("/"));
  }

  // Normalizes Windows and repeated separators for deterministic assertions.
  private normalize(path: string): string {
    return path.replace(/\\/g, "/").replace(/\/+/g, "/");
  }
}

// Captures storage logs without writing to the real console.
export class TestLogger implements Logger {
  readonly infoEntries: LogEntry[] = [];
  readonly errorEntries: LogEntry[] = [];
  readonly warnEntries: LogEntry[] = [];
  readonly debugEntries: LogEntry[] = [];

  // Captures info-level storage logs.
  info(entry: LogEntry): void {
    this.infoEntries.push(entry);
  }

  // Captures error-level storage logs.
  error(entry: LogEntry): void {
    this.errorEntries.push(entry);
  }

  // Captures warning-level storage logs.
  warn(entry: LogEntry): void {
    this.warnEntries.push(entry);
  }

  // Captures debug-level storage logs.
  debug(entry: LogEntry): void {
    this.debugEntries.push(entry);
  }
}

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

export const MOCK_STORED_QUERY_ITEM: StoredQueryItem = {
  id: "stored-query-1",
  name: "Daily",
  query: { tags: ["daily"] },
};

export const MOCK_STORED_QUERY_CONTAINER: StoredQueryContainer = {
  id: "stored-query-container-1",
  name: "Stored Queries",
  queries: [],
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
    createStoredQuery: async (): Promise<
      Result<StoredQueryItem, CoreError>
    > => ({
      ok: true,
      value: MOCK_STORED_QUERY_ITEM,
    }),
    createStoredQueryContainer: async (): Promise<
      Result<StoredQueryContainer, CoreError>
    > => ({
      ok: true,
      value: MOCK_STORED_QUERY_CONTAINER,
    }),
    updateStoredQueryContainer: async (): Promise<
      Result<StoredQueryContainer, CoreError>
    > => ({
      ok: true,
      value: MOCK_STORED_QUERY_CONTAINER,
    }),
    removeStoredQueryContainer: async (): Promise<Result<void, CoreError>> => ({
      ok: true,
      value: undefined,
    }),
    updateStoredQuery: async (): Promise<
      Result<StoredQueryItem, CoreError>
    > => ({
      ok: true,
      value: MOCK_STORED_QUERY_ITEM,
    }),
    removeStoredQuery: async (): Promise<Result<void, CoreError>> => ({
      ok: true,
      value: undefined,
    }),
    ...overrides,
  };
}
