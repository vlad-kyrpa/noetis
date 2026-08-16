import { describe, expect, it } from "vitest";
import { CoreEngine, FileStorage } from "./index";

// Verifies the package entrypoint exposes the runtime core APIs.
describe("package exports", () => {
  it("exports the core engine", () => {
    expect(CoreEngine).toBeTypeOf("function");
  });

  it("exports the file storage adapter", () => {
    expect(FileStorage).toBeTypeOf("function");
  });
});
