import { inArray, like, sql } from 'drizzle-orm';
import { tags } from '../../../database/schema';
import type { Database } from '../../Database';
import type { TagsService } from '../types';

/** Builds the documented Tags service on top of the D1 database abstraction. */
export const tagServiceFactory = (database: Database): TagsService => ({
  create: async (input) => {
    const rows = await database
      .insert(tags)
      .values({ id: crypto.randomUUID(), label: input.label, createdAt: new Date() })
      .onConflictDoNothing()
      .returning();
    return rows[0] ?? null;
  },
  find: async (label) =>
    label === null
      ? database.select().from(tags).orderBy(tags.label)
      : database
          .select()
          .from(tags)
          .where(like(sql`lower(${tags.label})`, `%${label.toLowerCase()}%`))
          .orderBy(tags.label),
  remove: async (ids) => {
    await database.delete(tags).where(inArray(tags.id, ids));
  },
});
