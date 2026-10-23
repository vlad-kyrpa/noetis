import type { Hono } from 'hono';
import type { Database } from './Database';
import { failure } from './common/utils/result';

/** Describes the D1 binding exposed to every API route. */
export interface ApiBindings {
  readonly DB: D1Database;
}

/** Describes dependencies shared by feature module controllers. */
export interface ApiDependencies {
  readonly app: Hono<{ Bindings: ApiBindings }>;
  readonly databaseFactory: (binding: D1Database) => Database;
}

/** Installs API-wide behavior that does not belong to a feature module. */
export const registerApi = (params: ApiDependencies): void => {
  params.app.get('/api/health', (context) => context.json({ ok: true }));
  params.app.notFound((context) => context.json(failure('Not found'), 404));
};
