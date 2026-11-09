import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, RouteHandlerDependencies } from '../../common/types';
import { success } from '../../common/utils/result';
import { taskServiceFactory } from '../services/task-service';
import type { TaskFilters } from '../types';
import { z } from 'zod';
import { normalizeTagLabels } from '../../tags/normalize-tag-label';

/** Inclusive date bounds are plain calendar days, so they compare correctly as strings. */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
/** Caps the comma-joined tag list so one request cannot ask for an unbounded join. */
const MAX_QUERY_TAGS = 20;
/** Separates labels in the `tags` query; tag labels never contain it. */
const TAG_QUERY_SEPARATOR = ',';

/** Parses `tags=a,b` into lower-cased, deduped, non-empty labels. */
const tagsQuerySchema = z
  .string()
  .transform((joined): readonly string[] => normalizeTagLabels(joined.split(TAG_QUERY_SEPARATOR)))
  .pipe(z.array(z.string()).max(MAX_QUERY_TAGS));

/** Represents the absence of a JSON body on the Task list endpoint. */
export type GetTasksBody = undefined;
/** Represents the absence of path parameters on the Task list endpoint. */
export type GetTasksParams = EmptyObject;
/** Gives the list handler its endpoint-specific validated request contract. */
export type GetTasksRequestContext = RequestContext<GetTasksBody, GetTasksParams, TaskFilters>;

/** Defines the accepted request shape for listing tasks. */
export const getTasksSchema: EndpointValidationSchema<GetTasksBody, GetTasksParams, TaskFilters> = {
  body: z.undefined(),
  params: z.object({}),
  query: z.object({
    title: z.string().optional(),
    tagId: z.string().optional(),
    dueTo: z.string().optional(),
    dueFrom: z.string().regex(ISO_DATE_PATTERN).optional(),
    dueUntil: z.string().regex(ISO_DATE_PATTERN).optional(),
    viewId: z.string().min(1).optional(),
    tags: tagsQuerySchema.optional(),
    status: z.enum(['undone', 'inProgress', 'done']).optional(),
  }),
};

/** Validates every request part required by the Task list endpoint. */
export const validateGetTasks = validationMiddlewareFactory(getTasksSchema);

/** Creates the handler that finds tasks using validated filters. */
export const getTasksHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: GetTasksRequestContext): Promise<Response> => {
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    return context.json(
      success(
        await taskServiceFactory({ database, userId: context.get('authPrincipal').userId }).find(
          context.validatedReq.query,
        ),
      ),
    );
  });
