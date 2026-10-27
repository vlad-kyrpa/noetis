import { drizzle } from 'drizzle-orm/d1';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTestHarness, type TestHarness } from 'wrangler';
import {
  expenses,
  noteLinks,
  noteTags,
  noteTasks,
  notes,
  schema,
  tags,
  taskLinks,
  taskNotes,
  tasks,
  userRefreshTokens,
  users,
  viewTags,
  views,
} from '../database/schema';
import type { Database } from '../modules/Database';
import type { ApiBindings } from '../modules/api';
import { createToken } from '../modules/auth/services/token-utils';

/**
 * Builds an integration-test boundary around the real Worker.
 *
 * Wrangler's test harness creates an isolated local D1 instance for every harness. The harness
 * applies the SQL files in `drizzle/` before returning and deletes its storage when `close()`
 * stops the Worker. `database` and `fetch` therefore observe the same temporary state without
 * ever connecting to development or remote D1.
 */

/** Defines the portable portion of an HTTP response used by API integration tests. */
export interface ApiTestResponse {
  readonly status: number;
  json: () => Promise<unknown>;
}

/** Defines the JSON request fields shared by the Worker and Node test runtimes. */
export interface ApiTestRequest {
  readonly method?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: string;
  readonly authenticated?: boolean;
}

/** Exposes an isolated local Worker and its D1 database to API integration tests. */
export interface ApiTestContext {
  readonly database: Database;
  readonly fetch: (path: string, init?: ApiTestRequest) => Promise<ApiTestResponse>;
  readonly reset: () => Promise<void>;
  readonly close: () => Promise<void>;
}

/** Anchors the Wrangler config lookup to the backend project regardless of the invoking directory. */
const backendRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
/** Supplies the account represented by the default authenticated test request. */
const e2eUser = {
  id: 'e2e-test-user',
  username: 'e2e-user',
  email: 'e2e@example.test',
  passwordHash: 'unused',
  passwordSalt: 'unused',
  createdAt: new Date(),
  updatedAt: new Date(),
};

/** Clears all records in dependency order so the next test observes an empty migrated database. */
const resetApiDatabase = async (database: Database): Promise<void> => {
  // Remove join rows before their referenced records to satisfy the database foreign keys.
  await Promise.all([
    database.delete(userRefreshTokens),
    database.delete(noteTags),
    database.delete(noteTasks),
    database.delete(noteLinks),
    database.delete(taskLinks),
    database.delete(taskNotes),
    database.delete(viewTags),
  ]);
  // Records may still reference tags, so remove them before deleting the shared labels.
  await Promise.all([
    database.delete(expenses),
    database.delete(tasks),
    database.delete(notes),
    database.delete(views),
    database.delete(users),
  ]);
  await database.delete(tags);
  await database.insert(users).values(e2eUser);
};

/** Starts a fresh Worker, migrates its D1 binding, and returns request and seed-state access. */
export const createApiTestContext = async (): Promise<ApiTestContext> => {
  // The harness owns its storage, so every context begins with an empty local D1 database.
  const harness: TestHarness = createTestHarness({
    root: backendRoot,
    workers: [{ configPath: './wrangler.e2e.jsonc' }],
  });
  try {
    await harness.listen();
    // Apply production migrations rather than duplicating schema setup in the test harness.
    const worker = harness.getWorker<ApiBindings>();
    await worker.applyD1Migrations('DB');
    const bindings = await worker.getEnv();
    const database = drizzle(bindings.DB, { schema });
    await resetApiDatabase(database);
    const accessToken = await createToken({
      secret: bindings.AUTH_TOKEN_SECRET,
      userId: 'e2e-test-user',
      sessionId: 'e2e-test-session',
      kind: 'access',
      expiresInMs: 60 * 60 * 1000,
    });

    return {
      database,
      fetch: (path, init = {}): Promise<ApiTestResponse> => {
        const { authenticated = true, headers, ...request } = init;
        const authorization = authenticated ? { authorization: `Bearer ${accessToken}` } : {};
        return harness.fetch(path, { ...request, headers: { ...authorization, ...headers } });
      },
      // Reuse the expensive Worker process while restoring the database to its empty migrated state.
      reset: (): Promise<void> => resetApiDatabase(database),
      // Closing the harness disposes its temporary D1 storage after the test completes.
      close: (): Promise<void> => harness.close(),
    };
  } catch (error: unknown) {
    // A failed startup can still allocate Worker handles, so release them before propagating the cause.
    await harness.close();
    throw error;
  }
};
