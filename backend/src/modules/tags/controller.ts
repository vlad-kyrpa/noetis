import type { ApiDependencies } from '../api';
import { accessAuthenticationMiddleware } from '../auth/middleware/auth-middleware';
import { createTagHandler, validateCreateTag } from './routes/create';
import { getTagsHandler, validateGetTags } from './routes/get';
import { removeTagsHandler, validateRemoveTags } from './routes/remove';

/** Connects each Tags handler factory to its public HTTP path. */
export const registerTagRoutes = (dependencies: ApiDependencies): void => {
  const { app, databaseFactory } = dependencies;
  app.get(
    '/api/tags',
    accessAuthenticationMiddleware,
    validateGetTags,
    getTagsHandler({ databaseFactory }),
  );
  app.post(
    '/api/tags',
    accessAuthenticationMiddleware,
    validateCreateTag,
    createTagHandler({ databaseFactory }),
  );
  app.delete(
    '/api/tags',
    accessAuthenticationMiddleware,
    validateRemoveTags,
    removeTagsHandler({ databaseFactory }),
  );
};
