import { strict as assert } from 'node:assert';
import { after, before, test } from 'node:test';
import { createApiTestContext, type ApiTestContext } from '../api-test-context';
import { createApiFixture, seedApiFixture } from '../fixtures';

/** Holds the one expensive Worker/D1 harness shared by this module's sequential API cases. */
const testState: { context: ApiTestContext | null } = { context: null };

/** Returns the started module harness or fails clearly if test lifecycle hooks are misconfigured. */
const getContext = (): ApiTestContext => {
  if (testState.context === null) {
    throw new Error('Tags test context was not started');
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

/** Groups tag-list behavior by its public read endpoint. */
test('GET /api/tags', async (suite) => {
  await suite.test('returns fixture tags matching a case-insensitive label filter', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/tags?label=WORK');
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: readonly { readonly id: string; readonly label: string }[];
      };

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.length, 1);
      assert.equal(payload.value[0]?.id, 'tag-work');
      assert.equal(payload.value[0]?.label, 'work');
    } finally {
      await context.reset();
    }
  });

  await suite.test('returns an empty list when no tag matches the filter', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/tags?label=missing');
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

/** Groups tag-create behavior by its public write endpoint. */
test('POST /api/tags', async (suite) => {
  await suite.test('creates a trimmed label that can be found through the API', async () => {
    const context = getContext();

    try {
      const createResponse = await context.fetch('/api/tags', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label: '  personal  ' }),
      });
      const created = (await createResponse.json()) as {
        readonly ok: boolean;
        readonly value: { readonly id: string; readonly label: string };
      };
      const listResponse = await context.fetch('/api/tags?label=personal');
      const listed = (await listResponse.json()) as {
        readonly ok: boolean;
        readonly value: readonly { readonly id: string; readonly label: string }[];
      };

      assert.equal(createResponse.status, 201);
      assert.equal(created.ok, true);
      assert.equal(created.value.label, 'personal');
      assert.equal(listResponse.status, 200);
      assert.equal(listed.ok, true);
      assert.equal(listed.value.length, 1);
      assert.equal(listed.value[0]?.id, created.value.id);
      assert.equal(listed.value[0]?.label, 'personal');
    } finally {
      await context.reset();
    }
  });

  await suite.test('rejects a blank label', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/tags', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label: '   ' }),
      });

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { ok: false, error: 'Invalid request' });
    } finally {
      await context.reset();
    }
  });

  await suite.test('rejects a label that already exists', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/tags', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label: 'work' }),
      });

      assert.equal(response.status, 409);
      assert.deepEqual(await response.json(), { ok: false, error: 'Tag label already exists' });
    } finally {
      await context.reset();
    }
  });
});

/** Groups tag-delete behavior by its public command endpoint. */
test('DELETE /api/tags', async (suite) => {
  await suite.test('removes selected fixture tags', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const deleteResponse = await context.fetch('/api/tags', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: ['tag-work'] }),
      });
      const listResponse = await context.fetch('/api/tags?label=work');
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
      const response = await context.fetch('/api/tags', { method: 'DELETE' });

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { ok: false, error: 'Invalid request' });
    } finally {
      await context.reset();
    }
  });
});
