import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, type RouteHandlerDependencies } from '../../common/types';
import { failure, success } from '../../common/utils/result';
import { userServiceFactory } from '../services/user-service';
import type { UpdateUserInput } from '../types';
import { userInputSchema } from './user-input';
import { z } from 'zod';

/** Defines the path parameters accepted by the user update endpoint. */
export interface UpdateUserParams {
  readonly id: string;
}
/** Represents the absence of query parameters on the user update endpoint. */
export type UpdateUserQuery = EmptyObject;
/** Gives the update handler its endpoint-specific validated request contract. */
export type UpdateUserRequestContext = RequestContext<
  UpdateUserInput,
  UpdateUserParams,
  UpdateUserQuery
>;

/** Defines the accepted request shape for replacing a user. */
export const updateUserSchema: EndpointValidationSchema<
  UpdateUserInput,
  UpdateUserParams,
  UpdateUserQuery
> = {
  body: userInputSchema,
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
};

/** Validates every request part required by the user update endpoint. */
export const validateUpdateUser = validationMiddlewareFactory(updateUserSchema);

/** Creates the handler that replaces one already-validated user record. */
export const updateUserHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: UpdateUserRequestContext): Promise<Response> => {
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    const user = await userServiceFactory(database).update({
      id: context.validatedReq.params.id,
      input: context.validatedReq.body,
    });
    return user === 'not-found'
      ? context.json(failure('User not found'), 404)
      : user === 'conflict'
        ? context.json(failure('Username or email already exists'), 409)
        : context.json(success(user));
  });
