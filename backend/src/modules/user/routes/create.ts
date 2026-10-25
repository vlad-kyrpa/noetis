import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, type RouteHandlerDependencies } from '../../common/types';
import { failure, success } from '../../common/utils/result';
import { userServiceFactory } from '../services/user-service';
import type { CreateUserInput } from '../types';
import { userInputSchema } from './user-input';
import { z } from 'zod';

/** Represents the absence of path parameters on the user create endpoint. */
export type CreateUserParams = EmptyObject;
/** Represents the absence of query parameters on the user create endpoint. */
export type CreateUserQuery = EmptyObject;
/** Gives the create handler its endpoint-specific validated request contract. */
export type CreateUserRequestContext = RequestContext<
  CreateUserInput,
  CreateUserParams,
  CreateUserQuery
>;

/** Defines the accepted request shape for creating a user. */
export const createUserSchema: EndpointValidationSchema<
  CreateUserInput,
  CreateUserParams,
  CreateUserQuery
> = { body: userInputSchema, params: z.object({}), query: z.object({}) };

/** Validates every request part required by the user create endpoint. */
export const validateCreateUser = validationMiddlewareFactory(createUserSchema);

/** Creates the handler that persists one already-validated user record. */
export const createUserHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: CreateUserRequestContext): Promise<Response> => {
    const { DB, ALLOW_REGISTRATIONS } = context.env;
    if (ALLOW_REGISTRATIONS !== 'true') {
      return context.json(failure('New registrations are not allowed'), 400);
    }
    const database = dependencies.databaseFactory(DB);
    const user = await userServiceFactory(database).create(context.validatedReq.body);
    return user === null
      ? context.json(failure('Username or email already exists'), 409)
      : context.json(success(user), 201);
  });
