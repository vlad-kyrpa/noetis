import { strict as assert } from "node:assert";
import test from "node:test";
import { decodeExpenseInput } from "./validation";

/** Ensures expense writes reject non-finite amounts and malformed optional fields. */
test("decodeExpenseInput validates signed monetary records", () => {
  assert.deepEqual(
    decodeExpenseInput({ amount: -1250, description: "Lunch", tagId: "food" }),
    { amount: -1250, description: "Lunch", tagId: "food" },
  );
  assert.equal(
    decodeExpenseInput({ amount: Number.NaN, description: null, tagId: null }),
    null,
  );
  assert.equal(
    decodeExpenseInput({ amount: 1, description: 4, tagId: null }),
    null,
  );
  assert.deepEqual(
    decodeExpenseInput({ amount: 500, description: null, tagId: null }),
    { amount: 500, description: null, tagId: null },
  );
});
