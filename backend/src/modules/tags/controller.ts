import type { ApiDependencies } from "../api";
import { createTagHandler, validateCreateTag } from "./routes/create";
import { getTagsHandler, validateGetTags } from "./routes/get";

/** Connects each Tags handler factory to its public HTTP path. */
export const registerTagRoutes = (dependencies: ApiDependencies): void => {
  const { app, databaseFactory } = dependencies;
  app.get("/api/tags", validateGetTags, getTagsHandler({ databaseFactory }));
  app.post("/api/tags", validateCreateTag, createTagHandler({ databaseFactory }));
};
