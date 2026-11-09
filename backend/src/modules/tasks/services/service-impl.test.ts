import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createRecordedDatabase } from '../../common/utils/test-utils';
import { taskServiceFactory } from './task-service';

/** Raw `tasks` row in column order: id, user, title, description, due date, status, timestamps. */
const STORED_TASK_ROW = [
  'task-1',
  'user-1',
  'Ship module',
  null,
  '2026-10-20',
  'inProgress',
  10,
  20,
];

/** Verifies Task filters are composed as case-insensitive, parameterized, AND-combined predicates. */
test('find applies title, tag, status, and defined due-date filters', async () => {
  const fixture = createRecordedDatabase((sql) =>
    sql.includes('from "tasks"') ? [STORED_TASK_ROW] : [],
  );
  const records = await taskServiceFactory({ database: fixture.database, userId: 'user-1' }).find({
    title: 'SHIP',
    tagId: 'work',
    status: 'inProgress',
    dueTo: 'defined',
  });
  const query = fixture.queries[0];
  assert.equal(records[0]?.title, 'Ship module');
  assert.match(
    query?.sql ?? '',
    /"tag_id" in \(\?\).*having count\(distinct "task_tags"\."tag_id"\) = \?.*lower\("tasks"\."title"\) like \?.*"status" = \?.*"due_to" is not null/is,
  );
  assert.deepEqual(query?.parameters, ['user-1', 'work', 1, '%ship%', 'inProgress']);
});

/** Verifies an inclusive due-date range becomes two bounds on the same column. */
test('find bounds the due date on both sides of a range', async () => {
  const fixture = createRecordedDatabase(() => []);
  await taskServiceFactory({ database: fixture.database, userId: 'user-1' }).find({
    dueFrom: '2026-11-02',
    dueUntil: '2026-11-08',
  });
  const query = fixture.queries[0];
  assert.match(query?.sql ?? '', /"due_to" >= \?.*"due_to" <= \?/is);
  assert.deepEqual(query?.parameters, ['user-1', '2026-11-02', '2026-11-08']);
});
