import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, type RouteHandlerDependencies } from '../../common/types';
import { failure, success } from '../../common/utils/result';
import { authServiceFactory } from '../services/auth-service';
import type { RefreshInput } from '../types';
import { z } from 'zod';

/** Represents the absence of path parameters on the token refresh endpoint. */
export type TokenParams = EmptyObject;
/** Represents the absence of query parameters on the token refresh endpoint. */
export type TokenQuery = EmptyObject;
/** Gives the token handler its endpoint-specific validated request contract. */
export type TokenRequestContext = RequestContext<RefreshInput, TokenParams, TokenQuery>;
/** Defines the refresh command accepted by token lifecycle endpoints. */
export const refreshInputSchema: z.ZodType<RefreshInput> = z.object({
  refreshToken: z.string().min(1),
});
/** Defines the accepted request shape for refreshing an authenticated session. */
export const tokenSchema: EndpointValidationSchema<RefreshInput, TokenParams, TokenQuery> = {
  body: refreshInputSchema,
  params: z.object({}),
  query: z.object({}),
};
/** Validates every request part required by the token refresh endpoint. */
export const validateToken = validationMiddlewareFactory(tokenSchema);
/** Creates the handler that rotates a valid refresh session. */
export const tokenHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: TokenRequestContext): Promise<Response> => {
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    const secret = (context.env as { readonly AUTH_TOKEN_SECRET: string }).AUTH_TOKEN_SECRET;
    const tokens = await authServiceFactory({ database, secret }).refresh(
      context.validatedReq.body,
    );
    return tokens === null
      ? context.json(failure('Invalid refresh token'), 401)
      : context.json(success(tokens));
  });
