import { strict as assert } from 'node:assert';
import { after, before, test } from 'node:test';
import { createApiTestContext, type ApiTestContext } from '../api-test-context';
import { createApiFixture, seedApiFixture, seedOtherUser } from '../fixtures';

/** Holds the one expensive Worker/D1 harness shared by this module's sequential API cases. */
const testState: { context: ApiTestContext | null } = { context: null };

/** Returns the started module harness or fails clearly if test lifecycle hooks are misconfigured. */
const getContext = (): ApiTestContext => {
  if (testState.context === null) {
    throw new Error('Notes test context was not started');
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

/** Groups note-list behavior by its public read endpoint. */
test('GET /api/notes', async (suite) => {
  await suite.test('rejects requests without an access token', async () => {
    assert.equal((await getContext().fetch('/api/notes', { authenticated: false })).status, 401);
  });

  await suite.test('does not return another user\'s note', async () => {
    const context = getContext();
    try {
      await seedOtherUser(context.database);
      await seedApiFixture({ database: context.database, fixture: createApiFixture({ tags: [], notes: [{ id: 'other-note', userId: 'e2e-other-user', title: 'Private', body: 'Private', createdAt: new Date(), updatedAt: new Date() }], tasks: [], expenses: [], noteTags: [], noteTasks: [], taskLinks: [], taskNotes: [] }) });
      const payload = (await (await context.fetch('/api/notes')).json()) as { readonly value: readonly unknown[] };
      assert.deepEqual(payload.value, []);
    } finally { await context.reset(); }
  });

  await suite.test('returns fixture records and their relationships', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/notes?tag=work');
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: readonly {
          readonly id: string;
          readonly body?: string;
          readonly tags: readonly string[];
          readonly linkedTaskIds: readonly string[];
        }[];
      };

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.length, 1);
      assert.equal(payload.value[0]?.id, 'note-plan');
      assert.equal(payload.value[0]?.body, undefined);
      assert.deepEqual(payload.value[0]?.tags, ['work']);
      assert.deepEqual(payload.value[0]?.linkedTaskIds, ['task-ship']);
    } finally {
      await context.reset();
    }
  });

  await suite.test('returns an empty list when no note matches a tag', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/notes?tag=missing');
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

  await suite.test('matches title fragments without regard to letter case', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/notes?title=PROJECT');
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: readonly { readonly id: string; readonly title: string }[];
      };

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.length, 1);
      assert.equal(payload.value[0]?.id, 'note-plan');
      assert.equal(payload.value[0]?.title, 'Project plan');
    } finally {
      await context.reset();
    }
  });

  await suite.test('matches body fragments without regard to letter case', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/notes?body=MILESTONES');
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: readonly { readonly id: string; readonly body?: string }[];
      };

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.length, 1);
      assert.equal(payload.value[0]?.id, 'note-plan');
      assert.equal(payload.value[0]?.body, undefined);
    } finally {
      await context.reset();
    }
  });

  await suite.test('applies tag, title, and body filters together', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/notes?tag=work&title=PROJECT&body=MILESTONES');
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: readonly { readonly id: string }[];
      };

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.deepEqual(
        payload.value.map((note) => note.id),
        ['note-plan'],
      );
    } finally {
      await context.reset();
    }
  });
});

/** Groups single-note lookup behavior by its public read endpoint. */
test('GET /api/notes/:id', async (suite) => {
  await suite.test('rejects requests without an access token', async () => {
    assert.equal(
      (await getContext().fetch('/api/notes/note-id', { authenticated: false })).status,
      401,
    );
  });

  await suite.test('returns the selected fixture note', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/notes/note-plan');
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: { readonly id: string; readonly title: string };
      };

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.id, 'note-plan');
      assert.equal(payload.value.title, 'Project plan');
    } finally {
      await context.reset();
    }
  });

  await suite.test('returns not found for an unknown note', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/notes/note-missing');

      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { ok: false, error: 'Note not found' });
    } finally {
      await context.reset();
    }
  });

  await suite.test('returns not found for another user\'s note', async () => {
    const context = getContext();

    try {
      await seedOtherUser(context.database);
      await seedApiFixture({
        database: context.database,
        fixture: createApiFixture({
          tags: [],
          notes: [{
            id: 'other-note',
            userId: 'e2e-other-user',
            title: 'Private note',
            body: 'This is not visible to the test user.',
            createdAt: new Date(),
            updatedAt: new Date(),
          }],
          tasks: [],
          expenses: [],
          views: [],
          viewTags: [],
          noteTags: [],
          noteTasks: [],
          taskLinks: [],
          taskNotes: [],
        }),
      });

      const response = await context.fetch('/api/notes/other-note');

      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { ok: false, error: 'Note not found' });
    } finally {
      await context.reset();
    }
  });
});

