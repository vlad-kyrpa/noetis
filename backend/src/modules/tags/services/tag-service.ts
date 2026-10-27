import { and, eq, inArray, like, sql } from 'drizzle-orm';
import { tags } from '../../../database/schema';
import type { Database } from '../../Database';
import type { TagsService } from '../types';

/** Builds the documented Tags service on top of the D1 database abstraction. */
export const tagServiceFactory = (params: {
  readonly database: Database;
  readonly userId: string;
}): TagsService => {
  const { database, userId } = params;
  return {
    create: async (input) => {
      const rows = await database
        .insert(tags)
        .values({ id: crypto.randomUUID(), userId, label: input.label, createdAt: new Date() })
        .onConflictDoNothing()
        .returning();
      return rows[0] ?? null;
    },
    find: async (label) =>
      label === null
        ? database.select().from(tags).where(eq(tags.userId, userId)).orderBy(tags.label)
        : database
            .select()
            .from(tags)
            .where(
              and(
                eq(tags.userId, userId),
                like(sql`lower(${tags.label})`, `%${label.toLowerCase()}%`),
              ),
            )
            .orderBy(tags.label),
    remove: async (ids) => {
      await database.delete(tags).where(and(eq(tags.userId, userId), inArray(tags.id, ids)));
    },
  };
};
