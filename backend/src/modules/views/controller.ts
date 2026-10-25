import type { ApiDependencies } from '../api';
import { accessAuthenticationMiddleware } from '../auth/middleware/auth-middleware';
import { createViewHandler, validateCreateView } from './routes/create';
import { getViewHandler, validateGetView } from './routes/get-by-id';
import { getViewsHandler, validateGetViews } from './routes/get';
import { removeViewsHandler, validateRemoveViews } from './routes/remove';
import { updateViewHandler, validateUpdateView } from './routes/update';

/** Connects each Views handler factory to its public HTTP path. */
export const registerViewRoutes = (dependencies: ApiDependencies): void => {
  const { app, databaseFactory } = dependencies;
  app.post(
    '/api/views',
    accessAuthenticationMiddleware,
    validateCreateView,
    createViewHandler({ databaseFactory }),
  );
  app.get(
    '/api/views',
    accessAuthenticationMiddleware,
    validateGetViews,
    getViewsHandler({ databaseFactory }),
  );
  app.get(
    '/api/views/:id',
    accessAuthenticationMiddleware,
    validateGetView,
    getViewHandler({ databaseFactory }),
  );
  app.put(
    '/api/views/:id',
    accessAuthenticationMiddleware,
    validateUpdateView,
    updateViewHandler({ databaseFactory }),
  );
  app.delete(
    '/api/views',
    accessAuthenticationMiddleware,
    validateRemoveViews,
    removeViewsHandler({ databaseFactory }),
  );
};
