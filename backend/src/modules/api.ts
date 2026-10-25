import type { Hono } from 'hono';
import type { AuthPrincipal } from './auth/types';
import type { Database } from './Database';
import { failure } from './common/utils/result';

/** Describes the D1 binding exposed to every API route. */
export interface ApiBindings {
  readonly DB: D1Database;
  readonly AUTH_TOKEN_SECRET: string;
  readonly ALLOW_REGISTRATIONS: string;
}

/** Defines request-scoped values made available by API middleware. */
export interface ApiVariables {
  readonly authPrincipal: AuthPrincipal;
}

/** Defines the Hono environment shared by every API controller. */
export interface ApiEnvironment {
  readonly Bindings: ApiBindings;
  readonly Variables: ApiVariables;
}

/** Describes dependencies shared by feature module controllers. */
export interface ApiDependencies {
  readonly app: Hono<ApiEnvironment>;
  readonly databaseFactory: (binding: D1Database) => Database;
}

/** Installs API-wide behavior that does not belong to a feature module. */
export const registerApi = (params: ApiDependencies): void => {
  const healthHandler = (context: { readonly json: (value: { readonly ok: true }) => Response }) =>
    context.json({ ok: true });
  params.app.get('/api/health', healthHandler);
  params.app.post('/api/health', healthHandler);
  params.app.notFound((context) => context.json(failure('Not found'), 404));
};
