import { strict as assert } from "node:assert";
import test from "node:test";
import { isTaskStatus } from "./constants";

/** Ensures the status guard remains aligned with the documented task lifecycle. */
test("isTaskStatus accepts only documented task states", () => {
  assert.equal(isTaskStatus("undone"), true);
  assert.equal(isTaskStatus("inProgress"), true);
  assert.equal(isTaskStatus("done"), true);
  assert.equal(isTaskStatus("archived"), false);
});
