import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, type RouteHandlerDependencies } from '../../common/types';
import { failure, success } from '../../common/utils/result';
import { authServiceFactory } from '../services/auth-service';
import type { LoginInput } from '../types';
import { z } from 'zod';

/** Represents the absence of path parameters on the login endpoint. */
export type LoginParams = EmptyObject;

/** Represents the absence of query parameters on the login endpoint. */
export type LoginQuery = EmptyObject;

/** Gives the login handler its endpoint-specific validated request contract. */
export type LoginRequestContext = RequestContext<LoginInput, LoginParams, LoginQuery>;

/** Defines the credentials accepted when starting a session. */
export const loginSchema: EndpointValidationSchema<LoginInput, LoginParams, LoginQuery> = {
  body: z.object({ identifier: z.string().trim().min(1), password: z.string().min(1) }),
  params: z.object({}),
  query: z.object({}),
};

/** Validates every request part required by the login endpoint. */
export const validateLogin = validationMiddlewareFactory(loginSchema);
/** Creates the handler that exchanges valid credentials for an authenticated session. */

export const loginHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: LoginRequestContext): Promise<Response> => {
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    const secret = (context.env as { readonly AUTH_TOKEN_SECRET: string }).AUTH_TOKEN_SECRET;
    const tokens = await authServiceFactory({ database, secret }).login(context.validatedReq.body);
    return tokens === null
      ? context.json(failure('Invalid credentials'), 401)
      : context.json(success(tokens));
  });
