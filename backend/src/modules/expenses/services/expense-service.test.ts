import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createRecordedDatabase } from '../../common/utils/test-utils';
import { expenseServiceFactory } from './expense-service';

/** Verifies Expense filters become parameterized predicates in Drizzle SQL. */
test('find applies tag and inclusive date-range filters', async () => {
  const fixture = createRecordedDatabase((sql) =>
    sql.includes('from "tags"')
      ? [['tag-food']]
      : [['expense-1', -1250, 'tag-food', 'Lunch', 10, 20]],
  );
  const records = await expenseServiceFactory(fixture.database).find({
    tag: 'food',
    from: new Date(10),
    to: new Date(20),
  });
  const query = fixture.queries[1];
  assert.equal(records.length, 1);
  assert.match(
    query?.sql ?? '',
    /where .*"expenses"\."tag_id" = \? and .*"created_at" >= \? and .*"created_at" <= \?/i,
  );
  assert.deepEqual(query?.parameters, ['tag-food', 10, 20]);
});
