import type { Context, MiddlewareHandler } from "hono";
import { z } from "zod";
import { failure } from "../utils/result";

/** Holds request parts that have passed an endpoint's validation schema. */
export interface ValidatedRequest<Body, Params, Query> {
  readonly body: Body;
  readonly params: Params;
  readonly query: Query;
}

/** Extends Hono's context with the validated contract for one endpoint. */
export interface RequestContext<Body, Params, Query> extends Context {
  validatedReq: ValidatedRequest<Body, Params, Query>;
}

/** Defines the complete Zod contract required by an endpoint. */
export interface EndpointValidationSchema<Body, Params, Query> {
  readonly body: z.ZodType<Body>;
  readonly params: z.ZodType<Params>;
  readonly query: z.ZodType<Query>;
}

/** Describes a handler whose request data was validated by this middleware. */
export type ValidatedRequestHandler<Body, Params, Query> = (
  context: RequestContext<Body, Params, Query>,
) => Promise<Response>;

/** Adapts a typed endpoint handler to Hono after validation middleware is registered. */
export const validatedHandler =
  <Body, Params, Query>(
    handler: ValidatedRequestHandler<Body, Params, Query>,
  ): ((context: Context) => Promise<Response>) =>
  async (context: Context): Promise<Response> =>
    handler(context as RequestContext<Body, Params, Query>);

/** Validates body, path params, and query once before exposing them to a typed handler. */
export const validationMiddlewareFactory =
  <Body, Params, Query>(
    schema: EndpointValidationSchema<Body, Params, Query>,
  ): MiddlewareHandler =>
  async (context, next): Promise<Response | void> => {
    const rawBody: unknown = await context.req.json().catch(() => undefined);

    const [body, params, query] = await Promise.all([
      schema.body.safeParseAsync(rawBody),
      schema.params.safeParseAsync(context.req.param()),
      schema.query.safeParseAsync(context.req.query()),
    ]);

    const invalidRequest = !body.success || !params.success || !query.success;

    if (invalidRequest) {
      return context.json(failure("Invalid request"), 400);
    }

    const validatedContext = context as RequestContext<Body, Params, Query>;
    validatedContext.validatedReq = {
      body: body.data,
      params: params.data,
      query: query.data,
    };

    await next();
  };
