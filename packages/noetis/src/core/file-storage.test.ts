import { describe, expect, it } from "vitest";
import { FileStorage } from "./file-storage";
import type {
  CoreError,
  CreateNotePayload,
  Result,
  StoredRecord,
  StoredRecordHeader,
} from "./types";
import {
  InMemoryFileSystemAdapter,
  MOCK_ROOT_PATH,
  TestLogger,
} from "./utils/test-utils";

const ROOT_PATH = MOCK_ROOT_PATH;
const CREATED_AT = new Date("2026-08-15T00:00:00.000Z");
const UPDATED_AT = new Date("2026-08-15T01:00:00.000Z");
const CONTENT_SEPARATOR = "\n---\n";

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

// Reads stored query containers from the single JSON file.
async function readStoredQueryContainers(
  fileSystem: InMemoryFileSystemAdapter,
): Promise<unknown> {
  return JSON.parse(
    await fileSystem.getFileContent(`${ROOT_PATH}/stored-queries.json`),
  );
}

describe("FileStorage", () => {
  describe("addRecord", () => {
    it("keeps existing file records in the generated index before adding", async () => {
      const { storage, fileSystem } = createStorage({
        [`${ROOT_PATH}/records/note-1.md`]: createStoredRecordContent({
          title: "Existing",
          content: "Body",
          tags: ["archive"],
          createdAt: CREATED_AT,
        }),
      });

      const result = await storage.addRecord(
        createNotePayload({
          title: "New",
          tags: ["daily"],
        }),
      );

      if (!result.ok) {
        throw new Error("Expected addRecord to succeed.");
      }

      expect(await readIndex(fileSystem)).toEqual([
        { id: "note-1", title: "Existing", tags: ["archive"] },
        { id: result.value.id, title: "New", tags: ["daily"] },
      ]);
    });

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

  describe("getStoredQueries", () => {
    it("reads stored query containers from the single JSON file", async () => {
      const { storage } = createStorage({
        [`${ROOT_PATH}/stored-queries.json`]: JSON.stringify([
          {
            id: "container-1",
            name: "Stored Queries",
            queries: [
              {
                id: "query-1",
                name: "Daily",
                query: { tags: ["daily"] },
              },
            ],
          },
        ]),
      });

      const result = await storage.getStoredQueries();

      expect(result).toEqual({
        ok: true,
        value: [
          {
            id: "container-1",
            name: "Stored Queries",
            queries: [
              {
                id: "query-1",
                name: "Daily",
                query: { tags: ["daily"] },
              },
            ],
          },
        ],
      });
    });

    it("creates the default container when the file is missing", async () => {
      const { storage, fileSystem } = createStorage();

      const result = await storage.getStoredQueries();

      expect(result).toEqual({
        ok: true,
        value: [
          {
            id: expect.any(String),
            name: "Stored Queries",
            queries: [],
          },
        ],
      });
      expect(await readStoredQueryContainers(fileSystem)).toEqual(
        result.ok ? result.value : undefined,
      );
    });

    it("replaces an empty container file with the default container", async () => {
      const { storage, fileSystem } = createStorage({
        [`${ROOT_PATH}/stored-queries.json`]: JSON.stringify([]),
      });

      const result = await storage.getStoredQueries();

      expect(result).toEqual({
        ok: true,
        value: [
          {
            id: expect.any(String),
            name: "Stored Queries",
            queries: [],
          },
        ],
      });
      expect(await readStoredQueryContainers(fileSystem)).toEqual(
        result.ok ? result.value : undefined,
      );
    });
  });

  describe("createStoredQuery", () => {
    it("creates the default container when the file is missing", async () => {
      const { storage, fileSystem } = createStorage();

      const result = await storage.createStoredQuery({
        query: {
          name: "  Daily  ",
          query: { tags: ["daily notes"] },
        },
      });

      expect(result).toEqual({
        ok: true,
        value: {
          id: expect.any(String),
          name: "Daily",
          query: { tags: ["daily", "notes"] },
        },
      });

      if (!result.ok) {
        throw new Error("Expected createStoredQuery to succeed.");
      }

      expect(await readStoredQueryContainers(fileSystem)).toEqual([
        {
          id: expect.any(String),
          name: "Stored Queries",
          queries: [result.value],
        },
      ]);
    });

    it("adds a query to the requested container", async () => {
      const { storage, fileSystem } = createStorage({
        [`${ROOT_PATH}/stored-queries.json`]: JSON.stringify([
          { id: "container-1", name: "Stored Queries", queries: [] },
          { id: "container-2", name: "Work", queries: [] },
        ]),
      });

      const result = await storage.createStoredQuery({
        containerId: "container-2",
        query: {
          name: "Roadmap",
          query: { tags: ["project"] },
        },
      });

      expect(result).toEqual({
        ok: true,
        value: {
          id: expect.any(String),
          name: "Roadmap",
          query: { tags: ["project"] },
        },
      });

      if (!result.ok) {
        throw new Error("Expected createStoredQuery to succeed.");
      }

      expect(await readStoredQueryContainers(fileSystem)).toEqual([
        { id: "container-1", name: "Stored Queries", queries: [] },
        { id: "container-2", name: "Work", queries: [result.value] },
      ]);
    });

    it("returns not found when the requested container is missing", async () => {
      const { storage } = createStorage({
        [`${ROOT_PATH}/stored-queries.json`]: JSON.stringify([
          { id: "container-1", name: "Stored Queries", queries: [] },
        ]),
      });

      const result = await storage.createStoredQuery({
        containerId: "missing",
        query: {
          name: "Missing",
          query: { tags: [] },
        },
      });

      expect(result).toEqual({
        ok: false,
        error: {
          code: "record-not-found",
          message: 'Record "missing" was not found.',
        },
      });
    });
  });

  describe("createStoredQueryContainer", () => {
    it("preserves the default container when creating the first custom container", async () => {
      const { storage, fileSystem } = createStorage();

      const result = await storage.createStoredQueryContainer({
        container: { name: "  Work  " },
      });

      expect(result).toEqual({
        ok: true,
        value: {
          id: expect.any(String),
          name: "Work",
          queries: [],
        },
      });

      if (!result.ok) {
        throw new Error("Expected createStoredQueryContainer to succeed.");
      }

      expect(await readStoredQueryContainers(fileSystem)).toEqual([
        {
          id: expect.any(String),
          name: "Stored Queries",
          queries: [],
        },
        result.value,
      ]);
    });
  });

  describe("updateStoredQueryContainer", () => {
    it("renames a container while preserving its queries", async () => {
      const { storage, fileSystem } = createStorage({
        [`${ROOT_PATH}/stored-queries.json`]: JSON.stringify([
          {
            id: "container-1",
            name: "Old",
            queries: [
              {
                id: "query-1",
                name: "Daily",
                query: { tags: ["daily"] },
              },
            ],
          },
        ]),
      });

      const result = await storage.updateStoredQueryContainer({
        id: "container-1",
        container: { name: "  New  " },
      });

      expect(result).toEqual({
        ok: true,
        value: {
          id: "container-1",
          name: "New",
          queries: [
            {
              id: "query-1",
              name: "Daily",
              query: { tags: ["daily"] },
            },
          ],
        },
      });
      expect(await readStoredQueryContainers(fileSystem)).toEqual([
        result.ok ? result.value : undefined,
      ]);
    });

    it("returns not found when the container does not exist", async () => {
      const { storage } = createStorage({
        [`${ROOT_PATH}/stored-queries.json`]: JSON.stringify([
          { id: "container-1", name: "Stored Queries", queries: [] },
        ]),
      });

      const result = await storage.updateStoredQueryContainer({
        id: "missing",
        container: { name: "Missing" },
      });

      expect(result).toEqual({
        ok: false,
        error: {
          code: "record-not-found",
          message: 'Record "missing" was not found.',
        },
      });
    });
  });

  describe("removeStoredQueryContainer", () => {
    it("removes a container and the queries it owns", async () => {
      const { storage, fileSystem } = createStorage({
        [`${ROOT_PATH}/stored-queries.json`]: JSON.stringify([
          {
            id: "container-1",
            name: "Stored Queries",
            queries: [
              {
                id: "query-1",
                name: "Daily",
                query: { tags: ["daily"] },
              },
            ],
          },
          {
            id: "container-2",
            name: "Work",
            queries: [
              {
                id: "query-2",
                name: "Roadmap",
                query: { tags: ["project"] },
              },
            ],
          },
        ]),
      });

      const result = await storage.removeStoredQueryContainer({
        id: "container-2",
      });

      expect(result).toEqual({ ok: true, value: undefined });
      expect(await readStoredQueryContainers(fileSystem)).toEqual([
        {
          id: "container-1",
          name: "Stored Queries",
          queries: [
            {
              id: "query-1",
              name: "Daily",
              query: { tags: ["daily"] },
            },
          ],
        },
      ]);
    });

    it("returns not found when the container does not exist", async () => {
      const { storage } = createStorage({
        [`${ROOT_PATH}/stored-queries.json`]: JSON.stringify([
          { id: "container-1", name: "Stored Queries", queries: [] },
        ]),
      });

      const result = await storage.removeStoredQueryContainer({
        id: "missing",
      });

      expect(result).toEqual({
        ok: false,
        error: {
          code: "record-not-found",
          message: 'Record "missing" was not found.',
        },
      });
    });
  });

  describe("updateStoredQuery", () => {
    it("updates a query in its owning container and normalizes tags", async () => {
      const { storage, fileSystem } = createStorage({
        [`${ROOT_PATH}/stored-queries.json`]: JSON.stringify([
          {
            id: "container-1",
            name: "Stored Queries",
            queries: [
              {
                id: "query-1",
                name: "Old",
                query: { tags: ["old"] },
              },
            ],
          },
        ]),
      });

      const result = await storage.updateStoredQuery({
        id: "query-1",
        query: {
          name: "  New  ",
          query: { tags: ["daily notes"] },
        },
      });

      expect(result).toEqual({
        ok: true,
        value: {
          id: "query-1",
          name: "New",
          query: { tags: ["daily", "notes"] },
        },
      });
      expect(await readStoredQueryContainers(fileSystem)).toEqual([
        {
          id: "container-1",
          name: "Stored Queries",
          queries: [result.ok ? result.value : undefined],
        },
      ]);
    });

    it("returns not found when the query does not exist", async () => {
      const { storage } = createStorage({
        [`${ROOT_PATH}/stored-queries.json`]: JSON.stringify([
          { id: "container-1", name: "Stored Queries", queries: [] },
        ]),
      });

      const result = await storage.updateStoredQuery({
        id: "missing",
        query: {
          name: "Missing",
          query: { tags: [] },
        },
      });

      expect(result).toEqual({
        ok: false,
        error: {
          code: "record-not-found",
          message: 'Record "missing" was not found.',
        },
      });
    });
  });

  describe("removeStoredQuery", () => {
    it("removes only the matching query from its owning container", async () => {
      const { storage, fileSystem } = createStorage({
        [`${ROOT_PATH}/stored-queries.json`]: JSON.stringify([
          {
            id: "container-1",
            name: "Stored Queries",
            queries: [
              {
                id: "query-1",
                name: "Daily",
                query: { tags: ["daily"] },
              },
              {
                id: "query-2",
                name: "Roadmap",
                query: { tags: ["project"] },
              },
            ],
          },
        ]),
      });

      const result = await storage.removeStoredQuery({ id: "query-1" });

      expect(result).toEqual({ ok: true, value: undefined });
      expect(await readStoredQueryContainers(fileSystem)).toEqual([
        {
          id: "container-1",
          name: "Stored Queries",
          queries: [
            {
              id: "query-2",
              name: "Roadmap",
              query: { tags: ["project"] },
            },
          ],
        },
      ]);
    });

    it("returns not found when the query does not exist", async () => {
      const { storage } = createStorage({
        [`${ROOT_PATH}/stored-queries.json`]: JSON.stringify([
          { id: "container-1", name: "Stored Queries", queries: [] },
        ]),
      });

      const result = await storage.removeStoredQuery({ id: "missing" });

      expect(result).toEqual({
        ok: false,
        error: {
          code: "record-not-found",
          message: 'Record "missing" was not found.',
        },
      });
    });
  });
});
