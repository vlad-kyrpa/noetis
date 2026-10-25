import type { ApiDependencies } from '../api';
import { accessAuthenticationMiddleware } from './middleware/auth-middleware';
import { loginHandler, validateLogin } from './routes/login';
import { logoutHandler, validateLogout } from './routes/logout';
import { meHandler } from './routes/me';
import { tokenHandler, validateToken } from './routes/token';

/** Connects each Auth handler factory to its public HTTP path. */
export const registerAuthRoutes = (dependencies: ApiDependencies): void => {
  const { app, databaseFactory } = dependencies;
  app.post('/api/auth/login', validateLogin, loginHandler({ databaseFactory }));
  app.post('/api/auth/token', validateToken, tokenHandler({ databaseFactory }));
  app.post('/api/auth/logout', validateLogout, logoutHandler({ databaseFactory }));
  app.get('/api/auth/me', accessAuthenticationMiddleware, meHandler({ databaseFactory }));
};
