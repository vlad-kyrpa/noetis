import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createApiTestContext } from './api-test-context';
import { createApiFixture, seedApiFixture } from './fixtures';

/** Verifies an API query reads records and relationships from a migrated local D1 database. */
test('GET /api/notes filters seeded records and returns their relationships', async () => {
  const context = await createApiTestContext();

  try {
    await seedApiFixture({ database: context.database, fixture: createApiFixture() });
    const response = await context.fetch('/api/notes?tagId=tag-work');
    const payload = (await response.json()) as {
      readonly ok: boolean;
      readonly value: readonly {
        readonly id: string;
        readonly tagIds: readonly string[];
        readonly linkedTaskIds: readonly string[];
      }[];
    };

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.deepEqual(payload.value, [
      { id: 'note-plan', tagIds: ['tag-work'], linkedTaskIds: ['task-ship'] },
    ]);
  } finally {
    await context.close();
  }
});

/** Verifies a public write route persists data into the temporary D1 database. */
test('POST /api/tasks persists a task that can be read through the API', async () => {
  const context = await createApiTestContext();

  try {
    await seedApiFixture({
      database: context.database,
      fixture: createApiFixture({ tasks: [], noteTasks: [], taskNotes: [] }),
    });
    const createResponse = await context.fetch('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Review release',
        description: null,
        tagId: 'tag-work',
        dueTo: null,
        status: 'undone',
        linkedTaskIds: [],
        linkedNoteIds: ['note-plan'],
      }),
    });
    const created = (await createResponse.json()) as {
      readonly ok: boolean;
      readonly value: { readonly id: string; readonly linkedNoteIds: readonly string[] };
    };
    const listResponse = await context.fetch('/api/tasks?title=review');
    const listed = (await listResponse.json()) as {
      readonly ok: boolean;
      readonly value: readonly { readonly id: string; readonly title: string }[];
    };

    assert.equal(createResponse.status, 201);
    assert.equal(created.ok, true);
    assert.deepEqual(created.value.linkedNoteIds, ['note-plan']);
    assert.equal(listResponse.status, 200);
    assert.equal(listed.ok, true);
    assert.deepEqual(listed.value, [{ id: created.value.id, title: 'Review release' }]);
  } finally {
    await context.close();
  }
});
