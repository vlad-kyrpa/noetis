import { strict as assert } from 'node:assert';
import { after, before, test } from 'node:test';
import { createApiTestContext, type ApiTestContext } from '../api-test-context';
import { createApiFixture, seedApiFixture } from '../fixtures';

/** Holds the one expensive Worker/D1 harness shared by this module's sequential API cases. */
const testState: { context: ApiTestContext | null } = { context: null };
/** Returns the started module harness or reports an invalid test lifecycle. */
const getContext = (): ApiTestContext => {
  if (testState.context === null) {
    throw new Error('Views test context was not started');
  }
  return testState.context;
};
/** Starts and migrates the Worker once before this module's test cases run. */
before(async (): Promise<void> => {
  testState.context = await createApiTestContext();
});
/** Stops the shared Worker only after every module test has completed. */
after(async (): Promise<void> => {
  if (testState.context !== null) {
    await testState.context.close();
  }
});

/** Groups saved-view list behavior by its public read endpoint. */
test('GET /api/views', async (suite) => {
  await suite.test('rejects requests without an access token', async () => {
    assert.equal((await getContext().fetch('/api/views', { authenticated: false })).status, 401);
  });

  await suite.test('returns views filtered by type', async () => {
    const context = getContext();
    try {
      const create = await context.fetch('/api/views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'note', period: 'week', title: 'Weekly work', tags: [] }),
      });
      const created = (await create.json()) as { readonly value: { readonly id: string } };
      const response = await context.fetch('/api/views?type=note');
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: readonly { readonly id: string }[];
      };
      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.deepEqual(
        payload.value.map((view) => view.id),
        [created.value.id],
      );
    } finally {
      await context.reset();
    }
  });
  await suite.test('rejects an invalid type filter', async () => {
    const context = getContext();
    try {
      const response = await context.fetch('/api/views?type=invalid');
      assert.equal(response.status, 400);
    } finally {
      await context.reset();
    }
  });
});

/** Groups single-view lookup behavior by its public read endpoint. */
test('GET /api/views/:id', async (suite) => {
  await suite.test('rejects requests without an access token', async () => {
    assert.equal(
      (await getContext().fetch('/api/views/view-id', { authenticated: false })).status,
      401,
    );
  });

  await suite.test('returns the selected saved view', async () => {
    const context = getContext();
    try {
      const create = await context.fetch('/api/views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'expense', period: 'month', title: 'Bills', tags: [] }),
      });
      const created = (await create.json()) as { readonly value: { readonly id: string } };
      const response = await context.fetch(`/api/views/${created.value.id}`);
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: { readonly title: string; readonly period: string };
      };
      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.title, 'Bills');
      assert.equal(payload.value.period, 'month');
    } finally {
      await context.reset();
    }
  });
  await suite.test('returns not found for an unknown view', async () => {
    const context = getContext();
    try {
      const response = await context.fetch('/api/views/missing');
      assert.equal(response.status, 404);
    } finally {
      await context.reset();
    }
  });
});

/** Groups saved-view create behavior by its public write endpoint. */
test('POST /api/views', async (suite) => {
  await suite.test('rejects requests without an access token', async () => {
    assert.equal(
      (await getContext().fetch('/api/views', { method: 'POST', authenticated: false })).status,
      401,
    );
  });

  await suite.test('reuses existing labels and creates missing labels', async () => {
    const context = getContext();
    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'note',
          period: 'week',
          title: 'Weekly work',
          tags: ['work', 'release'],
        }),
      });
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: { readonly tags: readonly string[] };
      };
      assert.equal(response.status, 201);
      assert.equal(payload.ok, true);
      assert.deepEqual([...payload.value.tags].sort(), ['release', 'work']);
    } finally {
      await context.reset();
    }
  });
  await suite.test('rejects an invalid period and duplicate type-title pair', async () => {
    const context = getContext();
    try {
      const invalid = await context.fetch('/api/views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'note', period: 'quarter', title: 'Quarterly', tags: [] }),
      });
      const first = await context.fetch('/api/views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'task', period: 'month', title: 'Progress', tags: [] }),
      });
      const duplicate = await context.fetch('/api/views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'task', period: 'day', title: 'Progress', tags: [] }),
      });
      assert.equal(invalid.status, 400);
      assert.equal(first.status, 201);
      assert.equal(duplicate.status, 409);
    } finally {
      await context.reset();
    }
  });
});

/** Groups saved-view replacement behavior by its public write endpoint. */
test('PUT /api/views/:id', async (suite) => {
  await suite.test('rejects requests without an access token', async () => {
    assert.equal(
      (await getContext().fetch('/api/views/view-id', { method: 'PUT', authenticated: false }))
        .status,
      401,
    );
  });

  await suite.test('updates a saved view and replaces its tags', async () => {
    const context = getContext();
    try {
      const create = await context.fetch('/api/views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'expense',
          period: 'month',
          title: 'Bills',
          tags: ['finance'],
        }),
      });
      const created = (await create.json()) as { readonly value: { readonly id: string } };
      const response = await context.fetch(`/api/views/${created.value.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'expense', period: 'year', title: 'Bills', tags: ['work'] }),
      });
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: { readonly period: string; readonly tags: readonly string[] };
      };
      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.period, 'year');
      assert.deepEqual(payload.value.tags, ['work']);
    } finally {
      await context.reset();
    }
  });
  await suite.test(
    'returns conflict when an update duplicates another view title and type',
    async () => {
      const context = getContext();
      try {
        const first = await context.fetch('/api/views', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ type: 'task', period: 'month', title: 'Progress', tags: [] }),
        });
        const second = await context.fetch('/api/views', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ type: 'note', period: 'day', title: 'Progress', tags: [] }),
        });
        const secondPayload = (await second.json()) as { readonly value: { readonly id: string } };
        const response = await context.fetch(`/api/views/${secondPayload.value.id}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ type: 'task', period: 'day', title: 'Progress', tags: [] }),
        });
        assert.equal(first.status, 201);
        assert.equal(response.status, 409);
      } finally {
        await context.reset();
      }
    },
  );
  await suite.test('returns not found for an unknown view', async () => {
    const context = getContext();
    try {
      const response = await context.fetch('/api/views/missing', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'note', period: 'day', title: 'Missing', tags: [] }),
      });
      assert.equal(response.status, 404);
    } finally {
      await context.reset();
    }
  });
});

/** Groups saved-view delete behavior by its public command endpoint. */
test('DELETE /api/views', async (suite) => {
  await suite.test('rejects requests without an access token', async () => {
    assert.equal(
      (await getContext().fetch('/api/views', { method: 'DELETE', authenticated: false })).status,
      401,
    );
  });

  await suite.test('removes selected views', async () => {
    const context = getContext();
    try {
      const create = await context.fetch('/api/views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'task', period: 'day', title: 'Today', tags: [] }),
      });
      const created = (await create.json()) as { readonly value: { readonly id: string } };
      const response = await context.fetch('/api/views', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: [created.value.id] }),
      });
      assert.equal(response.status, 200);
      assert.equal((await context.fetch(`/api/views/${created.value.id}`)).status, 404);
    } finally {
      await context.reset();
    }
  });
  await suite.test('rejects a request without an identifier list', async () => {
    const context = getContext();
    try {
      const response = await context.fetch('/api/views', { method: 'DELETE' });
      assert.equal(response.status, 400);
    } finally {
      await context.reset();
    }
  });
});
