import type { ApiDependencies } from "../api";
import { createNoteHandler, validateCreateNote } from "./routes/create";
import { getNoteHandler, validateGetNote } from "./routes/get-by-id";
import { getNotesHandler, validateGetNotes } from "./routes/get";
import { removeNotesHandler, validateRemoveNotes } from "./routes/remove";
import { updateNoteHandler, validateUpdateNote } from "./routes/update";

/** Connects each Notes handler factory to its public HTTP path. */
export const registerNotesRoutes = (dependencies: ApiDependencies): void => {
  const { app, databaseFactory } = dependencies;
  app.post(
    "/api/notes",
    validateCreateNote,
    createNoteHandler({ databaseFactory }),
  );
  app.get("/api/notes", validateGetNotes, getNotesHandler({ databaseFactory }));
  app.get(
    "/api/notes/:id",
    validateGetNote,
    getNoteHandler({ databaseFactory }),
  );
  app.put(
    "/api/notes/:id",
    validateUpdateNote,
    updateNoteHandler({ databaseFactory }),
  );
  app.delete(
    "/api/notes",
    validateRemoveNotes,
    removeNotesHandler({ databaseFactory }),
  );
};
