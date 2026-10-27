import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, RouteHandlerDependencies } from '../../common/types';
import { failure, success } from '../../common/utils/result';
import { tagServiceFactory } from '../services/tag-service';
import type { TagInput } from '../types';
import { tagInputSchema } from './create.validation';
import { z } from 'zod';

/** Represents the absence of path parameters on the Tag create endpoint. */
export type CreateTagParams = EmptyObject;
/** Represents the absence of query parameters on the Tag create endpoint. */
export type CreateTagQuery = EmptyObject;
/** Gives the create handler its endpoint-specific validated request contract. */
export type CreateTagRequestContext = RequestContext<TagInput, CreateTagParams, CreateTagQuery>;

/** Defines the accepted request shape for creating a tag. */
export const createTagSchema: EndpointValidationSchema<TagInput, CreateTagParams, CreateTagQuery> =
  {
    body: tagInputSchema,
    params: z.object({}),
    query: z.object({}),
  };

/** Validates every request part required by the Tag create endpoint. */
export const validateCreateTag = validationMiddlewareFactory(createTagSchema);

/** Creates the handler that persists one already-validated tag record. */
export const createTagHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: CreateTagRequestContext): Promise<Response> => {
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    const tag = await tagServiceFactory({
      database,
      userId: context.get('authPrincipal').userId,
    }).create(context.validatedReq.body);
    return tag === null
      ? context.json(failure('Tag label already exists'), 409)
      : context.json(success(tag), 201);
  });
