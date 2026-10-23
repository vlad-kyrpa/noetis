import { strict as assert } from 'node:assert';
import { after, before, test } from 'node:test';
import { createApiTestContext, type ApiTestContext } from '../api-test-context';
import { createApiFixture, seedApiFixture } from '../fixtures';

/** Holds the one expensive Worker/D1 harness shared by this module's sequential API cases. */
const testState: { context: ApiTestContext | null } = { context: null };

/** Returns the started module harness or fails clearly if test lifecycle hooks are misconfigured. */
const getContext = (): ApiTestContext => {
  if (testState.context === null) {
    throw new Error('API test context was not started');
  }
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

/** Verifies a public write route persists data into the temporary D1 database. */
test('POST /api/tasks persists a task that can be read through the API', async () => {
  const context = getContext();

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
    assert.equal(listed.value.length, 1);
    assert.equal(listed.value[0]?.id, created.value.id);
    assert.equal(listed.value[0]?.title, 'Review release');
  } finally {
    await context.reset();
  }
});
