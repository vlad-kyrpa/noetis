import type { ApiDependencies } from '../api';
import { accessAuthenticationMiddleware } from '../auth/middleware/auth-middleware';
import { createNoteHandler, validateCreateNote } from './routes/create';
import { getNoteHandler, validateGetNote } from './routes/get-by-id';
import { getNotesHandler, validateGetNotes } from './routes/get';
import { removeNotesHandler, validateRemoveNotes } from './routes/remove';
import { updateNoteHandler, validateUpdateNote } from './routes/update';

/** Connects each Notes handler factory to its public HTTP path. */
export const registerNotesRoutes = (dependencies: ApiDependencies): void => {
  const { app, databaseFactory } = dependencies;
  app.post(
    '/api/notes',
    accessAuthenticationMiddleware,
    validateCreateNote,
    createNoteHandler({ databaseFactory }),
  );
  app.get(
    '/api/notes',
    accessAuthenticationMiddleware,
    validateGetNotes,
    getNotesHandler({ databaseFactory }),
  );
  app.get(
    '/api/notes/:id',
    accessAuthenticationMiddleware,
    validateGetNote,
    getNoteHandler({ databaseFactory }),
  );
  app.put(
    '/api/notes/:id',
    accessAuthenticationMiddleware,
    validateUpdateNote,
    updateNoteHandler({ databaseFactory }),
  );
  app.delete(
    '/api/notes',
    accessAuthenticationMiddleware,
    validateRemoveNotes,
    removeNotesHandler({ databaseFactory }),
  );
};
