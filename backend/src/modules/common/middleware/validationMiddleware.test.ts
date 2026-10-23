import { strict as assert } from "node:assert";
import test from "node:test";
import { Hono } from "hono";
import { z } from "zod";
import type { EmptyObject } from "../types";
import {
  type EndpointValidationSchema,
  validatedHandler,
  validationMiddlewareFactory,
} from "./validationMiddleware";

/** Verifies validated body, params, and query are delivered through one typed context. */
test("validation middleware exposes validated request data to the handler", async () => {
  const schema: EndpointValidationSchema<
    { readonly amount: number },
    { readonly id: string },
    { readonly preview: "true" | "false" }
  > = {
    body: z.object({ amount: z.number() }),
    params: z.object({ id: z.string().uuid() }),
    query: z.object({ preview: z.enum(["true", "false"]) }),
  };
  const app = new Hono();
  app.post(
    "/:id",
    validationMiddlewareFactory(schema),
    validatedHandler(async (context): Promise<Response> =>
      context.json(context.validatedReq),
    ),
  );

  const response = await app.request(
    "/f47ac10b-58cc-4372-a567-0e02b2c3d479?preview=true",
    { method: "POST", body: JSON.stringify({ amount: 42 }) },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    body: { amount: 42 },
    params: { id: "f47ac10b-58cc-4372-a567-0e02b2c3d479" },
    query: { preview: "true" },
  });
});

/** Verifies malformed request parts cannot reach a validated endpoint handler. */
test("validation middleware rejects invalid request data", async () => {
  const schema: EndpointValidationSchema<undefined, EmptyObject, EmptyObject> = {
    body: z.undefined(),
    params: z.object({}),
    query: z.object({}),
  };
  const app = new Hono();
  app.post("/", validationMiddlewareFactory(schema), (context) => context.text("accepted"));

  const response = await app.request("/", {
    method: "POST",
    body: JSON.stringify({ unexpected: "value" }),
  });

  assert.equal(response.status, 400);
});
