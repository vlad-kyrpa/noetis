import { drizzle } from "drizzle-orm/d1";
import { schema } from "../database/schema";
import type { Database } from "./Database";
/** Creates the D1-backed database adapter used by Wrangler requests. */
export const createDatabase = (binding: D1Database): Database => drizzle(binding, { schema });
