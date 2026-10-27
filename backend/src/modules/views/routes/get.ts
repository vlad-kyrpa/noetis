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
import type { ViewFilters } from '../types';
/** Represents the absence of a JSON body on the View list endpoint. */ export type GetViewsBody =
  undefined;
/** Represents the absence of path parameters on the View list endpoint. */ export type GetViewsParams =
  EmptyObject;
/** Gives the list handler its endpoint-specific validated request contract. */ export type GetViewsRequestContext =
  RequestContext<GetViewsBody, GetViewsParams, ViewFilters>;
/** Defines the accepted request shape for listing saved views. */ export const getViewsSchema: EndpointValidationSchema<
  GetViewsBody,
  GetViewsParams,
  ViewFilters
> = {
  body: z.undefined(),
  params: z.object({}),
  query: z.object({ type: z.enum(['note', 'expense', 'task']).optional() }),
};
/** Validates every request part required by the View list endpoint. */ export const validateGetViews =
  validationMiddlewareFactory(getViewsSchema);
/** Creates the handler that finds saved views using validated filters. */ export const getViewsHandler =
  (dependencies: RouteHandlerDependencies) =>
    validatedHandler(async (context: GetViewsRequestContext): Promise<Response> => {
      const database = dependencies.databaseFactory(
        (context.env as { readonly DB: D1Database }).DB,
      );
      return context.json(
        success(
          await viewServiceFactory({ database, userId: context.get('authPrincipal').userId }).find(
            context.validatedReq.query,
          ),
        ),
      );
    });
