import type { AuthPrincipal } from '../types';

/** Distinguishes short-lived API credentials from long-lived session credentials. */
type TokenKind = 'access' | 'refresh';

/** Defines the signed data carried by every authentication token. */
interface TokenPayload extends AuthPrincipal {
  readonly kind: TokenKind;
  readonly expiresAt: number;
}
/** Defines token issuance parameters so expiry and token kind remain explicit. */
interface CreateTokenParams extends AuthPrincipal {
  readonly secret: string;
  readonly kind: TokenKind;
  readonly expiresInMs: number;
}

/** Encodes text as URL-safe base64 without relying on Node-only APIs. */
const encode = (value: string): string =>
  btoa(value).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');

/** Decodes URL-safe base64 text back into its original representation. */
const decode = (value: string): string =>
  atob(
    value
      .replaceAll('-', '+')
      .replaceAll('_', '/')
      .padEnd(Math.ceil(value.length / 4) * 4, '='),
  );

/** Fails early with setup guidance instead of passing an empty key to Web Crypto. */
const configuredSecret = (secret: string): string => {
  if (secret.trim().length === 0) {
    throw new Error('AUTH_TOKEN_SECRET must be configured with a non-empty value');
  }
  return secret;
};

/** Imports the configured secret as an HMAC verification key. */
const signingKey = (secret: string): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(configuredSecret(secret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );

/** Signs a serialized payload with the configured HMAC key. */
const signature = async (params: {
  readonly value: string;
  readonly secret: string;
}): Promise<string> =>
  encode(
    String.fromCharCode(
      ...new Uint8Array(
        await crypto.subtle.sign(
          'HMAC',
          await signingKey(params.secret),
          new TextEncoder().encode(params.value),
        ),
      ),
    ),
  );

/** Creates a compact signed token for one session principal. */
export const createToken = async (params: CreateTokenParams): Promise<string> => {
  const payload: TokenPayload = {
    userId: params.userId,
    sessionId: params.sessionId,
    kind: params.kind,
    expiresAt: Date.now() + params.expiresInMs,
  };
  const body = encode(JSON.stringify(payload));
  return `${body}.${await signature({ value: body, secret: params.secret })}`;
};

/** Verifies one token's signature, kind, and expiry before exposing its principal. */
export const verifyToken = async (params: {
  readonly token: string;
  readonly secret: string;
  readonly kind: TokenKind;
}): Promise<AuthPrincipal | null> => {
  const [body, suppliedSignature, ...extra] = params.token.split('.');
  if (body === undefined || suppliedSignature === undefined || extra.length > 0) {
    return null;
  }

  const expectedSignature = await signature({ value: body, secret: params.secret });
  if (expectedSignature !== suppliedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(decode(body)) as TokenPayload;
    return payload.kind === params.kind &&
      payload.expiresAt > Date.now() &&
      typeof payload.userId === 'string' &&
      typeof payload.sessionId === 'string'
      ? { userId: payload.userId, sessionId: payload.sessionId }
      : null;
  } catch {
    return null;
  }
};
