import { describe, expect, it, vi } from "vitest";
import { CoreEngine } from "./core";
import {
  MOCK_NOTE_ID,
  MOCK_STORAGE_FAILURE,
  MOCK_STORED_RECORD,
  MOCK_STORED_RECORD_HEADER,
  MOCK_STORED_QUERY_CONTAINER,
  MOCK_STORED_QUERY_ITEM,
  createMockCoreStorage,
} from "./utils/test-utils";
import type {
  CoreError,
  CoreStorage,
  CreateNotePayload,
  Query,
  Result,
  StoredRecord,
  StoredRecordHeader,
  StoredQueryContainer,
  StoredQueryItem,
  UpdateStoredRecordParams,
} from "./types";

describe("CoreEngine", () => {
  describe("run", () => {
    it("routes create commands to storage and notifies subscribers after success", async () => {
      const payload: CreateNotePayload = {
        title: "Title",
        content: "Content",
        tags: [],
        createdAt: new Date("2026-08-15T00:00:00.000Z"),
      };

      const addRecord: CoreStorage["addRecord"] = vi.fn(
        async (): Promise<Result<StoredRecord, CoreError>> => ({
          ok: true,
          value: MOCK_STORED_RECORD,
        }),
      );
      const callback: () => void = vi.fn((): void => undefined);
      const engine: CoreEngine = new CoreEngine({
        storage: createMockCoreStorage({ addRecord }),
      });

      engine.addStateUpdateCallback(callback);
      const result: Result<StoredRecord, CoreError> = await engine.run({
        id: "create-note",
        payload,
      });

      expect(result).toEqual({ ok: true, value: MOCK_STORED_RECORD });
      expect(addRecord).toHaveBeenCalledWith(payload);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("returns typed storage failures without notifying subscribers", async () => {
      const removeRecord: CoreStorage["removeRecord"] = vi.fn(
        async (): Promise<Result<void, CoreError>> => ({
          ok: false,
          error: MOCK_STORAGE_FAILURE,
        }),
      );
      const callback: () => void = vi.fn((): void => undefined);
      const engine: CoreEngine = new CoreEngine({
        storage: createMockCoreStorage({ removeRecord }),
      });

      engine.addStateUpdateCallback(callback);
      const result: Result<void, CoreError> = await engine.run({
        id: "remove-note",
        payload: { id: MOCK_NOTE_ID },
      });

      expect(result).toEqual({ ok: false, error: MOCK_STORAGE_FAILURE });
      expect(removeRecord).toHaveBeenCalledWith(MOCK_NOTE_ID);
      expect(callback).not.toHaveBeenCalled();
    });

    it("routes update commands through the named storage parameters object", async () => {
      const updateRecord: CoreStorage["updateRecord"] = vi.fn(
        async (): Promise<Result<StoredRecord, CoreError>> => ({
          ok: true,
          value: MOCK_STORED_RECORD,
        }),
      );
      const engine: CoreEngine = new CoreEngine({
        storage: createMockCoreStorage({ updateRecord }),
      });

      const result: Result<StoredRecord, CoreError> = await engine.run({
        id: "update-note",
        payload: {
          id: MOCK_NOTE_ID,
          title: "Updated",
          content: "Updated content",
          tags: ["tag"],
          updatedAt: new Date("2026-08-15T00:00:00.000Z"),
        },
      });

      expect(result).toEqual({ ok: true, value: MOCK_STORED_RECORD });
      expect(updateRecord).toHaveBeenCalledWith({
        id: MOCK_NOTE_ID,
        payload: expect.objectContaining({ id: MOCK_NOTE_ID }),
      } satisfies UpdateStoredRecordParams);
    });

    it("routes stored query item commands to storage", async () => {
      const createStoredQuery: CoreStorage["createStoredQuery"] = vi.fn(
        async (): Promise<Result<StoredQueryItem, CoreError>> => ({
          ok: true,
          value: MOCK_STORED_QUERY_ITEM,
        }),
      );
      const updateStoredQuery: CoreStorage["updateStoredQuery"] = vi.fn(
        async (): Promise<Result<StoredQueryItem, CoreError>> => ({
          ok: true,
          value: MOCK_STORED_QUERY_ITEM,
        }),
      );
      const removeStoredQuery: CoreStorage["removeStoredQuery"] = vi.fn(
        async (): Promise<Result<void, CoreError>> => ({
          ok: true,
          value: undefined,
        }),
      );
      const engine: CoreEngine = new CoreEngine({
        storage: createMockCoreStorage({
          createStoredQuery,
          updateStoredQuery,
          removeStoredQuery,
        }),
      });

      const createResult: Result<StoredQueryItem, CoreError> =
        await engine.run({
          id: "create-stored-query",
          payload: {
            query: {
              name: "Daily",
              query: { tags: ["daily"] },
            },
          },
        });
      const updateResult: Result<StoredQueryItem, CoreError> =
        await engine.run({
          id: "update-stored-query",
          payload: {
            id: "stored-query-1",
            query: {
              name: "Daily",
              query: { tags: ["daily"] },
            },
          },
        });
      const removeResult: Result<void, CoreError> = await engine.run({
        id: "remove-stored-query",
        payload: { id: "stored-query-1" },
      });

      expect(createResult).toEqual({
        ok: true,
        value: MOCK_STORED_QUERY_ITEM,
      });
      expect(updateResult).toEqual({
        ok: true,
        value: MOCK_STORED_QUERY_ITEM,
      });
      expect(removeResult).toEqual({ ok: true, value: undefined });
      expect(createStoredQuery).toHaveBeenCalledWith({
        query: {
          name: "Daily",
          query: { tags: ["daily"] },
        },
      });
      expect(updateStoredQuery).toHaveBeenCalledWith({
        id: "stored-query-1",
        query: {
          name: "Daily",
          query: { tags: ["daily"] },
        },
      });
      expect(removeStoredQuery).toHaveBeenCalledWith({
        id: "stored-query-1",
      });
    });

    it("routes stored query container commands to storage", async () => {
      const createStoredQueryContainer: CoreStorage["createStoredQueryContainer"] =
        vi.fn(
          async (): Promise<Result<StoredQueryContainer, CoreError>> => ({
            ok: true,
            value: MOCK_STORED_QUERY_CONTAINER,
          }),
        );
      const updateStoredQueryContainer: CoreStorage["updateStoredQueryContainer"] =
        vi.fn(
          async (): Promise<Result<StoredQueryContainer, CoreError>> => ({
            ok: true,
            value: MOCK_STORED_QUERY_CONTAINER,
          }),
        );
      const removeStoredQueryContainer: CoreStorage["removeStoredQueryContainer"] =
        vi.fn(
          async (): Promise<Result<void, CoreError>> => ({
            ok: true,
            value: undefined,
          }),
        );
      const engine: CoreEngine = new CoreEngine({
        storage: createMockCoreStorage({
          createStoredQueryContainer,
          updateStoredQueryContainer,
          removeStoredQueryContainer,
        }),
      });

      const createResult: Result<StoredQueryContainer, CoreError> =
        await engine.run({
          id: "create-stored-query-container",
          payload: { container: { name: "Work" } },
        });
      const updateResult: Result<StoredQueryContainer, CoreError> =
        await engine.run({
          id: "update-stored-query-container",
          payload: {
            id: "stored-query-container-1",
            container: { name: "Work" },
          },
        });
      const removeResult: Result<void, CoreError> = await engine.run({
        id: "remove-stored-query-container",
        payload: { id: "stored-query-container-1" },
      });

      expect(createResult).toEqual({
        ok: true,
        value: MOCK_STORED_QUERY_CONTAINER,
      });
      expect(updateResult).toEqual({
        ok: true,
        value: MOCK_STORED_QUERY_CONTAINER,
      });
      expect(removeResult).toEqual({ ok: true, value: undefined });
      expect(createStoredQueryContainer).toHaveBeenCalledWith({
        container: { name: "Work" },
      });
      expect(updateStoredQueryContainer).toHaveBeenCalledWith({
        id: "stored-query-container-1",
        container: { name: "Work" },
      });
      expect(removeStoredQueryContainer).toHaveBeenCalledWith({
        id: "stored-query-container-1",
      });
    });

    it("does not notify subscribers when stored query commands fail", async () => {
      const createStoredQueryContainer: CoreStorage["createStoredQueryContainer"] =
        vi.fn(
          async (): Promise<Result<StoredQueryContainer, CoreError>> => ({
            ok: false,
            error: MOCK_STORAGE_FAILURE,
          }),
        );
      const callback: () => void = vi.fn((): void => undefined);
      const engine: CoreEngine = new CoreEngine({
        storage: createMockCoreStorage({ createStoredQueryContainer }),
      });

      engine.addStateUpdateCallback(callback);
      const result: Result<StoredQueryContainer, CoreError> = await engine.run({
        id: "create-stored-query-container",
        payload: { container: { name: "Work" } },
      });

      expect(result).toEqual({ ok: false, error: MOCK_STORAGE_FAILURE });
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("query", () => {
    it("routes list reads through storage", async () => {
      const query: Query = { text: "Title", tags: [] };
      const findRecords: CoreStorage["findRecords"] = vi.fn(
        async (): Promise<Result<StoredRecordHeader[], CoreError>> => ({
          ok: true,
          value: [MOCK_STORED_RECORD_HEADER],
        }),
      );
      const engine: CoreEngine = new CoreEngine({
        storage: createMockCoreStorage({ findRecords }),
      });

      const result: Result<StoredRecordHeader[], CoreError> =
        await engine.query(query);

      expect(result).toEqual({
        ok: true,
        value: [MOCK_STORED_RECORD_HEADER],
      });
      expect(findRecords).toHaveBeenCalledWith(query);
    });
  });

  describe("get", () => {
    it("routes direct record reads through storage", async () => {
      const getRecords: CoreStorage["getRecords"] = vi.fn(
        async (): Promise<Result<StoredRecord[], CoreError>> => ({
          ok: true,
          value: [MOCK_STORED_RECORD],
        }),
      );
      const engine: CoreEngine = new CoreEngine({
        storage: createMockCoreStorage({ getRecords }),
      });

      const result: Result<StoredRecord[], CoreError> = await engine.get([
        MOCK_NOTE_ID,
      ]);

      expect(result).toEqual({ ok: true, value: [MOCK_STORED_RECORD] });
      expect(getRecords).toHaveBeenCalledWith([MOCK_NOTE_ID]);
    });
  });

  describe("addStateUpdateCallback", () => {
    it("registers callbacks for successful command notifications", async () => {
      const callback: () => void = vi.fn((): void => undefined);
      const engine: CoreEngine = new CoreEngine({
        storage: createMockCoreStorage(),
      });

      engine.addStateUpdateCallback(callback);
      await engine.run({
        id: "remove-note",
        payload: { id: MOCK_NOTE_ID },
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("removeStateUpdateCallback", () => {
    it("removes callbacks by identity", async () => {
      const keptCallback: () => void = vi.fn((): void => undefined);
      const removedCallback: () => void = vi.fn((): void => undefined);
      const engine: CoreEngine = new CoreEngine({
        storage: createMockCoreStorage(),
      });

      engine.addStateUpdateCallback(keptCallback);
      engine.addStateUpdateCallback(removedCallback);
      engine.removeStateUpdateCallback(removedCallback);
      await engine.run({
        id: "remove-note",
        payload: { id: MOCK_NOTE_ID },
      });

      expect(keptCallback).toHaveBeenCalledTimes(1);
      expect(removedCallback).not.toHaveBeenCalled();
    });
  });
});
