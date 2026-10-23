import { z } from 'zod';
import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, RouteHandlerDependencies } from '../../common/types';
import { failure, success } from '../../common/utils/result';
import { viewServiceFactory } from '../services/view-service';
/** Defines path parameters accepted by the View lookup endpoint. */ export interface GetViewParams {
  readonly id: string;
}
/** Represents the absence of a JSON body on the View lookup endpoint. */ export type GetViewBody =
  undefined;
/** Represents the absence of query parameters on the View lookup endpoint. */ export type GetViewQuery =
  EmptyObject;
/** Gives the lookup handler its endpoint-specific validated request contract. */ export type GetViewRequestContext =
  RequestContext<GetViewBody, GetViewParams, GetViewQuery>;
/** Defines the accepted request shape for looking up one saved view. */ export const getViewSchema: EndpointValidationSchema<
  GetViewBody,
  GetViewParams,
  GetViewQuery
> = { body: z.undefined(), params: z.object({ id: z.string().min(1) }), query: z.object({}) };
/** Validates every request part required by the View lookup endpoint. */ export const validateGetView =
  validationMiddlewareFactory(getViewSchema);
/** Creates the handler that looks up one already-validated View identifier. */ export const getViewHandler =
  (dependencies: RouteHandlerDependencies) =>
    validatedHandler(async (context: GetViewRequestContext): Promise<Response> => {
      const database = dependencies.databaseFactory(
        (context.env as { readonly DB: D1Database }).DB,
      );
      const view = await viewServiceFactory(database).get(context.validatedReq.params.id);
      return view === null
        ? context.json(failure('View not found'), 404)
        : context.json(success(view));
    });
