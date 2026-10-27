import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, RouteHandlerDependencies } from '../../common/types';
import { success } from '../../common/utils/result';
import { noteServiceFactory } from '../services/note-service';
import type { NoteFilters } from '../types';
import { z } from 'zod';

/** Represents the absence of a JSON body on the Note list endpoint. */
export type GetNotesBody = undefined;
/** Represents the absence of path parameters on the Note list endpoint. */
export type GetNotesParams = EmptyObject;
/** Gives the list handler its endpoint-specific validated request contract. */
export type GetNotesRequestContext = RequestContext<GetNotesBody, GetNotesParams, NoteFilters>;

/** Defines the accepted request shape for listing notes. */
export const getNotesSchema: EndpointValidationSchema<GetNotesBody, GetNotesParams, NoteFilters> = {
  body: z.undefined(),
  params: z.object({}),
  query: z.object({
    title: z.string().optional(),
    body: z.string().optional(),
    tag: z.string().optional(),
  }),
};

/** Validates every request part required by the Note list endpoint. */
export const validateGetNotes = validationMiddlewareFactory(getNotesSchema);

/** Creates the handler that finds notes using validated filters. */
export const getNotesHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: GetNotesRequestContext): Promise<Response> => {
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    return context.json(
      success(
        await noteServiceFactory({ database, userId: context.get('authPrincipal').userId }).find(
          context.validatedReq.query,
        ),
      ),
    );
  });
