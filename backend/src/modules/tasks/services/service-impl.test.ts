import { strict as assert } from "node:assert";
import test from "node:test";
import { createRecordedDatabase } from "../../common/utils/test-utils";
import { taskServiceFactory } from "./task-service";

/** Verifies Task filters are composed as case-insensitive, parameterized predicates. */
test("find applies title, tag, status, and defined due-date filters", async () => {
  const fixture = createRecordedDatabase((sql) => sql.includes("from \"tasks\"") ? [["task-1", "work", "Ship module", null, "2026-10-20", "inProgress", 10, 20]] : []);
  const records = await taskServiceFactory(fixture.database).find({ title: "SHIP", tagId: "work", status: "inProgress", dueTo: "defined" });
  const query = fixture.queries[0];
  assert.equal(records[0]?.title, "Ship module");
  assert.match(query?.sql ?? "", /"tag_id" = \? .*lower\("tasks"\."title"\) like \? .*"status" = \? .*"due_to" is not null/i);
  assert.deepEqual(query?.parameters, ["work", "%ship%", "inProgress"]);
});
