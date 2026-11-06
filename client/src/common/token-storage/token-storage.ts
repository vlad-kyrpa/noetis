import type { TokenStorage, TokenStorageDependencies } from './types';

const ACCESS_TOKEN_KEY = 'noetis.access-token';
const REFRESH_TOKEN_KEY = 'noetis.refresh-token';

// Creates a browser storage adapter that keeps authentication credentials under separate keys.
export const createTokenStorage = ({ storage }: TokenStorageDependencies): TokenStorage => ({
  // Clears the stored access token when a session becomes invalid.
  clearAccessToken: (): void => storage.removeItem(ACCESS_TOKEN_KEY),
  // Clears the stored refresh token when a refresh session must be revoked.
  clearRefreshToken: (): void => storage.removeItem(REFRESH_TOKEN_KEY),
  // Clears both tokens together during logout or authentication recovery.
  clearTokens: (): void => {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
  },
  // Reads the access credential used for authorized API calls.
  getAccessToken: (): string | null => storage.getItem(ACCESS_TOKEN_KEY),
  // Reads the durable credential used to restore an expired session.
  getRefreshToken: (): string | null => storage.getItem(REFRESH_TOKEN_KEY),
  // Persists both credentials in the configured storage adapter.
  storeTokens: ({ accessToken, refreshToken }): void => {
    storage.setItem(ACCESS_TOKEN_KEY, accessToken);
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
});
