import {
  type EndpointValidationSchema,
  type RequestContext,
  validatedHandler,
  validationMiddlewareFactory,
} from '../../common/middleware/validationMiddleware';
import { type EmptyObject, RouteHandlerDependencies } from '../../common/types';
import { failure, success } from '../../common/utils/result';
import { expenseServiceFactory } from '../services/expense-service';
import type { ExpenseInput } from '../types';
import { createExpenseSchema } from './create';
import { z } from 'zod';

/** Defines the path parameters accepted by the Expense update endpoint. */
export interface UpdateExpenseParams {
  readonly id: string;
}

/** Represents the absence of query parameters on the Expense update endpoint. */
export type UpdateExpenseQuery = EmptyObject;
/** Gives the update handler its endpoint-specific validated request contract. */
export type UpdateExpenseRequestContext = RequestContext<
  ExpenseInput,
  UpdateExpenseParams,
  UpdateExpenseQuery
>;

/** Defines the accepted request shape for replacing an expense. */
export const updateExpenseSchema: EndpointValidationSchema<
  ExpenseInput,
  UpdateExpenseParams,
  UpdateExpenseQuery
> = {
  body: createExpenseSchema.body,
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
};

/** Validates every request part required by the Expense update endpoint. */
export const validateUpdateExpense = validationMiddlewareFactory(updateExpenseSchema);

/** Creates the handler that replaces one already-validated expense record. */
export const updateExpenseHandler = (dependencies: RouteHandlerDependencies) =>
  validatedHandler(async (context: UpdateExpenseRequestContext): Promise<Response> => {
    const database = dependencies.databaseFactory((context.env as { readonly DB: D1Database }).DB);
    const record = await expenseServiceFactory(database).update({
      id: context.validatedReq.params.id,
      input: context.validatedReq.body,
    });
    return record === null
      ? context.json(failure('Expense not found'), 404)
      : context.json(success(record));
  });
