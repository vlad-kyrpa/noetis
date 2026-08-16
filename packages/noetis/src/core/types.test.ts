import { describe, expect, it } from "vitest";
import type {
  Command,
  CoreError,
  NoteId,
  Result,
  StoredRecordHeader,
} from "./types";

const NOTE_ID: NoteId = "note-1" as NoteId;

// Keeps the discriminated command union and branded identifiers compile-checked.
describe("core types", () => {
  it("accepts update commands with a branded note id and updated timestamp", () => {
    const command: Command = {
      id: "update-note",
      payload: {
        id: NOTE_ID,
        title: "Title",
        content: "Content",
        tags: [],
        updatedAt: new Date("2026-08-15T00:00:00.000Z"),
      },
    };

    expect(command.payload.id).toBe(NOTE_ID);
  });

  it("represents expected failures with the result pattern", () => {
    const result: Result<StoredRecordHeader[], CoreError> = {
      ok: false,
      error: {
        code: "record-not-found",
        message: "Record was not found",
      },
    };

    expect(result).toEqual({
      ok: false,
      error: {
        code: "record-not-found",
        message: "Record was not found",
      },
    });
  });
});
