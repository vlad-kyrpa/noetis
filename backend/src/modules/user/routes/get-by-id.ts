import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, type RouteHandlerDependencies } from '../../common/types';
import { failure, success } from '../../common/utils/result';
import { userServiceFactory } from '../services/user-service';
import { z } from 'zod';

/** Represents the absence of a JSON body on the user read endpoint. */
export type GetUserByIdBody = undefined;
/** Defines the path parameters accepted by the user read endpoint. */
export interface GetUserByIdParams {
  readonly id: string;
}
/** Represents the absence of query parameters on the user read endpoint. */
export type GetUserByIdQuery = EmptyObject;
/** Gives the read handler its endpoint-specific validated request contract. */
export type GetUserByIdRequestContext = RequestContext<
  GetUserByIdBody,
  GetUserByIdParams,
  GetUserByIdQuery
>;

/** Defines the accepted request shape for reading one user. */
export const getUserByIdSchema: EndpointValidationSchema<
  GetUserByIdBody,
  GetUserByIdParams,
  GetUserByIdQuery
> = { body: z.undefined(), params: z.object({ id: z.string().min(1) }), query: z.object({}) };

/** Validates every request part required by the user read endpoint. */
export const validateGetUserById = validationMiddlewareFactory(getUserByIdSchema);

/** Creates the handler that returns a user without credential fields. */
export const getUserByIdHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: GetUserByIdRequestContext): Promise<Response> => {
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    const user = await userServiceFactory(database).getById(context.validatedReq.params.id);
    return user === null
      ? context.json(failure('User not found'), 404)
      : context.json(success(user));
  });
