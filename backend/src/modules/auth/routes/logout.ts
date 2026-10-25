import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, type RouteHandlerDependencies } from '../../common/types';
import { success } from '../../common/utils/result';
import { authServiceFactory } from '../services/auth-service';
import type { RefreshInput } from '../types';
import { refreshInputSchema } from './token';
import { z } from 'zod';

/** Represents the absence of path parameters on the logout endpoint. */
export type LogoutParams = EmptyObject;

/** Represents the absence of query parameters on the logout endpoint. */
export type LogoutQuery = EmptyObject;

/** Gives the logout handler its endpoint-specific validated request contract. */
export type LogoutRequestContext = RequestContext<RefreshInput, LogoutParams, LogoutQuery>;

/** Defines the accepted request shape for revoking an authenticated session. */
export const logoutSchema: EndpointValidationSchema<RefreshInput, LogoutParams, LogoutQuery> = {
  body: refreshInputSchema,
  params: z.object({}),
  query: z.object({}),
};

/** Validates every request part required by the logout endpoint. */
export const validateLogout = validationMiddlewareFactory(logoutSchema);

/** Creates the handler that revokes a refresh session without leaking its prior validity. */
export const logoutHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: LogoutRequestContext): Promise<Response> => {
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    const secret = (context.env as { readonly AUTH_TOKEN_SECRET: string }).AUTH_TOKEN_SECRET;
    await authServiceFactory({ database, secret }).logout(context.validatedReq.body);
    return context.json(success({}));
  });
