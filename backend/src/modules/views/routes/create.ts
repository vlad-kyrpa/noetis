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
/** Represents the absence of path parameters on the View create endpoint. */ export type CreateViewParams =
  EmptyObject;
/** Represents the absence of query parameters on the View create endpoint. */ export type CreateViewQuery =
  EmptyObject;
/** Gives the create handler its endpoint-specific validated request contract. */ export type CreateViewRequestContext =
  RequestContext<ViewInput, CreateViewParams, CreateViewQuery>;
/** Defines the saved-view write model accepted by Views endpoints. */ export const viewInputSchema: z.ZodType<ViewInput> =
  z.object({
    type: z.enum(['note', 'expense', 'task']),
    period: z.enum(['day', 'week', 'month', 'year']),
    title: z.string().trim().min(1),
    tags: z.array(z.string().trim().min(1)).default([]),
  });
/** Defines the accepted request shape for creating a saved view. */ export const createViewSchema: EndpointValidationSchema<
  ViewInput,
  CreateViewParams,
  CreateViewQuery
> = { body: viewInputSchema, params: z.object({}), query: z.object({}) };
/** Validates every request part required by the View create endpoint. */ export const validateCreateView =
  validationMiddlewareFactory(createViewSchema);
/** Creates the handler that persists one already-validated saved view. */ export const createViewHandler =
  (dependencies: RouteHandlerDependencies) =>
    validatedHandler(async (context: CreateViewRequestContext): Promise<Response> => {
      const database = dependencies.databaseFactory(
        (context.env as { readonly DB: D1Database }).DB,
      );
      const result = await viewServiceFactory({ database, userId: context.get('authPrincipal').userId }).create(context.validatedReq.body);
      return result.ok ? context.json(result, 201) : context.json(result, 409);
    });
