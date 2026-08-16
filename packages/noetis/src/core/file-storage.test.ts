import { describe, expect, it } from "vitest";
import { FileStorage } from "./file-storage";
import type {
  CoreError,
  CreateNotePayload,
  FileSystemAdapter,
  Result,
  StoredRecord,
  StoredRecordHeader,
} from "./types";
import type { Logger } from "./logger";

const ROOT_PATH = "/notes";
const CREATED_AT = new Date("2026-08-15T00:00:00.000Z");
const UPDATED_AT = new Date("2026-08-15T01:00:00.000Z");
const CONTENT_SEPARATOR = "\n---\n";

type LogEntry = {
  message: string;
  data: Record<string, unknown>;
};

// Provides a deterministic filesystem boundary for file storage behavior tests.
class InMemoryFileSystemAdapter implements FileSystemAdapter {
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
    this.directories = new Set([ROOT_PATH, `${ROOT_PATH}/records`]);
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
    return ROOT_PATH;
  }

  // Converts an absolute path to a path relative to the root directory.
  async getRelativePath(path: string): Promise<string> {
    return this.normalize(path).slice(ROOT_PATH.length + 1);
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
class TestLogger implements Logger {
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

  warn(entry: LogEntry): void {
    this.warnEntries.push(entry);
  }

  debug(entry: LogEntry): void {
    this.debugEntries.push(entry);
  }
}

// Builds the storage under test with a typed in-memory filesystem.
function createStorage(files: Record<string, string> = {}): {
  storage: FileStorage;
  fileSystem: InMemoryFileSystemAdapter;
  logger: TestLogger;
} {
  const fileSystem = new InMemoryFileSystemAdapter(files);
  const logger = new TestLogger();
  return {
    storage: new FileStorage({ fileSystem, logger }),
    fileSystem,
    logger,
  };
}

// Builds a valid create payload for storage tests.
function createNotePayload(
  payload: Partial<CreateNotePayload> = {},
): CreateNotePayload {
  return {
    title: "Hello World",
    content: "Body",
    tags: ["daily"],
    createdAt: CREATED_AT,
    ...payload,
  };
}

// Builds stored markdown content using the file storage section format.
function createStoredRecordContent(params: {
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt?: Date;
}): string {
  return [
    params.title,
    params.content,
    `tags: ${params.tags.map((tag) => `#${tag}`).join(" ")}`,
    `createdAt: ${params.createdAt.toISOString()}`,
    params.updatedAt === undefined
      ? "updatedAt:"
      : `updatedAt: ${params.updatedAt.toISOString()}`,
  ].join(CONTENT_SEPARATOR);
}

// Reads the generated index file as plain JSON for assertions.
async function readIndex(
  fileSystem: InMemoryFileSystemAdapter,
): Promise<unknown> {
  return JSON.parse(await fileSystem.getFileContent(`${ROOT_PATH}/index.json`));
}

describe("FileStorage", () => {
  describe("addRecord", () => {
    it("writes a markdown record and adds it to the index", async () => {
      const { storage, fileSystem, logger } = createStorage();

      const result = await storage.addRecord(
        createNotePayload({
          title: "  Hello World  ",
          tags: ["daily notes", "project"],
        }),
      );

      expect(result).toEqual({
        ok: true,
        value: expect.objectContaining({
          title: "Hello World",
          tags: ["daily", "notes", "project"],
        }),
      });

      if (!result.ok) {
        throw new Error("Expected addRecord to succeed.");
      }

      expect(
        await fileSystem.getFileContent(
          `${ROOT_PATH}/records/${result.value.id}.md`,
        ),
      ).toContain("Hello World");
      expect(await readIndex(fileSystem)).toEqual([
        {
          id: result.value.id,
          title: "Hello World",
          tags: ["daily", "notes", "project"],
        },
      ]);
      expect(logger.infoEntries.map((entry) => entry.message)).toEqual([
        "FileStorage.addRecord started.",
        "FileStorage.addRecord succeeded.",
      ]);
    });

    it("returns a validation error when content contains the section separator", async () => {
      const { storage, logger } = createStorage();

      const result = await storage.addRecord(
        createNotePayload({
          content: `Before${CONTENT_SEPARATOR}After`,
        }),
      );

      expect(result).toEqual({
        ok: false,
        error: {
          code: "validation-failed",
          message: 'content cannot include the content separator "---".',
        },
      });
      expect(logger.errorEntries).toEqual([
        expect.objectContaining({
          message: "FileStorage.addRecord failed.",
        }),
      ]);
    });
  });

  describe("updateRecord", () => {
    it("updates a stored record and replaces its index entry", async () => {
      const { storage, fileSystem } = createStorage({
        [`${ROOT_PATH}/records/note-1.md`]: createStoredRecordContent({
          title: "Old title",
          content: "Old body",
          tags: ["old"],
          createdAt: CREATED_AT,
        }),
        [`${ROOT_PATH}/index.json`]: JSON.stringify([
          { id: "note-1", title: "Old title", tags: ["old"] },
        ]),
      });

      const result = await storage.updateRecord({
        id: "note-1",
        payload: {
          id: "note-1",
          title: "Updated title",
          content: "Updated body",
          tags: ["daily"],
          updatedAt: UPDATED_AT,
        },
      });

      expect(result).toEqual({
        ok: true,
        value: expect.objectContaining({
          id: "note-1",
          title: "Updated title",
          content: "Updated body",
          tags: ["daily"],
          createdAt: CREATED_AT,
          updatedAt: UPDATED_AT,
        }),
      });
      expect(
        await fileSystem.getFileContent(`${ROOT_PATH}/records/note-1.md`),
      ).toContain(`updatedAt: ${UPDATED_AT.toISOString()}`);
      expect(await readIndex(fileSystem)).toEqual([
        { id: "note-1", title: "Updated title", tags: ["daily"] },
      ]);
    });

    it("returns not found when the record file does not exist", async () => {
      const { storage, logger } = createStorage();

      const result = await storage.updateRecord({
        id: "missing",
        payload: {
          id: "missing",
          title: "Missing",
          content: "Body",
          tags: [],
          updatedAt: UPDATED_AT,
        },
      });

      expect(result).toEqual({
        ok: false,
        error: {
          code: "record-not-found",
          message: 'Record "missing" was not found.',
        },
      });
      expect(logger.errorEntries).toEqual([
        expect.objectContaining({
          message: "FileStorage.updateRecord failed.",
        }),
      ]);
    });
  });

  describe("removeRecord", () => {
    it("removes a stored record and its index entry", async () => {
      const { storage, fileSystem } = createStorage({
        [`${ROOT_PATH}/records/note-1.md`]: createStoredRecordContent({
          title: "First",
          content: "Body",
          tags: ["daily"],
          createdAt: CREATED_AT,
        }),
        [`${ROOT_PATH}/index.json`]: JSON.stringify([
          { id: "note-1", title: "First", tags: ["daily"] },
          { id: "note-2", title: "Second", tags: ["project"] },
        ]),
      });

      const result = await storage.removeRecord("note-1");

      expect(result).toEqual({ ok: true, value: undefined });
      expect(await fileSystem.isExists(`${ROOT_PATH}/records/note-1.md`)).toBe(
        false,
      );
      expect(await readIndex(fileSystem)).toEqual([
        { id: "note-2", title: "Second", tags: ["project"] },
      ]);
    });
  });

  describe("getRecords", () => {
    it("reads stored records by id", async () => {
      const { storage } = createStorage({
        [`${ROOT_PATH}/records/note-1.md`]: createStoredRecordContent({
          title: "First",
          content: "Body",
          tags: ["daily"],
          createdAt: CREATED_AT,
        }),
      });

      const result: Result<StoredRecord[], CoreError> =
        await storage.getRecords(["note-1"]);

      expect(result).toEqual({
        ok: true,
        value: [
          expect.objectContaining({
            id: "note-1",
            title: "First",
            content: "Body",
            tags: ["daily"],
            createdAt: CREATED_AT,
          }),
        ],
      });
    });
  });

  describe("findRecords", () => {
    it("uses the index to find matching record headers", async () => {
      const { storage } = createStorage({
        [`${ROOT_PATH}/records/note-1.md`]: createStoredRecordContent({
          title: "Coffee",
          content: "Daily roast notes",
          tags: ["daily"],
          createdAt: CREATED_AT,
        }),
        [`${ROOT_PATH}/records/note-2.md`]: createStoredRecordContent({
          title: "Roadmap",
          content: "Project plan",
          tags: ["project"],
          createdAt: CREATED_AT,
        }),
        [`${ROOT_PATH}/index.json`]: JSON.stringify([
          { id: "note-1", title: "Coffee", tags: ["daily"] },
          { id: "note-2", title: "Roadmap", tags: ["project"] },
        ]),
      });

      const result: Result<StoredRecordHeader[], CoreError> =
        await storage.findRecords({
          text: "roast",
          tags: ["daily"],
        });

      expect(result).toEqual({
        ok: true,
        value: [
          expect.objectContaining({
            id: "note-1",
            title: "Coffee",
            shortContent: "Daily roast notes",
            tags: ["daily"],
          }),
        ],
      });
    });

    it("creates the index from existing records when it is missing", async () => {
      const { storage, fileSystem } = createStorage({
        [`${ROOT_PATH}/records/note-1.md`]: createStoredRecordContent({
          title: "Coffee",
          content: "Daily roast notes",
          tags: ["daily"],
          createdAt: CREATED_AT,
        }),
      });

      const result = await storage.findRecords({
        text: "coffee",
        tags: [],
      });

      expect(result).toEqual({
        ok: true,
        value: [
          expect.objectContaining({
            id: "note-1",
            title: "Coffee",
          }),
        ],
      });
      expect(await readIndex(fileSystem)).toEqual([
        { id: "note-1", title: "Coffee", tags: ["daily"] },
      ]);
    });
  });
});
