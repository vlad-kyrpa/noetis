import type { ApiDependencies } from "../api";
import { createTaskHandler, validateCreateTask } from "./routes/create";
import { getTaskHandler, validateGetTask } from "./routes/get-by-id";
import { getTasksHandler, validateGetTasks } from "./routes/get";
import {
  linkNoteByTitleHandler,
  validateLinkTask,
} from "./routes/link-note-by-title";
import { linkTaskByTitleHandler } from "./routes/link-task-by-title";
import { removeTasksHandler, validateRemoveTasks } from "./routes/remove";
import { updateTaskHandler, validateUpdateTask } from "./routes/update";

/** Connects each Tasks handler factory to its public HTTP path. */
export const registerTaskRoutes = (dependencies: ApiDependencies): void => {
  const { app, databaseFactory } = dependencies;
  app.post(
    "/api/tasks",
    validateCreateTask,
    createTaskHandler({ databaseFactory }),
  );
  app.get("/api/tasks", validateGetTasks, getTasksHandler({ databaseFactory }));
  app.get(
    "/api/tasks/:id",
    validateGetTask,
    getTaskHandler({ databaseFactory }),
  );
  app.put(
    "/api/tasks/:id",
    validateUpdateTask,
    updateTaskHandler({ databaseFactory }),
  );
  app.delete(
    "/api/tasks",
    validateRemoveTasks,
    removeTasksHandler({ databaseFactory }),
  );
  app.post(
    "/api/tasks/:id/links/note-by-title",
    validateLinkTask,
    linkNoteByTitleHandler({ databaseFactory }),
  );
  app.post(
    "/api/tasks/:id/links/task-by-title",
    validateLinkTask,
    linkTaskByTitleHandler({ databaseFactory }),
  );
};
