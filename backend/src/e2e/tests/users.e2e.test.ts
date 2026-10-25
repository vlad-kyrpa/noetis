import { strict as assert } from 'node:assert';
import { after, before, test } from 'node:test';
import { createApiTestContext, type ApiTestContext } from '../api-test-context';

/** Holds the one expensive Worker/D1 harness shared by this module's sequential API cases. */
const testState: { context: ApiTestContext | null } = { context: null };

/** Defines a valid user command without exposing actual credential values in each test. */
const userInput = {
  username: 'alex',
  email: 'alex@example.com',
  password: 'correct horse battery staple',
} as const;

/** Returns the started module harness or fails clearly if test lifecycle hooks are misconfigured. */
const getContext = (): ApiTestContext => {
  if (testState.context === null) {
    throw new Error('Users test context was not started');
  }
  return testState.context;
};

/** Creates one user through its public endpoint for scenarios that require durable state. */
const createUser = async (context: ApiTestContext): Promise<string> => {
  const response = await context.fetch('/api/users', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(userInput),
  });
  const payload = (await response.json()) as {
    readonly value: { readonly id: string };
  };

  assert.equal(response.status, 201);
  return payload.value.id;
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

/** Groups user-create behavior by its public write endpoint. */
test('POST /api/users', async (suite) => {
  await suite.test('creates a user without returning credential material', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(userInput),
      });
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: Record<string, unknown>;
      };

      assert.equal(response.status, 201);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.username, 'alex');
      assert.equal(payload.value.email, 'alex@example.com');
      assert.equal('password' in payload.value, false);
    } finally {
      await context.reset();
    }
  });

  await suite.test('allows registration without an access token', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/users', {
        authenticated: false,
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(userInput),
      });

      assert.equal(response.status, 201);
    } finally {
      await context.reset();
    }
  });

  await suite.test('rejects duplicate usernames or emails', async () => {
    const context = getContext();

    try {
      await createUser(context);
      const response = await context.fetch('/api/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...userInput, email: 'different@example.com' }),
      });

      assert.equal(response.status, 409);
      assert.deepEqual(await response.json(), {
        ok: false,
        error: 'Username or email already exists',
      });
    } finally {
      await context.reset();
    }
  });

  await suite.test('rejects malformed user credentials', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...userInput, email: 'not-an-email', password: 'short' }),
      });

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { ok: false, error: 'Invalid request' });
    } finally {
      await context.reset();
    }
  });
});

/** Groups user retrieval behavior by its public read endpoint. */
test('GET /api/users/:id', async (suite) => {
  await suite.test('returns a user without credential material', async () => {
    const context = getContext();

    try {
      const id = await createUser(context);
      const response = await context.fetch(`/api/users/${id}`);
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: Record<string, unknown>;
      };

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.id, id);
      assert.equal('passwordHash' in payload.value, false);
      assert.equal('passwordSalt' in payload.value, false);
    } finally {
      await context.reset();
    }
  });

  await suite.test('returns not found for an unknown user', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/users/missing');

      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { ok: false, error: 'User not found' });
    } finally {
      await context.reset();
    }
  });

  await suite.test('requires an access token', async () => {
    const context = getContext();

    try {
      const id = await createUser(context);
      const response = await context.fetch(`/api/users/${id}`, { authenticated: false });

      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), { ok: false, error: 'Unauthorized' });
    } finally {
      await context.reset();
    }
  });
});

/** Groups user-replacement behavior by its public write endpoint. */
test('PUT /api/users/:id', async (suite) => {
  await suite.test('rejects requests without an access token', async () => {
    assert.equal(
      (await getContext().fetch('/api/users/user-id', { method: 'PUT', authenticated: false }))
        .status,
      401,
    );
  });

  await suite.test('updates an existing user and keeps credential fields private', async () => {
    const context = getContext();

    try {
      const id = await createUser(context);
      const response = await context.fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...userInput, username: 'sam', email: 'sam@example.com' }),
      });
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: Record<string, unknown>;
      };

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.username, 'sam');
      assert.equal(payload.value.email, 'sam@example.com');
      assert.equal('passwordHash' in payload.value, false);
    } finally {
      await context.reset();
    }
  });

  await suite.test('rejects an update that duplicates another user identity', async () => {
    const context = getContext();

    try {
      await createUser(context);
      const secondResponse = await context.fetch('/api/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...userInput, username: 'sam', email: 'sam@example.com' }),
      });
      const secondPayload = (await secondResponse.json()) as {
        readonly value: { readonly id: string };
      };
      const response = await context.fetch(`/api/users/${secondPayload.value.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(userInput),
      });

      assert.equal(response.status, 409);
      assert.deepEqual(await response.json(), {
        ok: false,
        error: 'Username or email already exists',
      });
    } finally {
      await context.reset();
    }
  });

  await suite.test('returns not found for an unknown user', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/users/missing', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(userInput),
      });

      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { ok: false, error: 'User not found' });
    } finally {
      await context.reset();
    }
  });
});

/** Groups user-deletion behavior by its public command endpoint. */
test('DELETE /api/users', async (suite) => {
  await suite.test('rejects requests without an access token', async () => {
    assert.equal(
      (await getContext().fetch('/api/users', { method: 'DELETE', authenticated: false })).status,
      401,
    );
  });

  await suite.test('removes selected users', async () => {
    const context = getContext();

    try {
      const id = await createUser(context);
      const deleteResponse = await context.fetch('/api/users', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      const getResponse = await context.fetch(`/api/users/${id}`);

      assert.equal(deleteResponse.status, 200);
      assert.equal(getResponse.status, 404);
    } finally {
      await context.reset();
    }
  });

  await suite.test('rejects a delete request without user identifiers', async () => {
    const context = getContext();

    try {
      const response = await context.fetch('/api/users', { method: 'DELETE' });

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { ok: false, error: 'Invalid request' });
    } finally {
      await context.reset();
    }
  });
});
