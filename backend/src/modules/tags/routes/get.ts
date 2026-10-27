import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, RouteHandlerDependencies } from '../../common/types';
import { success } from '../../common/utils/result';
import { tagServiceFactory } from '../services/tag-service';
import { z } from 'zod';

/** Represents the absence of a JSON body on the Tag list endpoint. */
export type GetTagsBody = undefined;
/** Represents the absence of path parameters on the Tag list endpoint. */
export type GetTagsParams = EmptyObject;
/** Defines filters accepted by the Tag list endpoint. */
export interface GetTagsQuery {
  readonly label?: string;
}

/** Gives the list handler its endpoint-specific validated request contract. */
export type GetTagsRequestContext = RequestContext<GetTagsBody, GetTagsParams, GetTagsQuery>;

/** Defines the accepted request shape for listing tags. */
export const getTagsSchema: EndpointValidationSchema<GetTagsBody, GetTagsParams, GetTagsQuery> = {
  body: z.undefined(),
  params: z.object({}),
  query: z.object({ label: z.string().optional() }),
};

/** Validates every request part required by the Tag list endpoint. */
export const validateGetTags = validationMiddlewareFactory(getTagsSchema);

/** Creates the handler that finds tags using validated filters. */
export const getTagsHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: GetTagsRequestContext): Promise<Response> => {
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    return context.json(
      success(
        await tagServiceFactory({ database, userId: context.get('authPrincipal').userId }).find(
          context.validatedReq.query.label ?? null,
        ),
      ),
    );
  });
