import type { ApiDependencies } from '../api';
import { accessAuthenticationMiddleware } from '../auth/middleware/auth-middleware';
import { createExpenseHandler, validateCreateExpense } from './routes/create';
import { getExpensesHandler, validateGetExpenses } from './routes/get';
import { removeExpensesHandler, validateRemoveExpenses } from './routes/remove';
import { updateExpenseHandler, validateUpdateExpense } from './routes/update';

/** Connects each Expenses handler factory to its public HTTP path. */
export const registerExpensesRoutes = (dependencies: ApiDependencies): void => {
  const { app, databaseFactory } = dependencies;
  app.post(
    '/api/expenses',
    accessAuthenticationMiddleware,
    validateCreateExpense,
    createExpenseHandler({ databaseFactory }),
  );
  app.get(
    '/api/expenses',
    accessAuthenticationMiddleware,
    validateGetExpenses,
    getExpensesHandler({ databaseFactory }),
  );
  app.put(
    '/api/expenses/:id',
    accessAuthenticationMiddleware,
    validateUpdateExpense,
    updateExpenseHandler({ databaseFactory }),
  );
  app.delete(
    '/api/expenses',
    accessAuthenticationMiddleware,
    validateRemoveExpenses,
    removeExpensesHandler({ databaseFactory }),
  );
};
