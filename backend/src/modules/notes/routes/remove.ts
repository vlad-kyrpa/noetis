import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from "../../common/middleware/validationMiddleware";
import { type EmptyObject, RouteHandlerDependencies } from "../../common/types";
import { success } from "../../common/utils/result";
import { noteServiceFactory } from "../services/note-service";
import { z } from "zod";

/** Defines the command accepted by the Note delete endpoint. */
export interface RemoveNotesBody {
  readonly ids: readonly string[];
}

/** Represents the absence of path parameters on the Note delete endpoint. */
export type RemoveNotesParams = EmptyObject;
/** Represents the absence of query parameters on the Note delete endpoint. */
export type RemoveNotesQuery = EmptyObject;
/** Gives the delete handler its endpoint-specific validated request contract. */
export type RemoveNotesRequestContext = RequestContext<
  RemoveNotesBody,
  RemoveNotesParams,
  RemoveNotesQuery
>;

/** Defines the accepted request shape for deleting notes. */
export const removeNotesSchema: EndpointValidationSchema<
  RemoveNotesBody,
  RemoveNotesParams,
  RemoveNotesQuery
> = {
  body: z.object({ ids: z.array(z.string()) }),
  params: z.object({}),
  query: z.object({}),
};

/** Validates every request part required by the Note delete endpoint. */
export const validateRemoveNotes = validationMiddlewareFactory(removeNotesSchema);

/** Creates the handler that removes already-validated Note record identifiers. */
export const removeNotesHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(
    async (context: RemoveNotesRequestContext): Promise<Response> => {
      const body = context.validatedReq.body;
      const database = dependencies.databaseFactory(
        (context.env as { readonly DB: D1Database }).DB,
      );
      await noteServiceFactory(database).remove(body.ids);
      return context.json(success(body));
    },
  );
