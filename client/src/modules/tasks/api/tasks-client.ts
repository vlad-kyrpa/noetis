import type { BackendClient, ModuleClientDefinition } from '../../../common/backend-client/types';
import type { TasksClient } from '../types';
import { decodeRemovedTaskIds, decodeTask, decodeTaskList } from './decoders';
import { toTaskHttpQuery } from './task-list-http-query';
import { validateRemoveTasks, validateTaskInput } from './validators';

const TASKS_MODULE_PATH = '/tasks';
const TASKS_ROOT = '';

// Binds task endpoints to a pre-authorised backend client. Modules only describe paths,
// validators and decoders; tokens, refresh, and response parsing live in the backend client.
const createTasksClient = (client: BackendClient): TasksClient => ({
  create: (input) =>
    client.post({
      body: input,
      decode: decodeTask,
      path: TASKS_ROOT,
      validator: validateTaskInput,
    }),
  get: (id) => client.get({ decode: decodeTask, path: encodeURIComponent(id) }),
  list: (query) =>
    client.get({ decode: decodeTaskList, path: TASKS_ROOT, query: toTaskHttpQuery(query) }),
  remove: (ids) =>
    client.delete({
      body: { ids },
      decode: decodeRemovedTaskIds,
      path: TASKS_ROOT,
      validator: validateRemoveTasks,
    }),
  update: ({ id, input }) =>
    client.put({
      body: input,
      decode: decodeTask,
      path: encodeURIComponent(id),
      validator: validateTaskInput,
    }),
});

// Use with `useModuleClient(tasksClientModule)` inside components and hooks.
export const tasksClientModule: ModuleClientDefinition<TasksClient> = {
  create: createTasksClient,
  modulePath: TASKS_MODULE_PATH,
};
