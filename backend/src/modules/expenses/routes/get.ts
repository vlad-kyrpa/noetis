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
import type { ExpenseFilters } from "../types";

/** Represents the absence of a JSON body on the Expense list endpoint. */
export type GetExpensesBody = undefined;
/** Represents the absence of path parameters on the Expense list endpoint. */
export type GetExpensesParams = EmptyObject;
/** Gives the list handler its endpoint-specific validated request contract. */
export type GetExpensesRequestContext = RequestContext<
  GetExpensesBody,
  GetExpensesParams,
  ExpenseFilters
>;

/** Defines the accepted request shape for listing expenses. */
export const getExpensesSchema: EndpointValidationSchema<
  GetExpensesBody,
  GetExpensesParams,
  ExpenseFilters
> = {
  body: z.undefined(),
  params: z.object({}),
  query: z
    .object({
      tagId: z.string().optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    })
    .transform(({ tagId, from, to }) => ({ tagId, from, to })),
};

/** Validates every request part required by the Expense list endpoint. */
export const validateGetExpenses =
  validationMiddlewareFactory(getExpensesSchema);

/** Creates the handler that finds expenses using validated filters. */
export const getExpensesHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(
    async (context: GetExpensesRequestContext): Promise<Response> => {
      const database = dependencies.databaseFactory(
        (context.env as { readonly DB: D1Database }).DB,
      );
      return context.json(
        success(
          await expenseServiceFactory(database).find(
            context.validatedReq.query,
          ),
        ),
      );
    },
  );
