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
          taskTags: [],
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

  await suite.test('filters fixture tasks by title, status, and tag label', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/tasks?title=SHIP&status=inProgress&tags=Work');
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: readonly {
          readonly id: string;
          readonly tags: readonly string[];
          readonly status: string;
        }[];
      };

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.deepEqual(
        payload.value.map((task) => task.id),
        ['task-ship'],
      );
      assert.deepEqual(payload.value[0]?.tags, ['work']);
      assert.equal(payload.value[0]?.status, 'inProgress');
    } finally {
      await context.reset();
    }
  });

  await suite.test('returns an empty list when no task has the requested tag', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/tasks?tags=missing');
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

/** Fixed timestamps keep the filter fixture deterministic. */
const filterFixtureTime = new Date('2026-01-02T03:04:05.000Z');

/** Builds one owned task row for the filter scenarios. */
const filterTask = (params: {
  readonly id: string;
  readonly title: string;
  readonly dueTo: string | null;
  readonly description?: string;
}): {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly description: string | null;
  readonly dueTo: string | null;
  readonly status: 'undone';
  readonly createdAt: Date;
  readonly updatedAt: Date;
} => ({
  id: params.id,
  userId: 'e2e-test-user',
  title: params.title,
  description: params.description ?? null,
  dueTo: params.dueTo,
  status: 'undone',
  createdAt: filterFixtureTime,
  updatedAt: filterFixtureTime,
});

/**
 * Seeds tasks across a date range with `work` / `urgent` / `робота` tags and a `Work` view
 * (tags: work) plus a foreign view, so every filter combination has something to exclude.
 */
const seedFilterFixture = async (context: ApiTestContext): Promise<void> => {
  await seedOtherUser(context.database);
  await seedApiFixture({
    database: context.database,
    fixture: createApiFixture({
      tags: [
        { id: 'tag-work', userId: 'e2e-test-user', label: 'work', createdAt: filterFixtureTime },
        {
          id: 'tag-urgent',
          userId: 'e2e-test-user',
          label: 'urgent',
          createdAt: filterFixtureTime,
        },
        {
          id: 'tag-robota',
          userId: 'e2e-test-user',
          label: 'робота',
          createdAt: filterFixtureTime,
        },
        {
          id: 'tag-other',
          userId: 'e2e-other-user',
          label: 'work',
          createdAt: filterFixtureTime,
        },
      ],
      notes: [],
      tasks: [
        filterTask({ id: 'task-before', title: 'Before range', dueTo: '2026-11-01' }),
        filterTask({ id: 'task-start', title: 'Code review', dueTo: '2026-11-02' }),
        filterTask({ id: 'task-middle', title: 'Plan sprint', dueTo: '2026-11-05' }),
        filterTask({
          id: 'task-end',
          title: 'Weekend chores',
          dueTo: '2026-11-08',
          description: 'review the garden',
        }),
        filterTask({ id: 'task-after', title: 'After range', dueTo: '2026-11-09' }),
        filterTask({ id: 'task-undated', title: 'Someday review', dueTo: null }),
      ],
      expenses: [],
      views: [
        {
          id: 'view-work',
          userId: 'e2e-test-user',
          type: 'task',
          title: 'Work',
          createdAt: filterFixtureTime,
          updatedAt: filterFixtureTime,
        },
        {
          id: 'view-foreign',
          userId: 'e2e-other-user',
          type: 'task',
          title: 'Work',
          createdAt: filterFixtureTime,
          updatedAt: filterFixtureTime,
        },
      ],
      viewTags: [
        { viewId: 'view-work', tagId: 'tag-work' },
        { viewId: 'view-foreign', tagId: 'tag-other' },
      ],
      noteTags: [],
      noteTasks: [],
      taskLinks: [],
      taskNotes: [],
      taskTags: [
        { taskId: 'task-start', tagId: 'tag-work' },
        { taskId: 'task-start', tagId: 'tag-urgent' },
        { taskId: 'task-middle', tagId: 'tag-work' },
        { taskId: 'task-end', tagId: 'tag-urgent' },
        { taskId: 'task-undated', tagId: 'tag-work' },
        { taskId: 'task-undated', tagId: 'tag-urgent' },
        { taskId: 'task-after', tagId: 'tag-robota' },
      ],
    }),
  });
};

/** Requests the task list and returns the matched ids sorted for order-independent assertions. */
const listTaskIds = async (params: {
  readonly context: ApiTestContext;
  readonly query: string;
}): Promise<readonly string[]> => {
  const response = await params.context.fetch(`/api/tasks?${params.query}`);
  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    readonly value: readonly { readonly id: string }[];
  };
  return payload.value.map((task) => task.id).sort();
};

