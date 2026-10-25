import { and, eq } from 'drizzle-orm';
import { tags } from '../../../database/schema';
import type { Database } from '../../Database';
import type { Tag } from '../types';

/** Resolves public tag labels to durable records, creating only labels that do not already exist. */
export const resolveTags = async (params: {
  readonly database: Database;
  readonly userId: string;
  readonly labels: readonly string[];
}): Promise<readonly Tag[]> => {
  const { database, labels, userId } = params;

  return Promise.all(
    labels.map(async (label) => {
      const existing = await database.select().from(tags).where(and(eq(tags.userId, userId), eq(tags.label, label))).get();
      if (existing !== undefined) {
        return existing;
      }

      await database
        .insert(tags)
        .values({ id: crypto.randomUUID(), userId, label, createdAt: new Date() })
        .onConflictDoNothing();
      const created = await database.select().from(tags).where(and(eq(tags.userId, userId), eq(tags.label, label))).get();
      if (created === undefined) {
        throw new Error('Created tag was not found');
      }
      return created;
    }),
  );
};
