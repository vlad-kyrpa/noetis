import { z } from 'zod';
import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, RouteHandlerDependencies } from '../../common/types';
import { success } from '../../common/utils/result';
import { viewServiceFactory } from '../services/view-service';
/** Defines the command accepted by the View delete endpoint. */ export interface RemoveViewsBody {
  readonly ids: readonly string[];
}
/** Represents the absence of path parameters on the View delete endpoint. */ export type RemoveViewsParams =
  EmptyObject;
/** Represents the absence of query parameters on the View delete endpoint. */ export type RemoveViewsQuery =
  EmptyObject;
/** Gives the delete handler its endpoint-specific validated request contract. */ export type RemoveViewsRequestContext =
  RequestContext<RemoveViewsBody, RemoveViewsParams, RemoveViewsQuery>;
/** Defines the accepted request shape for deleting saved views. */ export const removeViewsSchema: EndpointValidationSchema<
  RemoveViewsBody,
  RemoveViewsParams,
  RemoveViewsQuery
> = { body: z.object({ ids: z.array(z.string()) }), params: z.object({}), query: z.object({}) };
/** Validates every request part required by the View delete endpoint. */ export const validateRemoveViews =
  validationMiddlewareFactory(removeViewsSchema);
/** Creates the handler that removes already-validated View record identifiers. */ export const removeViewsHandler =
  (dependencies: RouteHandlerDependencies) =>
    validatedHandler(async (context: RemoveViewsRequestContext): Promise<Response> => {
      const body = context.validatedReq.body;
      const database = dependencies.databaseFactory(
        (context.env as { readonly DB: D1Database }).DB,
      );
      await viewServiceFactory({ database, userId: context.get('authPrincipal').userId }).remove(body.ids);
      return context.json(success(body));
    });
