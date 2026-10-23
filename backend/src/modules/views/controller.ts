import type { ApiDependencies } from '../api';
import { createViewHandler, validateCreateView } from './routes/create';
import { getViewHandler, validateGetView } from './routes/get-by-id';
import { getViewsHandler, validateGetViews } from './routes/get';
import { removeViewsHandler, validateRemoveViews } from './routes/remove';
import { updateViewHandler, validateUpdateView } from './routes/update';

/** Connects each Views handler factory to its public HTTP path. */
export const registerViewRoutes = (dependencies: ApiDependencies): void => {
  const { app, databaseFactory } = dependencies;
  app.post('/api/views', validateCreateView, createViewHandler({ databaseFactory }));
  app.get('/api/views', validateGetViews, getViewsHandler({ databaseFactory }));
  app.get('/api/views/:id', validateGetView, getViewHandler({ databaseFactory }));
  app.put('/api/views/:id', validateUpdateView, updateViewHandler({ databaseFactory }));
  app.delete('/api/views', validateRemoveViews, removeViewsHandler({ databaseFactory }));
};
