import type { ApiDependencies } from '../api';
import { createExpenseHandler, validateCreateExpense } from './routes/create';
import { getExpensesHandler, validateGetExpenses } from './routes/get';
import { removeExpensesHandler, validateRemoveExpenses } from './routes/remove';
import { updateExpenseHandler, validateUpdateExpense } from './routes/update';

/** Connects each Expenses handler factory to its public HTTP path. */
export const registerExpensesRoutes = (dependencies: ApiDependencies): void => {
  const { app, databaseFactory } = dependencies;
  app.post('/api/expenses', validateCreateExpense, createExpenseHandler({ databaseFactory }));
  app.get('/api/expenses', validateGetExpenses, getExpensesHandler({ databaseFactory }));
  app.put('/api/expenses/:id', validateUpdateExpense, updateExpenseHandler({ databaseFactory }));
  app.delete('/api/expenses', validateRemoveExpenses, removeExpensesHandler({ databaseFactory }));
};
