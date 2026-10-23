import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { expenses } from "../../../database/schema";
import type { Database } from "../../Database";
import type { ExpenseFilters, ExpenseInput, ExpensesService } from "../types";

/** Builds the documented Expenses service on top of the D1 database abstraction. */
export const expenseServiceFactory = (database: Database): ExpensesService => ({
  create: async (input: ExpenseInput) => {
    const id = crypto.randomUUID();
    const now = new Date();
    const rows = await database
      .insert(expenses)
      .values({ id, ...input, createdAt: now, updatedAt: now })
      .returning();

    const record = rows[0];
    if (record === undefined) {
      throw new Error("Created expense was not found");
    }

    return record;
  },

  update: async ({ id, input }) => {
    const rows = await database
      .update(expenses)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(expenses.id, id))
      .returning();
    return rows[0] ?? null;
  },

  remove: async (ids) => {
    await database.delete(expenses).where(inArray(expenses.id, ids));
  },

  find: async (filters: ExpenseFilters) => {
    const conditions = [
      filters.tagId === undefined
        ? undefined
        : eq(expenses.tagId, filters.tagId),
      filters.from === undefined
        ? undefined
        : gte(expenses.createdAt, filters.from),
      filters.to === undefined
        ? undefined
        : lte(expenses.createdAt, filters.to),
    ].filter((condition) => condition !== undefined);

    return database
      .select()
      .from(expenses)
      .where(conditions.length === 0 ? undefined : and(...conditions))
      .orderBy(desc(expenses.createdAt));
  },
});
