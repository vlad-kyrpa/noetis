import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { expenses, tags } from '../../../database/schema';
import type { Database } from '../../Database';
import { resolveTags } from '../../tags/services/resolve-tags';
import type { ExpenseFilters, ExpenseInput, ExpenseRecord, ExpensesService } from '../types';

/** Converts a stored expense's internal tag reference into the public tag-label contract. */
const hydrateExpense = async (params: {
  readonly database: Database;
  readonly expense: typeof expenses.$inferSelect;
}): Promise<ExpenseRecord> => {
  const { database, expense } = params;
  const tag =
    expense.tagId === null
      ? undefined
      : await database
          .select({ label: tags.label })
          .from(tags)
          .where(eq(tags.id, expense.tagId))
          .get();
  const { tagId, ...record } = expense;
  return { ...record, tag: tag?.label ?? null };
};

/** Builds the documented Expenses service on top of the D1 database abstraction. */
export const expenseServiceFactory = (params: { readonly database: Database; readonly userId: string }): ExpensesService => {
  const { database, userId } = params;
  return ({
  create: async (input: ExpenseInput) => {
    const id = crypto.randomUUID();
    const now = new Date();
    const tag =
      input.tag === null ? undefined : (await resolveTags({ database, userId, labels: [input.tag] }))[0];
    const tagId = tag?.id ?? null;
    const rows = await database
      .insert(expenses)
      .values({
        id,
        userId,
        amount: input.amount,
        description: input.description,
        tagId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const record = rows[0];
    if (record === undefined) {
      throw new Error('Created expense was not found');
    }

    return hydrateExpense({ database, expense: record });
  },

  update: async ({ id, input }) => {
    const tag =
      input.tag === null ? undefined : (await resolveTags({ database, userId, labels: [input.tag] }))[0];
    const tagId = tag?.id ?? null;
    const rows = await database
      .update(expenses)
      .set({ amount: input.amount, description: input.description, tagId, updatedAt: new Date() })
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning();
    const record = rows[0];
    return record === undefined ? null : hydrateExpense({ database, expense: record });
  },

  remove: async (ids) => {
    await database.delete(expenses).where(and(eq(expenses.userId, userId), inArray(expenses.id, ids)));
  },

  find: async (filters: ExpenseFilters) => {
    const tag =
      filters.tag === undefined
        ? undefined
        : await database
            .select({ id: tags.id })
            .from(tags)
            .where(and(eq(tags.userId, userId), eq(tags.label, filters.tag)))
            .get();
    const conditions = [eq(expenses.userId, userId),
      filters.tag === undefined
        ? undefined
        : tag === undefined
          ? sql`0`
          : eq(expenses.tagId, tag.id),
      filters.from === undefined ? undefined : gte(expenses.createdAt, filters.from),
      filters.to === undefined ? undefined : lte(expenses.createdAt, filters.to),
    ].filter((condition) => condition !== undefined);

    const records = await database
      .select()
      .from(expenses)
      .where(conditions.length === 0 ? undefined : and(...conditions))
      .orderBy(desc(expenses.createdAt));
    return Promise.all(records.map((expense) => hydrateExpense({ database, expense })));
  },
  });
};
