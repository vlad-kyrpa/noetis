import { strict as assert } from 'node:assert';
import { after, before, test } from 'node:test';
import { createApiTestContext, type ApiTestContext } from '../api-test-context';
import { createApiFixture, seedApiFixture } from '../fixtures';

/** Holds the one expensive Worker/D1 harness shared by this module's sequential API cases. */
const testState: { context: ApiTestContext | null } = { context: null };

/** Returns the started module harness or fails clearly if test lifecycle hooks are misconfigured. */
const getContext = (): ApiTestContext => {
  if (testState.context === null) {
    throw new Error('Expenses test context was not started');
  }
  return testState.context;
};

/** Starts and migrates the Worker once before this module's tests run. */
before(async (): Promise<void> => {
  testState.context = await createApiTestContext();
});

/** Stops the shared Worker only after every module test has completed. */
after(async (): Promise<void> => {
  if (testState.context !== null) {
    await testState.context.close();
  }
});

/** Groups all list-endpoint behavior so successful and invalid requests remain easy to compare. */
test('GET /api/expenses', async (suite) => {
  await suite.test('returns fixture records filtered by tag', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/expenses?tag=work');
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: readonly {
          readonly id: string;
          readonly amount: number;
          readonly tag: string | null;
          readonly description: string | null;
        }[];
      };

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.length, 1);
      assert.equal(payload.value[0]?.id, 'expense-hosting');
      assert.equal(payload.value[0]?.amount, -2500);
      assert.equal(payload.value[0]?.tag, 'work');
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

  await suite.test('returns only records created within the requested date range', async () => {
    const context = getContext();

    try {
      await seedApiFixture({
        database: context.database,
        fixture: createApiFixture({
          expenses: [
            {
              id: 'expense-january',
              amount: -2500,
              tagId: 'tag-work',
              description: 'January hosting subscription',
              createdAt: new Date('2026-01-02T03:04:05.000Z'),
              updatedAt: new Date('2026-01-02T03:04:05.000Z'),
            },
            {
              id: 'expense-february',
              amount: -3000,
              tagId: 'tag-work',
              description: 'February hosting subscription',
              createdAt: new Date('2026-02-02T03:04:05.000Z'),
              updatedAt: new Date('2026-02-02T03:04:05.000Z'),
            },
          ],
        }),
      });
      const response = await context.fetch(
        '/api/expenses?from=2026-01-02T00%3A00%3A00.000Z&to=2026-01-31T23%3A59%3A59.999Z',
      );
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: readonly { readonly id: string }[];
      };

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.deepEqual(
        payload.value.map((expense) => expense.id),
        ['expense-january'],
      );
    } finally {
      await context.reset();
    }
  });

  await suite.test(
    'returns records from the supplied start date when no end date is given',
    async () => {
      const context = getContext();

      try {
        await seedApiFixture({ database: context.database, fixture: createApiFixture() });
        const response = await context.fetch('/api/expenses?from=2026-01-01T00%3A00%3A00.000Z');
        const payload = (await response.json()) as {
          readonly ok: boolean;
          readonly value: readonly { readonly id: string }[];
        };

        assert.equal(response.status, 200);
        assert.equal(payload.ok, true);
        assert.deepEqual(
          payload.value.map((expense) => expense.id),
          ['expense-hosting'],
        );
      } finally {
        await context.reset();
      }
    },
  );

  await suite.test(
    'returns records through the supplied end date when no start date is given',
    async () => {
      const context = getContext();

      try {
        await seedApiFixture({ database: context.database, fixture: createApiFixture() });
        const response = await context.fetch('/api/expenses?to=2026-01-31T23%3A59%3A59.999Z');
        const payload = (await response.json()) as {
          readonly ok: boolean;
          readonly value: readonly { readonly id: string }[];
        };

        assert.equal(response.status, 200);
        assert.equal(payload.ok, true);
        assert.deepEqual(
          payload.value.map((expense) => expense.id),
          ['expense-hosting'],
        );
      } finally {
        await context.reset();
      }
    },
  );

  await suite.test('rejects a date range whose start is after its end', async () => {
    const context = getContext();

    try {
      const response = await context.fetch(
        '/api/expenses?from=2026-02-01T00%3A00%3A00.000Z&to=2026-01-01T00%3A00%3A00.000Z',
      );

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
      const response = await context.fetch('/api/expenses?tag=missing');
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
  await suite.test('creates a missing tag before persisting a tagged expense', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/expenses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount: -750,
          description: 'Domain renewal',
          tag: 'finance',
        }),
      });
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: {
          readonly id: string;
          readonly amount: number;
          readonly description: string | null;
          readonly tag: string | null;
        };
      };
      const tagsResponse = await context.fetch('/api/tags?label=finance');
      const storedTags = (await tagsResponse.json()) as {
        readonly ok: boolean;
        readonly value: readonly { readonly label: string }[];
      };

      assert.equal(response.status, 201);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.amount, -750);
      assert.equal(payload.value.description, 'Domain renewal');
      assert.equal(payload.value.tag, 'finance');
      assert.equal(tagsResponse.status, 200);
      assert.equal(storedTags.ok, true);
      assert.deepEqual(
        storedTags.value.map((tag) => tag.label),
        ['finance'],
      );
    } finally {
      await context.reset();
    }
  });

  await suite.test('reuses an existing tag label for a new expense', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/expenses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amount: -500, description: 'Existing tag expense', tag: 'work' }),
      });
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: { readonly amount: number; readonly tag: string | null };
      };
      const tagsResponse = await context.fetch('/api/tags?label=work');
      const storedTags = (await tagsResponse.json()) as {
        readonly ok: boolean;
        readonly value: readonly { readonly label: string }[];
      };

      assert.equal(response.status, 201);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.amount, -500);
      assert.equal(payload.value.tag, 'work');
      assert.equal(tagsResponse.status, 200);
      assert.equal(storedTags.ok, true);
      assert.deepEqual(
        storedTags.value.map((tag) => tag.label),
        ['work'],
      );
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
        body: JSON.stringify({ amount: '750', description: 'Invalid', tag: null }),
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
          tag: 'work',
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
        body: JSON.stringify({ amount: -3000, description: null, tag: null }),
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
      const listResponse = await context.fetch('/api/expenses?tag=work');
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
