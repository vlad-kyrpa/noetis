import { strict as assert } from 'node:assert';
import { after, before, test } from 'node:test';
import { createApiTestContext, type ApiTestContext } from '../api-test-context';
import { createApiFixture, seedApiFixture, seedOtherUser } from '../fixtures';

/** Holds the Worker/D1 harness shared by this module's sequential API cases. */
const testState: { context: ApiTestContext | null } = { context: null };

/** Returns the started module harness or reports an invalid test lifecycle. */
const getContext = (): ApiTestContext => {
  if (testState.context === null) {
    throw new Error('Tasks test context was not started');
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

/** Groups task-list behavior by its public read endpoint. */
test('GET /api/tasks', async (suite) => {
  await suite.test('rejects requests without an access token', async () => {
    assert.equal((await getContext().fetch('/api/tasks', { authenticated: false })).status, 401);
  });

  await suite.test("does not return another user's task", async () => {
    const context = getContext();
    try {
      await seedOtherUser(context.database);
      await seedApiFixture({
        database: context.database,
        fixture: createApiFixture({
          tags: [],
          notes: [],
          tasks: [
            {
              id: 'other-task',
              userId: 'e2e-other-user',
              title: 'Private',
              description: null,
              tagId: null,
              dueTo: null,
              status: 'undone',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          expenses: [],
          noteTags: [],
          noteTasks: [],
          taskLinks: [],
          taskNotes: [],
        }),
      });
      const payload = (await (await context.fetch('/api/tasks')).json()) as {
        readonly value: readonly unknown[];
      };
      assert.deepEqual(payload.value, []);
    } finally {
      await context.reset();
    }
  });

  await suite.test('filters fixture tasks by title, status, and tag', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch(
        '/api/tasks?title=SHIP&status=inProgress&tagId=tag-work',
      );
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: readonly {
          readonly id: string;
          readonly tagId: string | null;
          readonly status: string;
        }[];
      };

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.deepEqual(
        payload.value.map((task) => task.id),
        ['task-ship'],
      );
      assert.equal(payload.value[0]?.tagId, 'tag-work');
      assert.equal(payload.value[0]?.status, 'inProgress');
    } finally {
      await context.reset();
    }
  });

  await suite.test('returns an empty list when no task has the requested tag', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/tasks?tagId=tag-missing');
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

  await suite.test('rejects an unknown status filter', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/tasks?status=invalid');

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { ok: false, error: 'Invalid request' });
    } finally {
      await context.reset();
    }
  });
});

/** Groups single-task lookup behavior by its public read endpoint. */
test('GET /api/tasks/:id', async (suite) => {
  await suite.test('rejects requests without an access token', async () => {
    assert.equal(
      (await getContext().fetch('/api/tasks/task-id', { authenticated: false })).status,
      401,
    );
  });

  await suite.test('returns the selected fixture task and its note relationship', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/tasks/task-ship');
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: { readonly id: string; readonly linkedNoteIds: readonly string[] };
      };

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.id, 'task-ship');
      assert.deepEqual(payload.value.linkedNoteIds, ['note-plan']);
    } finally {
      await context.reset();
    }
  });

  await suite.test('returns not found for an unknown task', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/tasks/task-missing');

      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { ok: false, error: 'Task not found' });
    } finally {
      await context.reset();
    }
  });
});

/** Groups task-create behavior by its public write endpoint. */
test('POST /api/tasks', async (suite) => {
  await suite.test('rejects requests without an access token', async () => {
    assert.equal(
      (await getContext().fetch('/api/tasks', { method: 'POST', authenticated: false })).status,
      401,
    );
  });

  await suite.test('creates a task associated with an existing tag and note', async () => {
    const context = getContext();

    try {
      await seedApiFixture({
        database: context.database,
        fixture: createApiFixture({ tasks: [], noteTasks: [], taskNotes: [] }),
      });
      const response = await context.fetch('/api/tasks', {
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
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: {
          readonly id: string;
          readonly tagId: string | null;
          readonly linkedNoteIds: readonly string[];
        };
      };

      assert.equal(response.status, 201);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.tagId, 'tag-work');
      assert.deepEqual(payload.value.linkedNoteIds, ['note-plan']);
    } finally {
      await context.reset();
    }
  });

  await suite.test('rejects a task with a blank title', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/tasks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: '',
          description: null,
          tagId: null,
          dueTo: null,
          status: 'undone',
          linkedTaskIds: [],
          linkedNoteIds: [],
        }),
      });

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { ok: false, error: 'Invalid request' });
    } finally {
      await context.reset();
    }
  });
});

/** Groups task-replacement behavior by its public write endpoint. */
test('PUT /api/tasks/:id', async (suite) => {
  await suite.test('rejects requests without an access token', async () => {
    assert.equal(
      (await getContext().fetch('/api/tasks/task-id', { method: 'PUT', authenticated: false }))
        .status,
      401,
    );
  });

  await suite.test('updates an existing task while preserving its tag association', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/tasks/task-ship', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Ship API v2',
          description: 'Ready to deploy.',
          tagId: 'tag-work',
          dueTo: '2026-03-01',
          status: 'done',
          linkedTaskIds: [],
          linkedNoteIds: ['note-plan'],
        }),
      });
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: {
          readonly title: string;
          readonly tagId: string | null;
          readonly status: string;
        };
      };

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.title, 'Ship API v2');
      assert.equal(payload.value.tagId, 'tag-work');
      assert.equal(payload.value.status, 'done');
    } finally {
      await context.reset();
    }
  });

  await suite.test('returns not found for an unknown task', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/tasks/task-missing', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Missing',
          description: null,
          tagId: null,
          dueTo: null,
          status: 'undone',
          linkedTaskIds: [],
          linkedNoteIds: [],
        }),
      });

      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { ok: false, error: 'Task not found' });
    } finally {
      await context.reset();
    }
  });
});

/** Groups task-delete behavior by its public command endpoint. */
test('DELETE /api/tasks', async (suite) => {
  await suite.test('rejects requests without an access token', async () => {
    assert.equal(
      (await getContext().fetch('/api/tasks', { method: 'DELETE', authenticated: false })).status,
      401,
    );
  });

  await suite.test('removes selected fixture tasks', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const deleteResponse = await context.fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: ['task-ship'] }),
      });
      const listResponse = await context.fetch('/api/tasks?tagId=tag-work');
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
      const response = await context.fetch('/api/tasks', { method: 'DELETE' });

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { ok: false, error: 'Invalid request' });
    } finally {
      await context.reset();
    }
  });
});

/** Groups task-link command authorization checks beside the module's other endpoint coverage. */
test('POST /api/tasks/:id/links', async (suite) => {
  await suite.test('rejects note-title linking without an access token', async () => {
    const response = await getContext().fetch('/api/tasks/task-id/links/note-by-title', {
      method: 'POST',
      authenticated: false,
    });

    assert.equal(response.status, 401);
  });

  await suite.test('rejects task-title linking without an access token', async () => {
    const response = await getContext().fetch('/api/tasks/task-id/links/task-by-title', {
      method: 'POST',
      authenticated: false,
    });

    assert.equal(response.status, 401);
  });
});