/** Groups note-create behavior by its public write endpoint. */
test('POST /api/notes', async (suite) => {
  await suite.test('rejects requests without an access token', async () => {
    assert.equal(
      (await getContext().fetch('/api/notes', { method: 'POST', authenticated: false })).status,
      401,
    );
  });

  await suite.test(
    'reuses existing labels and creates missing labels for note relationships',
    async () => {
      const context = getContext();

      try {
        await seedApiFixture({ database: context.database, fixture: createApiFixture() });
        const response = await context.fetch('/api/notes', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title: 'Release checklist',
            body: 'Confirm migrations are applied.',
            tags: ['work', 'release'],
            linkedTaskIds: ['task-ship'],
            linkedNoteIds: [],
          }),
        });
        const payload = (await response.json()) as {
          readonly ok: boolean;
          readonly value: {
            readonly title: string;
            readonly tags: readonly string[];
            readonly linkedTaskIds: readonly string[];
          };
        };
        const tagsResponse = await context.fetch('/api/tags');
        const storedTags = (await tagsResponse.json()) as {
          readonly ok: boolean;
          readonly value: readonly { readonly label: string }[];
        };

        assert.equal(response.status, 201);
        assert.equal(payload.ok, true);
        assert.equal(payload.value.title, 'Release checklist');
        assert.deepEqual([...payload.value.tags].sort(), ['release', 'work']);
        assert.deepEqual(payload.value.linkedTaskIds, ['task-ship']);
        assert.equal(tagsResponse.status, 200);
        assert.equal(storedTags.ok, true);
        assert.equal(
          storedTags.value.some((tag) => tag.label === 'work'),
          true,
        );
        assert.equal(
          storedTags.value.some((tag) => tag.label === 'release'),
          true,
        );
      } finally {
        await context.reset();
      }
    },
  );

  await suite.test('rejects a note with a blank title', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/notes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: '',
          body: '',
          tags: [],
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

/** Groups note-replacement behavior by its public write endpoint. */
test('PUT /api/notes/:id', async (suite) => {
  await suite.test('rejects requests without an access token', async () => {
    assert.equal(
      (await getContext().fetch('/api/notes/note-id', { method: 'PUT', authenticated: false }))
        .status,
      401,
    );
  });

  await suite.test('updates an existing fixture note', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const response = await context.fetch('/api/notes/note-plan', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated plan',
          body: 'The milestones are ready.',
          tags: ['work'],
          linkedTaskIds: [],
          linkedNoteIds: [],
        }),
      });
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: { readonly id: string; readonly title: string; readonly body: string };
      };

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.id, 'note-plan');
      assert.equal(payload.value.title, 'Updated plan');
      assert.equal(payload.value.body, 'The milestones are ready.');
    } finally {
      await context.reset();
    }
  });

  await suite.test('returns not found for an unknown note', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/notes/note-missing', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Missing',
          body: '',
          tags: [],
          linkedTaskIds: [],
          linkedNoteIds: [],
        }),
      });

      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { ok: false, error: 'Note not found' });
    } finally {
      await context.reset();
    }
  });
});

/** Groups note-delete behavior by its public command endpoint. */
test('DELETE /api/notes', async (suite) => {
  await suite.test('rejects requests without an access token', async () => {
    assert.equal(
      (await getContext().fetch('/api/notes', { method: 'DELETE', authenticated: false })).status,
      401,
    );
  });

  await suite.test('removes selected fixture notes', async () => {
    const context = getContext();

    try {
      await seedApiFixture({ database: context.database, fixture: createApiFixture() });
      const deleteResponse = await context.fetch('/api/notes', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: ['note-plan'] }),
      });
      const listResponse = await context.fetch('/api/notes?tag=work');
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
      const response = await context.fetch('/api/notes', { method: 'DELETE' });

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { ok: false, error: 'Invalid request' });
    } finally {
      await context.reset();
    }
  });
});
