import { Hono } from 'hono';
import { createDatabase } from './modules/LocalSqLiteDatabase';
import { registerApi, type ApiBindings } from './modules/api';
import { registerExpensesRoutes } from './modules/expenses/controller';
import { registerNotesRoutes } from './modules/notes/controller';
import { registerTagRoutes } from './modules/tags/controller';
import { registerTaskRoutes } from './modules/tasks/controller';

/** Hosts the HTTP API in Cloudflare's serverless runtime. */
const app = new Hono<{ Bindings: ApiBindings }>();
const dependencies = { app, database: createDatabase };

registerApi(dependencies);
registerTagRoutes(dependencies);
registerNotesRoutes(dependencies);
registerTaskRoutes(dependencies);
registerExpensesRoutes(dependencies);

export default app;
