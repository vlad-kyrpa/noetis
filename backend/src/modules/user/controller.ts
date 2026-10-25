import type { ApiDependencies } from '../api';
import { accessAuthenticationMiddleware } from '../auth/middleware/auth-middleware';
import { createUserHandler, validateCreateUser } from './routes/create';
import { getUserByIdHandler, validateGetUserById } from './routes/get-by-id';
import { removeUsersHandler, validateRemoveUsers } from './routes/remove';
import { updateUserHandler, validateUpdateUser } from './routes/update';

/** Connects each User handler factory to its public HTTP path. */
export const registerUserRoutes = (dependencies: ApiDependencies): void => {
  const { app, databaseFactory } = dependencies;
  app.post('/api/users', validateCreateUser, createUserHandler({ databaseFactory }));
  app.get(
    '/api/users/:id',
    accessAuthenticationMiddleware,
    validateGetUserById,
    getUserByIdHandler({ databaseFactory }),
  );
  app.put(
    '/api/users/:id',
    accessAuthenticationMiddleware,
    validateUpdateUser,
    updateUserHandler({ databaseFactory }),
  );
  app.delete(
    '/api/users',
    accessAuthenticationMiddleware,
    validateRemoveUsers,
    removeUsersHandler({ databaseFactory }),
  );
};
