import { strict as assert } from 'node:assert';
import { after, before, test } from 'node:test';
import { users } from '../../database/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../../modules/auth/services/password-utils';
import { createApiTestContext, type ApiTestContext } from '../api-test-context';

/** Holds the one expensive Worker/D1 harness shared by this module's sequential API cases. */
const testState: { context: ApiTestContext | null } = { context: null };
/** Defines an account credential used only by authentication integration tests. */
const password = 'correct horse battery staple';

/** Returns the started module harness or fails clearly if test lifecycle hooks are misconfigured. */
const getContext = (): ApiTestContext => {
  if (testState.context === null) throw new Error('Auth test context was not started');
  return testState.context;
};

/** Inserts a real password hash so login tests exercise the production verifier. */
const seedAuthUser = async (context: ApiTestContext): Promise<void> => {
  const credentials = await hashPassword(password);
  const now = new Date();
  await context.database.insert(users).values({
    id: 'user-auth',
    username: 'alex',
    email: 'alex@example.com',
    passwordHash: credentials.hash,
    passwordSalt: credentials.salt,
    createdAt: now,
    updatedAt: now,
  });
};

/** Starts and migrates the Worker once before this module's tests run. */
before(async (): Promise<void> => {
  testState.context = await createApiTestContext();
});

/** Stops the shared Worker only after every module test has completed. */
after(async (): Promise<void> => {
  if (testState.context !== null) await testState.context.close();
});

/** Groups session-start behavior by the login endpoint. */
test('POST /api/auth/login', async (suite) => {
  await suite.test('creates tokens for valid credentials', async () => {
    const context = getContext();
    try {
      await seedAuthUser(context);
      const response = await context.fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier: 'alex', password }),
      });
      const payload = (await response.json()) as {
        readonly ok: boolean;
        readonly value: { readonly accessToken: string; readonly refreshToken: string };
      };

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.equal(payload.value.accessToken.length > 0, true);
      assert.equal(payload.value.refreshToken.length > 0, true);
    } finally {
      await context.reset();
    }
  });

  await suite.test('rejects invalid credentials', async () => {
    const context = getContext();
    try {
      await seedAuthUser(context);
      const response = await context.fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier: 'alex', password: 'wrong password' }),
      });

      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), { ok: false, error: 'Invalid credentials' });
    } finally {
      await context.reset();
    }
  });
});

/** Verifies the current-user endpoint cannot expose profile data without an access token. */
test('GET /api/auth/me rejects requests without an access token', async () => {
  const context = getContext();
  try {
    const response = await context.fetch('/api/auth/me', { authenticated: false });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { ok: false, error: 'Unauthorized' });
  } finally {
    await context.reset();
  }
});

/** Groups authenticated reads and the refresh-token lifecycle together. */
test('auth session lifecycle', async () => {
  const context = getContext();
  try {
    await seedAuthUser(context);
    const loginResponse = await context.fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifier: 'alex@example.com', password }),
    });
    const loginPayload = (await loginResponse.json()) as {
      readonly value: { readonly accessToken: string; readonly refreshToken: string };
    };
    const meResponse = await context.fetch('/api/auth/me', {
      headers: { authorization: `Bearer ${loginPayload.value.accessToken}` },
    });
    const refreshResponse = await context.fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: loginPayload.value.refreshToken }),
    });
    const refreshPayload = (await refreshResponse.json()) as {
      readonly value: { readonly refreshToken: string };
    };
    const logoutResponse = await context.fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshPayload.value.refreshToken }),
    });
    const revokedResponse = await context.fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshPayload.value.refreshToken }),
    });

    assert.equal(loginResponse.status, 200);
    assert.equal(meResponse.status, 200);
    assert.deepEqual(await meResponse.json(), {
      ok: true,
      value: {
        id: 'user-auth',
        username: 'alex',
        email: 'alex@example.com',
        createdAt: (
          await context.database.select().from(users).where(eq(users.id, 'user-auth')).get()
        )?.createdAt.toJSON(),
        updatedAt: (
          await context.database.select().from(users).where(eq(users.id, 'user-auth')).get()
        )?.updatedAt.toJSON(),
      },
    });
    assert.equal(refreshResponse.status, 200);
    assert.equal(logoutResponse.status, 200);
    assert.equal(revokedResponse.status, 401);
  } finally {
    await context.reset();
  }
});
