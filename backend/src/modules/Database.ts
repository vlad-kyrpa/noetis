import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { schema } from "../database/schema";
/** Describes the database capability required by feature services. */
export type Database = DrizzleD1Database<typeof schema>;
