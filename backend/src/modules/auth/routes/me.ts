import { failure, success } from '../../common/utils/result';
import type { Context } from 'hono';
import type { ApiEnvironment } from '../../api';
import type { RouteHandlerDependencies } from '../../common/types';
import { authenticatedPrincipal } from '../middleware/auth-middleware';
import { authServiceFactory } from '../services/auth-service';

/** Describes the typed Hono context shared by the authenticated profile route and its middleware. */
type MeContext = Context<ApiEnvironment>;

/** Creates the authenticated handler that returns the current public user profile. */
export const meHandler =
  (dependencies: RouteHandlerDependencies) =>
  async (context: MeContext): Promise<Response> => {
    const { DB, AUTH_TOKEN_SECRET: secret } = context.env;
    const database = dependencies.databaseFactory(DB);
    const user = await authServiceFactory({ database, secret }).me(
      authenticatedPrincipal(context.get('authPrincipal')),
    );
    return user === null
      ? context.json(failure('User not found'), 404)
      : context.json(success(user));
  };
