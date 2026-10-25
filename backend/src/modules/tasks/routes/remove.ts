import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, RouteHandlerDependencies } from '../../common/types';
import { success } from '../../common/utils/result';
import { taskServiceFactory } from '../services/task-service';
import { z } from 'zod';

/** Defines the command accepted by the Task delete endpoint. */
export interface RemoveTasksBody {
  readonly ids: readonly string[];
}

/** Represents the absence of path parameters on the Task delete endpoint. */
export type RemoveTasksParams = EmptyObject;
/** Represents the absence of query parameters on the Task delete endpoint. */
export type RemoveTasksQuery = EmptyObject;
/** Gives the delete handler its endpoint-specific validated request contract. */
export type RemoveTasksRequestContext = RequestContext<
  RemoveTasksBody,
  RemoveTasksParams,
  RemoveTasksQuery
>;

/** Defines the accepted request shape for deleting tasks. */
export const removeTasksSchema: EndpointValidationSchema<
  RemoveTasksBody,
  RemoveTasksParams,
  RemoveTasksQuery
> = {
  body: z.object({ ids: z.array(z.string()) }),
  params: z.object({}),
  query: z.object({}),
};

/** Validates every request part required by the Task delete endpoint. */
export const validateRemoveTasks = validationMiddlewareFactory(removeTasksSchema);

/** Creates the handler that removes already-validated Task record identifiers. */
export const removeTasksHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: RemoveTasksRequestContext): Promise<Response> => {
    const body = context.validatedReq.body;
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    await taskServiceFactory({ database, userId: context.get('authPrincipal').userId }).remove(body.ids);
    return context.json(success(body));
  });
