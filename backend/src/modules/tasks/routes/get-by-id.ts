import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from "../../common/middleware/validationMiddleware";
import { type EmptyObject, RouteHandlerDependencies } from "../../common/types";
import { failure, success } from "../../common/utils/result";
import { taskServiceFactory } from "../services/task-service";
import { z } from "zod";

/** Defines the path parameters accepted by the Task lookup endpoint. */
export interface GetTaskParams {
  readonly id: string;
}

/** Represents the absence of a JSON body on the Task lookup endpoint. */
export type GetTaskBody = undefined;
/** Represents the absence of query parameters on the Task lookup endpoint. */
export type GetTaskQuery = EmptyObject;
/** Gives the lookup handler its endpoint-specific validated request contract. */
export type GetTaskRequestContext = RequestContext<
  GetTaskBody,
  GetTaskParams,
  GetTaskQuery
>;

/** Defines the accepted request shape for looking up one task. */
export const getTaskSchema: EndpointValidationSchema<
  GetTaskBody,
  GetTaskParams,
  GetTaskQuery
> = {
  body: z.undefined(),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
};

/** Validates every request part required by the Task lookup endpoint. */
export const validateGetTask = validationMiddlewareFactory(getTaskSchema);

/** Creates the handler that looks up one already-validated Task identifier. */
export const getTaskHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(
    async (context: GetTaskRequestContext): Promise<Response> => {
      const database = dependencies.databaseFactory(
        (context.env as { readonly DB: D1Database }).DB,
      );
      const task = (
        await taskServiceFactory(database).get([
          context.validatedReq.params.id,
        ])
      )[0];
      return task === undefined
        ? context.json(failure("Task not found"), 404)
        : context.json(success(task));
    },
  );
