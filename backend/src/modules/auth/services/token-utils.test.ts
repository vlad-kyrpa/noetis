import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createToken, verifyToken } from './token-utils';

/** Uses a deterministic test-only signing secret without coupling tests to Worker bindings. */
const secret = 'token-utils-test-secret';

/** Verifies a signed token exposes only the expected principal for its intended kind. */
test('verifyToken accepts a current token with the expected kind', async () => {
  const token = await createToken({
    secret,
    userId: 'user-1',
    sessionId: 'session-1',
    kind: 'access',
    expiresInMs: 60_000,
  });

  assert.deepEqual(await verifyToken({ token, secret, kind: 'access' }), {
    userId: 'user-1',
    sessionId: 'session-1',
  });
});

/** Verifies tokens cannot be repurposed between access and refresh endpoints. */
test('verifyToken rejects a token with the wrong kind', async () => {
  const token = await createToken({
    secret,
    userId: 'user-1',
    sessionId: 'session-1',
    kind: 'refresh',
    expiresInMs: 60_000,
  });

  assert.equal(await verifyToken({ token, secret, kind: 'access' }), null);
});

/** Verifies signature tampering and expired credentials do not authenticate a request. */
test('verifyToken rejects tampered and expired tokens', async () => {
  const token = await createToken({
    secret,
    userId: 'user-1',
    sessionId: 'session-1',
    kind: 'access',
    expiresInMs: -1,
  });
  const tamperedToken = `${token}tampered`;

  assert.equal(await verifyToken({ token, secret, kind: 'access' }), null);
  assert.equal(await verifyToken({ token: tamperedToken, secret, kind: 'access' }), null);
});
