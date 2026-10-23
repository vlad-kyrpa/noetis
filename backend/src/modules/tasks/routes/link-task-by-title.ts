import { validatedHandler } from '../../common/middleware/validationMiddleware';
import { RouteHandlerDependencies } from '../../common/types';
import { failure, success } from '../../common/utils/result';
import { taskServiceFactory } from '../services/task-service';
import { type LinkTaskRequestContext } from './link-note-by-title';

/** Creates the handler that finds a task by title and links it to a task. */
export const linkTaskByTitleHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: LinkTaskRequestContext): Promise<Response> => {
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    const taskId = await taskServiceFactory(database).findTaskByTitleAndLink({
      taskId: context.validatedReq.params.id,
      title: context.validatedReq.body.title,
    });
    return taskId === null
      ? context.json(failure('Task not found or self-link requested'), 404)
      : context.json(success({ taskId }));
  });
