import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, RouteHandlerDependencies } from '../../common/types';
import { success } from '../../common/utils/result';
import { noteServiceFactory } from '../services/note-service';
import type { NoteInput } from '../types';
import { z } from 'zod';
import { tagLabelsSchema } from '../../tags/tag-labels-schema';

/** Represents the absence of path parameters on the Note create endpoint. */
export type CreateNoteParams = EmptyObject;
/** Represents the absence of query parameters on the Note create endpoint. */
export type CreateNoteQuery = EmptyObject;
/** Gives the create handler its endpoint-specific validated request contract. */
export type CreateNoteRequestContext = RequestContext<NoteInput, CreateNoteParams, CreateNoteQuery>;

/** Defines the complete note write model accepted by Notes endpoints. */
export const noteInputSchema: z.ZodType<NoteInput> = z.object({
  title: z.string().min(1),
  body: z.string(),
  tags: tagLabelsSchema,
  linkedTaskIds: z.array(z.string().min(1)).default([]),
  linkedNoteIds: z.array(z.string().min(1)).default([]),
});

/** Defines the accepted request shape for creating a note. */
export const createNoteSchema: EndpointValidationSchema<
  NoteInput,
  CreateNoteParams,
  CreateNoteQuery
> = {
  body: noteInputSchema,
  params: z.object({}),
  query: z.object({}),
};

/** Validates every request part required by the Note create endpoint. */
export const validateCreateNote = validationMiddlewareFactory(createNoteSchema);

/** Creates the handler that persists one already-validated note record. */
export const createNoteHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: CreateNoteRequestContext): Promise<Response> => {
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    return context.json(
      success(
        await noteServiceFactory({ database, userId: context.get('authPrincipal').userId }).create(
          context.validatedReq.body,
        ),
      ),
      201,
    );
  });
