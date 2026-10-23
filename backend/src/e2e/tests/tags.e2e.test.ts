import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createApiTestContext } from '../api-test-context';
import { createApiFixture, seedApiFixture } from '../fixtures';

/** Groups tag-list behavior by its public read endpoint. */
test('GET /api/tags', async (suite) => {
  await suite.test('returns fixture tags matching a case-insensitive label filter', async () => {
    const context = await createApiTestContext();

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
      await context.close();
    }
  });

  await suite.test('returns an empty list when no tag matches the filter', async () => {
    const context = await createApiTestContext();

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
      await context.close();
    }
  });
});

/** Groups tag-create behavior by its public write endpoint. */
test('POST /api/tags', async (suite) => {
  await suite.test('creates a trimmed label that can be found through the API', async () => {
    const context = await createApiTestContext();

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
      await context.close();
    }
  });

  await suite.test('rejects a blank label', async () => {
    const context = await createApiTestContext();

    try {
      const response = await context.fetch('/api/tags', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label: '   ' }),
      });

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { ok: false, error: 'Invalid request' });
    } finally {
      await context.close();
    }
  });

  await suite.test('rejects a label that already exists', async () => {
    const context = await createApiTestContext();

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
      await context.close();
    }
  });
});

/** Groups tag-delete behavior by its public command endpoint. */
test('DELETE /api/tags', async (suite) => {
  await suite.test('removes selected fixture tags', async () => {
    const context = await createApiTestContext();

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
      await context.close();
    }
  });

  await suite.test('rejects a request without an identifier list', async () => {
    const context = await createApiTestContext();

    try {
      const response = await context.fetch('/api/tags', { method: 'DELETE' });

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { ok: false, error: 'Invalid request' });
    } finally {
      await context.close();
    }
  });
});
