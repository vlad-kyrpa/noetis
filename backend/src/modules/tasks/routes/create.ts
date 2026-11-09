import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, RouteHandlerDependencies } from '../../common/types';
import { success } from '../../common/utils/result';
import { taskServiceFactory } from '../services/task-service';
import type { TaskInput } from '../types';
import { z } from 'zod';
import { tagLabelsSchema } from '../../tags/tag-labels-schema';

/** Represents the absence of path parameters on the Task create endpoint. */
export type CreateTaskParams = EmptyObject;
/** Represents the absence of query parameters on the Task create endpoint. */
export type CreateTaskQuery = EmptyObject;
/** Gives the create handler its endpoint-specific validated request contract. */
export type CreateTaskRequestContext = RequestContext<TaskInput, CreateTaskParams, CreateTaskQuery>;

/** Defines the complete task write model accepted by Tasks endpoints. */
export const taskInputSchema: z.ZodType<TaskInput> = z.object({
  title: z.string().trim().min(1),
  description: z.string().nullable(),
  tags: tagLabelsSchema,
  dueTo: z.string().nullable(),
  status: z.enum(['undone', 'inProgress', 'done']),
  linkedTaskIds: z.array(z.string().min(1)).default([]),
  linkedNoteIds: z.array(z.string().min(1)).default([]),
});

/** Defines the accepted request shape for creating a task. */
export const createTaskSchema: EndpointValidationSchema<
  TaskInput,
  CreateTaskParams,
  CreateTaskQuery
> = {
  body: taskInputSchema,
  params: z.object({}),
  query: z.object({}),
};

/** Validates every request part required by the Task create endpoint. */
export const validateCreateTask = validationMiddlewareFactory(createTaskSchema);

/** Creates the handler that persists one already-validated task record. */
export const createTaskHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: CreateTaskRequestContext): Promise<Response> => {
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    return context.json(
      success(
        await taskServiceFactory({ database, userId: context.get('authPrincipal').userId }).create(
          context.validatedReq.body,
        ),
      ),
      201,
    );
  });
