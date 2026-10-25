import type { MiddlewareHandler } from 'hono';
import type { ApiEnvironment } from '../../api';
import { failure } from '../../common/utils/result';
import { verifyToken } from '../services/token-utils';
import type { AuthPrincipal } from '../types';

/** Defines the Hono environment required by authenticated API routes. */
export type AuthRouteEnvironment = ApiEnvironment;

/** Extracts a bearer token only when the authorization header uses the expected scheme. */
const bearerToken = (authorization: string | undefined): string | null => {
  const [scheme, token, ...extra] = authorization?.split(' ') ?? [];
  return scheme === 'Bearer' && token !== undefined && extra.length === 0 ? token : null;
};

/** Verifies access tokens once before an authenticated HTTP handler executes. */
export const authMiddlewareFactory =
  (secret: string): MiddlewareHandler<AuthRouteEnvironment> =>
  async (context, next) => {
    const token = bearerToken(context.req.header('authorization'));
    const principal = token === null ? null : await verifyToken({ token, secret, kind: 'access' });
    if (principal === null) {
      return context.json(failure('Unauthorized'), 401);
    }

    context.set('authPrincipal', principal);
    await next();
  };

/** Reads the signing secret from one routed request before verifying its access token. */
export const accessAuthenticationMiddleware: MiddlewareHandler<AuthRouteEnvironment> = async (
  context,
  next,
) => authMiddlewareFactory(context.env.AUTH_TOKEN_SECRET)(context, next);

/** Validates the principal established by the authentication middleware before use. */
export const authenticatedPrincipal = (value: unknown): AuthPrincipal => {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('userId' in value) ||
    !('sessionId' in value) ||
    typeof value.userId !== 'string' ||
    typeof value.sessionId !== 'string'
  ) {
    throw new Error('Authentication middleware did not provide a valid principal');
  }
  return { userId: value.userId, sessionId: value.sessionId };
};
