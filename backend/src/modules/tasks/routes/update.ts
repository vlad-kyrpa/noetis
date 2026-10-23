import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, RouteHandlerDependencies } from '../../common/types';
import { failure, success } from '../../common/utils/result';
import { taskServiceFactory } from '../services/task-service';
import type { TaskInput } from '../types';
import { taskInputSchema } from './create';
import { z } from 'zod';

/** Defines the path parameters accepted by the Task update endpoint. */
export interface UpdateTaskParams {
  readonly id: string;
}

/** Represents the absence of query parameters on the Task update endpoint. */
export type UpdateTaskQuery = EmptyObject;
/** Gives the update handler its endpoint-specific validated request contract. */
export type UpdateTaskRequestContext = RequestContext<TaskInput, UpdateTaskParams, UpdateTaskQuery>;

/** Defines the accepted request shape for replacing a task. */
export const updateTaskSchema: EndpointValidationSchema<
  TaskInput,
  UpdateTaskParams,
  UpdateTaskQuery
> = {
  body: taskInputSchema,
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
};

/** Validates every request part required by the Task update endpoint. */
export const validateUpdateTask = validationMiddlewareFactory(updateTaskSchema);

/** Creates the handler that replaces one already-validated task record. */
export const updateTaskHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: UpdateTaskRequestContext): Promise<Response> => {
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    const result = await taskServiceFactory(database).update({
      id: context.validatedReq.params.id,
      input: context.validatedReq.body,
    });
    return result.ok ? context.json(result) : context.json(result, 404);
  });
