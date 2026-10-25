import { z } from 'zod';
import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, RouteHandlerDependencies } from '../../common/types';
import { viewServiceFactory } from '../services/view-service';
import type { ViewInput } from '../types';
import { viewInputSchema } from './create';
/** Defines path parameters accepted by the View update endpoint. */ export interface UpdateViewParams {
  readonly id: string;
}
/** Represents the absence of query parameters on the View update endpoint. */ export type UpdateViewQuery =
  EmptyObject;
/** Gives the update handler its endpoint-specific validated request contract. */ export type UpdateViewRequestContext =
  RequestContext<ViewInput, UpdateViewParams, UpdateViewQuery>;
/** Defines the accepted request shape for replacing a saved view. */ export const updateViewSchema: EndpointValidationSchema<
  ViewInput,
  UpdateViewParams,
  UpdateViewQuery
> = { body: viewInputSchema, params: z.object({ id: z.string().min(1) }), query: z.object({}) };
/** Validates every request part required by the View update endpoint. */ export const validateUpdateView =
  validationMiddlewareFactory(updateViewSchema);
/** Creates the handler that replaces one already-validated saved view. */ export const updateViewHandler =
  (dependencies: RouteHandlerDependencies) =>
    validatedHandler(async (context: UpdateViewRequestContext): Promise<Response> => {
      const database = dependencies.databaseFactory(
        (context.env as { readonly DB: D1Database }).DB,
      );
      const result = await viewServiceFactory({ database, userId: context.get('authPrincipal').userId }).update({
        id: context.validatedReq.params.id,
        input: context.validatedReq.body,
      });
      return result.ok
        ? context.json(result)
        : context.json(result, result.error === 'View not found' ? 404 : 409);
    });
