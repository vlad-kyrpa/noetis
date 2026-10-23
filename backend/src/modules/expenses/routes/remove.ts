import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from "../../common/middleware/validationMiddleware";
import { type EmptyObject, RouteHandlerDependencies } from "../../common/types";
import { success } from "../../common/utils/result";
import { z } from "zod";
import { expenseServiceFactory } from "../services/expense-service";

/** Defines the command accepted by the Expense delete endpoint. */
export interface RemoveExpensesBody {
  readonly ids: readonly string[];
}

/** Represents the absence of path parameters on the Expense delete endpoint. */
export type RemoveExpensesParams = EmptyObject;
/** Represents the absence of query parameters on the Expense delete endpoint. */
export type RemoveExpensesQuery = EmptyObject;
/** Gives the delete handler its endpoint-specific validated request contract. */
export type RemoveExpensesRequestContext = RequestContext<
  RemoveExpensesBody,
  RemoveExpensesParams,
  RemoveExpensesQuery
>;

/** Defines the accepted request shape for deleting expenses. */
export const removeExpensesSchema: EndpointValidationSchema<
  RemoveExpensesBody,
  RemoveExpensesParams,
  RemoveExpensesQuery
> = {
  body: z.object({ ids: z.array(z.string()) }),
  params: z.object({}),
  query: z.object({}),
};

/** Validates every request part required by the Expense delete endpoint. */
export const validateRemoveExpenses =
  validationMiddlewareFactory(removeExpensesSchema);

/** Creates the handler that removes already-validated Expense record identifiers. */
export const removeExpensesHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(
    async (context: RemoveExpensesRequestContext): Promise<Response> => {
      const body = context.validatedReq.body;
      const database = dependencies.databaseFactory(
        (context.env as { readonly DB: D1Database }).DB,
      );
      await expenseServiceFactory(database).remove(body.ids);
      return context.json(success(body));
    },
  );