/** Groups the view, search, and date-range filters used by the tasks UI. */
test('GET /api/tasks filters', async (suite) => {
  /** Seeds the shared fixture, asserts one query, and always restores an empty database. */
  const expectTaskIds = async (params: {
    readonly query: string;
    readonly expected: readonly string[];
  }): Promise<void> => {
    const context = getContext();
    try {
      await seedFilterFixture(context);
      assert.deepEqual(
        await listTaskIds({ context, query: params.query }),
        [...params.expected].sort(),
      );
    } finally {
      await context.reset();
    }
  };

  await suite.test('keeps both inclusive range bounds and drops undated tasks', async () => {
    await expectTaskIds({
      query: 'dueFrom=2026-11-02&dueUntil=2026-11-08',
      expected: ['task-start', 'task-middle', 'task-end'],
    });
  });

  await suite.test('treats equal bounds as a single day', async () => {
    await expectTaskIds({
      query: 'dueFrom=2026-11-05&dueUntil=2026-11-05',
      expected: ['task-middle'],
    });
  });

  await suite.test('rejects a malformed range bound', async () => {
    const context = getContext();
    const response = await context.fetch('/api/tasks?dueFrom=nope');
    assert.equal(response.status, 400);
  });

  await suite.test('matches every tag of a view', async () => {
    await expectTaskIds({
      query: 'viewId=view-work',
      expected: ['task-start', 'task-middle', 'task-undated'],
    });
  });

  await suite.test('returns nothing for a foreign or unknown view', async () => {
    await expectTaskIds({ query: 'viewId=view-foreign', expected: [] });
    await expectTaskIds({ query: 'viewId=view-missing', expected: [] });
  });

  await suite.test('requires every requested tag', async () => {
    await expectTaskIds({ query: 'tags=work,urgent', expected: ['task-start', 'task-undated'] });
  });

  await suite.test('matches full labels only', async () => {
    await expectTaskIds({ query: 'tags=wor', expected: [] });
  });

  await suite.test('folds non-ASCII tag labels', async () => {
    await expectTaskIds({
      query: `tags=${encodeURIComponent('Робота')}`,
      expected: ['task-after'],
    });
  });

  await suite.test('matches titles partially, ignoring case and descriptions', async () => {
    await expectTaskIds({ query: 'title=REV', expected: ['task-start', 'task-undated'] });
  });

  await suite.test('combines a view with search text and tags', async () => {
    await expectTaskIds({
      query: 'viewId=view-work&title=review&tags=urgent',
      expected: ['task-start', 'task-undated'],
    });
  });

  await suite.test('combines a date range with tags', async () => {
    await expectTaskIds({
      query: 'dueFrom=2026-11-02&dueUntil=2026-11-08&tags=urgent',
      expected: ['task-start', 'task-end'],
    });
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

  await suite.test('creates a task with a lower-cased, deduped tag and a note', async () => {
    const context = getContext();

    try {
      await seedApiFixture({
        database: context.database,
        fixture: createApiFixture({ tasks: [], noteTasks: [], taskNotes: [], taskTags: [] }),
      });
      const response = await context.fetch('/api/tasks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Review release',
          description: null,
          tags: ['Work', 'work'],
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
          readonly tags: readonly string[];
          readonly linkedNoteIds: readonly string[];
        };
      };

      assert.equal(response.status, 201);
      assert.equal(payload.ok, true);
      assert.deepEqual(payload.value.tags, ['work']);
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
          tags: [],
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
          tags: ['work'],
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
          readonly tags: readonly string[];
          readonly status: string;
        };
      };

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.title, 'Ship API v2');
      assert.deepEqual(payload.value.tags, ['work']);
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
          tags: [],
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
      const listResponse = await context.fetch('/api/tasks?tags=work');
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
