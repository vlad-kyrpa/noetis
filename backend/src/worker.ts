import { Hono } from 'hono';
import { createDatabase } from './modules/LocalSqLiteDatabase';
import { registerApi, type ApiEnvironment } from './modules/api';
import { registerAuthRoutes } from './modules/auth/controller';
import { registerExpensesRoutes } from './modules/expenses/controller';
import { registerNotesRoutes } from './modules/notes/controller';
import { registerTagRoutes } from './modules/tags/controller';
import { registerTaskRoutes } from './modules/tasks/controller';
import { registerUserRoutes } from './modules/user/controller';
import { registerViewRoutes } from './modules/views/controller';

/** Hosts the HTTP API in Cloudflare's serverless runtime. */
const app = new Hono<ApiEnvironment>();
const dependencies = { app, databaseFactory: createDatabase };

registerApi(dependencies);
registerAuthRoutes(dependencies);
registerTagRoutes(dependencies);
registerNotesRoutes(dependencies);
registerTaskRoutes(dependencies);
registerExpensesRoutes(dependencies);
registerViewRoutes(dependencies);
registerUserRoutes(dependencies);

export default app;
