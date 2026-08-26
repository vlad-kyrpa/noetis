import { describe, expect, it, vi } from "vitest";
import { CoreEngine } from "./core";
import {
  MOCK_NOTE_ID,
  MOCK_STORAGE_FAILURE,
  MOCK_STORED_RECORD,
  MOCK_STORED_RECORD_HEADER,
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
