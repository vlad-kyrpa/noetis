import { defineConfig } from "drizzle-kit";

/** Defines the schema source and SQL migration output for the D1 database. */
export default defineConfig({
  dialect: "sqlite",
  out: "./drizzle",
  schema: "./src/database/schema.ts",
});
