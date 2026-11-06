import { http } from '../common/api/http';
import {
  createBackendClientFactory,
  createModuleClient,
} from '../common/backend-client/create-backend-client-factory';
import { createBrowserTokenStorage } from '../common/token-storage/browser-token-storage';
import { createAuthApi } from '../modules/auth/api/auth-api';
import { authClientModule } from '../modules/auth/api/auth-client';
import { createAuthSession } from '../modules/auth/session/create-auth-session';

export const API_BASE_URL = '/api';

// Composition root: the app's stateful objects are created exactly once, here, and passed down.
export const tokenStorage = createBrowserTokenStorage();

export const authApi = createAuthApi({ baseUrl: API_BASE_URL, methods: http });

export const authSession = createAuthSession({ authApi, tokenStorage });

// Every feature client is built from this factory, so all of them share the session's
// token injection and single-flight refresh.
export const backendClientFactory = createBackendClientFactory({
  accessTokenFactory: authSession.accessTokenFactory,
  baseUrl: API_BASE_URL,
  methods: http,
  refreshTokenFactory: authSession.refreshTokenFactory,
});

export const authClient = createModuleClient({
  factory: backendClientFactory,
  module: authClientModule,
});
