import { eq } from 'drizzle-orm';
import { userRefreshTokens } from '../../../database/schema';
import type { Database } from '../../Database';
import { userServiceFactory } from '../../user/services/user-service';
import type { AuthPrincipal, AuthService, AuthTokens, LoginInput, RefreshInput } from '../types';
import { verifyPassword } from './password-utils';
import { createToken, verifyToken } from './token-utils';

/** Limits access tokens so a stolen API credential has a short useful lifetime. */
const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000;
/** Limits refresh sessions to a bounded period even when they are not explicitly revoked. */
const REFRESH_TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

/** Issues and persists a token pair for one authenticated user session. */
const createSession = async (params: {
  readonly database: Database;
  readonly secret: string;
  readonly userId: string;
}): Promise<AuthTokens> => {
  const sessionId = crypto.randomUUID();
  const accessToken = await createToken({
    ...params,
    sessionId,
    kind: 'access',
    expiresInMs: ACCESS_TOKEN_LIFETIME_MS,
  });
  const refreshToken = await createToken({
    ...params,
    sessionId,
    kind: 'refresh',
    expiresInMs: REFRESH_TOKEN_LIFETIME_MS,
  });
  const now = new Date();
  await params.database.insert(userRefreshTokens).values({
    sessionId,
    userId: params.userId,
    refreshToken,
    createdAt: now,
    expiresAt: new Date(now.getTime() + REFRESH_TOKEN_LIFETIME_MS),
  });
  return { accessToken, refreshToken };
};

/** Builds the documented Auth service on top of user and session storage. */
export const authServiceFactory = (params: {
  readonly database: Database;
  readonly secret: string;
}): AuthService => ({
  login: async (input: LoginInput) => {
    const credentials = await userServiceFactory(params.database).findCredentials(input.identifier);
    if (credentials === null) {
      return null;
    }

    const validPassword = await verifyPassword({
      password: input.password,
      hash: credentials.passwordHash,
      salt: credentials.passwordSalt,
    });

    return validPassword ? createSession({ ...params, userId: credentials.id }) : null;
  },

  refresh: async (input: RefreshInput) => {
    const principal = await verifyToken({
      token: input.refreshToken,
      secret: params.secret,
      kind: 'refresh',
    });
    if (principal === null) {
      return null;
    }

    const session = await params.database
      .select()
      .from(userRefreshTokens)
      .where(eq(userRefreshTokens.sessionId, principal.sessionId))
      .get();
    const validSession =
      session !== undefined &&
      session.refreshToken === input.refreshToken &&
      session.expiresAt > new Date();
    if (!validSession) {
      return null;
    }

    await params.database
      .delete(userRefreshTokens)
      .where(eq(userRefreshTokens.sessionId, principal.sessionId));

    return createSession({ ...params, userId: principal.userId });
  },

  logout: async (input: RefreshInput) => {
    const principal = await verifyToken({
      token: input.refreshToken,
      secret: params.secret,
      kind: 'refresh',
    });
    if (principal !== null) {
      await params.database
        .delete(userRefreshTokens)
        .where(eq(userRefreshTokens.sessionId, principal.sessionId));
    }
  },

  me: async (principal: AuthPrincipal) =>
    userServiceFactory(params.database).getById(principal.userId),
});
