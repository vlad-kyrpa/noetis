import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, RouteHandlerDependencies } from '../../common/types';
import { success } from '../../common/utils/result';
import { z } from 'zod';
import { tagServiceFactory } from '../services/tag-service';

/** Defines the command accepted by the Tag delete endpoint. */
export interface RemoveTagsBody {
  readonly ids: readonly string[];
}

/** Represents the absence of path parameters on the Tag delete endpoint. */
export type RemoveTagsParams = EmptyObject;
/** Represents the absence of query parameters on the Tag delete endpoint. */
export type RemoveTagsQuery = EmptyObject;
/** Gives the delete handler its endpoint-specific validated request contract. */
export type RemoveTagsRequestContext = RequestContext<
  RemoveTagsBody,
  RemoveTagsParams,
  RemoveTagsQuery
>;

/** Defines the accepted request shape for deleting tags. */
export const removeTagsSchema: EndpointValidationSchema<
  RemoveTagsBody,
  RemoveTagsParams,
  RemoveTagsQuery
> = {
  body: z.object({ ids: z.array(z.string()) }),
  params: z.object({}),
  query: z.object({}),
};

/** Validates every request part required by the Tag delete endpoint. */
export const validateRemoveTags = validationMiddlewareFactory(removeTagsSchema);

/** Creates the handler that removes already-validated Tag record identifiers. */
export const removeTagsHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: RemoveTagsRequestContext): Promise<Response> => {
    const body = context.validatedReq.body;
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    await tagServiceFactory({ database, userId: context.get('authPrincipal').userId }).remove(
      body.ids,
    );
    return context.json(success(body));
  });
