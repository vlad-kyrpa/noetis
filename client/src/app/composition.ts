import { http } from '../common/api/http';
import { createBrowserTokenStorage } from '../common/token-storage/browser-token-storage';
import { createAuthApi } from '../modules/auth/api/auth-api';
import { createAuthSession } from '../modules/auth/session/create-auth-session';

export const API_BASE_URL = '/api';

// Composition root: the app's stateful objects are created exactly once, here, and passed down.
export const tokenStorage = createBrowserTokenStorage();

export const authApi = createAuthApi({ baseUrl: API_BASE_URL, methods: http });

export const authSession = createAuthSession({ authApi, tokenStorage });
