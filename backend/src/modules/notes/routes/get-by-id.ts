import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, RouteHandlerDependencies } from '../../common/types';
import { failure, success } from '../../common/utils/result';
import { noteServiceFactory } from '../services/note-service';
import { z } from 'zod';

/** Defines the path parameters accepted by the Note lookup endpoint. */
export interface GetNoteParams {
  readonly id: string;
}

/** Represents the absence of a JSON body on the Note lookup endpoint. */
export type GetNoteBody = undefined;
/** Represents the absence of query parameters on the Note lookup endpoint. */
export type GetNoteQuery = EmptyObject;
/** Gives the lookup handler its endpoint-specific validated request contract. */
export type GetNoteRequestContext = RequestContext<GetNoteBody, GetNoteParams, GetNoteQuery>;

/** Defines the accepted request shape for looking up one note. */
export const getNoteSchema: EndpointValidationSchema<GetNoteBody, GetNoteParams, GetNoteQuery> = {
  body: z.undefined(),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
};

/** Validates every request part required by the Note lookup endpoint. */
export const validateGetNote = validationMiddlewareFactory(getNoteSchema);

/** Creates the handler that looks up one already-validated Note identifier. */
export const getNoteHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: GetNoteRequestContext): Promise<Response> => {
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    const note = (
      await noteServiceFactory({ database, userId: context.get('authPrincipal').userId }).get([
        context.validatedReq.params.id,
      ])
    )[0];
    return note === undefined
      ? context.json(failure('Note not found'), 404)
      : context.json(success(note));
  });
