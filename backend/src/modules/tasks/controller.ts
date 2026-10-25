import type { ApiDependencies } from '../api';
import { accessAuthenticationMiddleware } from '../auth/middleware/auth-middleware';
import { createTaskHandler, validateCreateTask } from './routes/create';
import { getTaskHandler, validateGetTask } from './routes/get-by-id';
import { getTasksHandler, validateGetTasks } from './routes/get';
import { linkNoteByTitleHandler, validateLinkTask } from './routes/link-note-by-title';
import { linkTaskByTitleHandler } from './routes/link-task-by-title';
import { removeTasksHandler, validateRemoveTasks } from './routes/remove';
import { updateTaskHandler, validateUpdateTask } from './routes/update';

/** Connects each Tasks handler factory to its public HTTP path. */
export const registerTaskRoutes = (dependencies: ApiDependencies): void => {
  const { app, databaseFactory } = dependencies;
  app.post(
    '/api/tasks',
    accessAuthenticationMiddleware,
    validateCreateTask,
    createTaskHandler({ databaseFactory }),
  );
  app.get(
    '/api/tasks',
    accessAuthenticationMiddleware,
    validateGetTasks,
    getTasksHandler({ databaseFactory }),
  );
  app.get(
    '/api/tasks/:id',
    accessAuthenticationMiddleware,
    validateGetTask,
    getTaskHandler({ databaseFactory }),
  );
  app.put(
    '/api/tasks/:id',
    accessAuthenticationMiddleware,
    validateUpdateTask,
    updateTaskHandler({ databaseFactory }),
  );
  app.delete(
    '/api/tasks',
    accessAuthenticationMiddleware,
    validateRemoveTasks,
    removeTasksHandler({ databaseFactory }),
  );
  app.post(
    '/api/tasks/:id/links/note-by-title',
    accessAuthenticationMiddleware,
    validateLinkTask,
    linkNoteByTitleHandler({ databaseFactory }),
  );
  app.post(
    '/api/tasks/:id/links/task-by-title',
    accessAuthenticationMiddleware,
    validateLinkTask,
    linkTaskByTitleHandler({ databaseFactory }),
  );
};
