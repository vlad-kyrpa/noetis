import { strict as assert } from 'node:assert';
import { after, before, test } from 'node:test';
import { createApiTestContext, type ApiTestContext } from '../api-test-context';
import { createApiFixture, seedApiFixture } from '../fixtures';

/** Holds the one expensive Worker/D1 harness shared by this module's sequential API cases. */
const testState: { context: ApiTestContext | null } = { context: null };

/** Returns the started module harness or fails clearly if test lifecycle hooks are misconfigured. */
const getContext = (): ApiTestContext => {
  if (testState.context === null) throw new Error('Expenses test context was not started');
  return testState.context;
};

/** Starts and migrates the Worker once before this module's tests run. */
before(async (): Promise<void> => {
  testState.context = await createApiTestContext();
});

/** Stops the shared Worker only after every module test has completed. */
after(async (): Promise<void> => {
  await getContext().close();
});

/** Groups all list-endpoint behavior so successful and invalid requests remain easy to compare. */
test('GET /api/expenses', async (suite) => {
  await suite.test('returns fixture records filtered by tag', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/expenses?tagId=tag-work');
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: readonly {
          readonly id: string;
          readonly amount: number;
          readonly tagId: string | null;
          readonly description: string | null;
        }[];
      };

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.length, 1);
      assert.equal(payload.value[0]?.id, 'expense-hosting');
      assert.equal(payload.value[0]?.amount, -2500);
      assert.equal(payload.value[0]?.tagId, 'tag-work');
      assert.equal(payload.value[0]?.description, 'Hosting subscription');
    } finally {
      await context.reset();
    }
  });

  await suite.test('rejects an invalid date filter', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/expenses?from=not-a-date');

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { ok: false, error: 'Invalid request' });
    } finally {
      await context.reset();
    }
  });

  await suite.test('returns an empty list when the requested tag does not exist', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/expenses?tagId=tag-missing');
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: readonly unknown[];
      };

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.deepEqual(payload.value, []);
    } finally {
      await context.reset();
    }
  });
});

/** Groups expense-create behavior by its public write endpoint. */
test('POST /api/expenses', async (suite) => {
  await suite.test('creates a new untagged expense', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/expenses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: -750,
          description: 'Domain renewal',
          tagIds: [],
        }),
      });
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: {
          readonly id: string;
          readonly amount: number;
          readonly description: string | null;
          readonly tagId: string | null;
        };
      };

      assert.equal(response.status, 201);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.amount, -750);
      assert.equal(payload.value.description, 'Domain renewal');
      assert.equal(payload.value.tagId, null);
    } finally {
      await context.reset();
    }
  });

  await suite.test('rejects an expense with a non-numeric amount', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/expenses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amount: '750', description: 'Invalid', tagIds: [] }),
      });

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { ok: false, error: 'Invalid request' });
    } finally {
      await context.reset();
    }
  });
});

/** Groups expense-replacement behavior by its public write endpoint. */
test('PUT /api/expenses/:id', async (suite) => {
  await suite.test('updates an existing fixture expense', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/expenses/expense-hosting', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: -3000,
          description: 'Annual hosting subscription',
          tagIds: [],
        }),
      });
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: {
          readonly id: string;
          readonly amount: number;
          readonly description: string | null;
        };
      };

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.id, 'expense-hosting');
      assert.equal(payload.value.amount, -3000);
      assert.equal(payload.value.description, 'Annual hosting subscription');
    } finally {
      await context.reset();
    }
  });

  await suite.test('returns not found for an unknown expense', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/expenses/expense-missing', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amount: -3000, description: null, tagIds: [] }),
      });

      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { ok: false, error: 'Expense not found' });
    } finally {
      await context.reset();
    }
  });
});

/** Groups all delete-endpoint behavior so command validation is tested beside the success case. */
test('DELETE /api/expenses', async (suite) => {
  await suite.test('removes selected fixture records', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const deleteResponse = await context.fetch('/api/expenses', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: ['expense-hosting'] }),
      });
      const listResponse = await context.fetch('/api/expenses?tagId=tag-work');
      const listed = (await listResponse.json()) as {
        readonly ok: boolean;
        readonly value: readonly unknown[];
      };

      assert.equal(deleteResponse.status, 200);
      assert.equal(listResponse.status, 200);
      assert.equal(listed.ok, true);
      assert.deepEqual(listed.value, []);
    } finally {
      await context.reset();
    }
  });

  await suite.test('rejects a request without an identifier list', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/expenses', { method: 'DELETE' });

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { ok: false, error: 'Invalid request' });
    } finally {
      await context.reset();
    }
  });

  await suite.test('succeeds when an identifier does not exist', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/expenses', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: ['expense-missing'] }),
      });

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        ok: true,
        value: { ids: ['expense-missing'] },
      });
    } finally {
      await context.reset();
    }
  });
});
