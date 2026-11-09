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

/** Defines the path parameters accepted by Task link endpoints. */
export interface LinkTaskParams {
  readonly id: string;
}

/** Defines the title command used by Task link endpoints. */
export interface LinkByTitleBody {
  readonly title: string;
}

/** Represents the absence of query parameters on Task link endpoints. */
export type LinkTaskQuery = EmptyObject;
/** Gives each link handler its endpoint-specific validated request contract. */
export type LinkTaskRequestContext = RequestContext<LinkByTitleBody, LinkTaskParams, LinkTaskQuery>;

/** Defines the accepted request shape for linking a task by title. */
export const linkTaskSchema: EndpointValidationSchema<
  LinkByTitleBody,
  LinkTaskParams,
  LinkTaskQuery
> = {
  body: z.object({ title: z.string().trim().min(1) }),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
};

/** Validates every request part required by Task link endpoints. */
export const validateLinkTask = validationMiddlewareFactory(linkTaskSchema);

/** Creates the handler that finds a note by title and links it to a task. */
export const linkNoteByTitleHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: LinkTaskRequestContext): Promise<Response> => {
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    const result = await taskServiceFactory({
      database,
      userId: context.get('authPrincipal').userId,
    }).findNoteByTitleAndLink({
      taskId: context.validatedReq.params.id,
      title: context.validatedReq.body.title,
    });
    return result.ok ? context.json(success({ noteId: result.value })) : context.json(result, 404);
  });
