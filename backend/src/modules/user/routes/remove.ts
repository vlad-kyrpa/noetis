import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, type RouteHandlerDependencies } from '../../common/types';
import { success } from '../../common/utils/result';
import { userServiceFactory } from '../services/user-service';
import { z } from 'zod';

/** Defines the command accepted by the user delete endpoint. */
export interface RemoveUsersBody {
  readonly ids: readonly string[];
}
/** Represents the absence of path parameters on the user delete endpoint. */
export type RemoveUsersParams = EmptyObject;
/** Represents the absence of query parameters on the user delete endpoint. */
export type RemoveUsersQuery = EmptyObject;
/** Gives the delete handler its endpoint-specific validated request contract. */
export type RemoveUsersRequestContext = RequestContext<
  RemoveUsersBody,
  RemoveUsersParams,
  RemoveUsersQuery
>;

/** Defines the accepted request shape for deleting users. */
export const removeUsersSchema: EndpointValidationSchema<
  RemoveUsersBody,
  RemoveUsersParams,
  RemoveUsersQuery
> = {
  body: z.object({ ids: z.array(z.string().min(1)) }),
  params: z.object({}),
  query: z.object({}),
};

/** Validates every request part required by the user delete endpoint. */
export const validateRemoveUsers = validationMiddlewareFactory(removeUsersSchema);

/** Creates the handler that removes already-validated user identifiers. */
export const removeUsersHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: RemoveUsersRequestContext): Promise<Response> => {
    const body = context.validatedReq.body;
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    await userServiceFactory(database).remove(body.ids);
    return context.json(success(body));
  });
