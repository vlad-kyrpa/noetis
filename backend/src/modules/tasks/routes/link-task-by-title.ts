import { validatedHandler } from '../../common/middleware/validationMiddleware';
import { RouteHandlerDependencies } from '../../common/types';
import { failure, success } from '../../common/utils/result';
import { taskServiceFactory } from '../services/task-service';
import { type LinkTaskRequestContext } from './link-note-by-title';

/** Creates the handler that finds a task by title and links it to a task. */
export const linkTaskByTitleHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: LinkTaskRequestContext): Promise<Response> => {
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    const result = await taskServiceFactory({ database, userId: context.get('authPrincipal').userId }).findTaskByTitleAndLink({
      taskId: context.validatedReq.params.id,
      title: context.validatedReq.body.title,
    });
    return result.ok ? context.json(success({ taskId: result.value })) : context.json(result, 404);
  });
