import { strict as assert } from "node:assert";
import test from "node:test";
import { tagInputSchema } from "./create.validation";

/** Ensures malformed tag commands never reach the route handler. */
test("tagInputSchema rejects invalid labels", () => {
  assert.equal(tagInputSchema.safeParse({ label: "" }).success, false);
  assert.deepEqual(tagInputSchema.safeParse({ label: " work " }).data, { label: "work" });
});
