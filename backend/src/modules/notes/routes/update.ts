import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, RouteHandlerDependencies } from '../../common/types';
import { failure, success } from '../../common/utils/result';
import { noteServiceFactory } from '../services/note-service';
import type { NoteInput } from '../types';
import { createNoteSchema } from './create';
import { z } from 'zod';

/** Defines the path parameters accepted by the Note update endpoint. */
export interface UpdateNoteParams {
  readonly id: string;
}

/** Represents the absence of query parameters on the Note update endpoint. */
export type UpdateNoteQuery = EmptyObject;
/** Gives the update handler its endpoint-specific validated request contract. */
export type UpdateNoteRequestContext = RequestContext<NoteInput, UpdateNoteParams, UpdateNoteQuery>;

/** Defines the accepted request shape for replacing a note. */
export const updateNoteSchema: EndpointValidationSchema<
  NoteInput,
  UpdateNoteParams,
  UpdateNoteQuery
> = {
  body: createNoteSchema.body,
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
};

/** Validates every request part required by the Note update endpoint. */
export const validateUpdateNote = validationMiddlewareFactory(updateNoteSchema);

/** Creates the handler that replaces one already-validated note record. */
export const updateNoteHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: UpdateNoteRequestContext): Promise<Response> => {
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    const result = await noteServiceFactory(database).update({
      id: context.validatedReq.params.id,
      input: context.validatedReq.body,
    });
    return result.ok ? context.json(result) : context.json(result, 404);
  });
