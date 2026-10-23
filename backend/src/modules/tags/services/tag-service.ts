import { like, sql } from "drizzle-orm";
import { tags } from "../../../database/schema";
import type { Database } from "../../Database";
import type { TagsService } from "../types";

/** Builds the documented Tags service on top of the D1 database abstraction. */
export const tagServiceFactory = (database: Database): TagsService => ({
  create: async (input) => {
    await database
      .insert(tags)
      .values({ id: crypto.randomUUID(), label: input.label, createdAt: new Date() })
      .onConflictDoNothing();
    const tag = await database
      .select()
      .from(tags)
      .where(sql`${tags.label} = ${input.label}`)
      .get();
    if (tag === undefined) throw new Error("Created tag was not found");
    return tag;
  },
  find: async (label) => label === null
    ? database.select().from(tags).orderBy(tags.label)
    : database.select().from(tags).where(like(sql`lower(${tags.label})`, `%${label.toLowerCase()}%`)).orderBy(tags.label),
});
