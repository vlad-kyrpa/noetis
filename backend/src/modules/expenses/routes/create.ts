import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, RouteHandlerDependencies } from '../../common/types';
import { success } from '../../common/utils/result';
import { expenseServiceFactory } from '../services/expense-service';
import type { ExpenseInput } from '../types';
import { z } from 'zod';

/** Represents the absence of path parameters on the create endpoint. */
export type CreateExpenseParams = EmptyObject;
/** Represents the absence of query parameters on the create endpoint. */
export type CreateExpenseQuery = EmptyObject;
/** Gives the create handler its endpoint-specific validated request contract. */
export type CreateExpenseRequestContext = RequestContext<
  ExpenseInput,
  CreateExpenseParams,
  CreateExpenseQuery
>;

/** Defines the accepted request shape for creating an expense. */
export const createExpenseSchema: EndpointValidationSchema<
  ExpenseInput,
  CreateExpenseParams,
  CreateExpenseQuery
> = {
  body: z.object({
    amount: z.number(),
    description: z.string().nullable(),
    tagIds: z.array(z.string()),
  }),
  params: z.object({}),
  query: z.object({}),
};

/** Validates every request part required by the create endpoint. */
export const validateCreateExpense = validationMiddlewareFactory(createExpenseSchema);

/** Creates the handler that persists one already-validated expense record. */
export const createExpenseHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: CreateExpenseRequestContext): Promise<Response> => {
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    return context.json(
      success(await expenseServiceFactory(database).create(context.validatedReq.body)),
      201,
    );
  });
