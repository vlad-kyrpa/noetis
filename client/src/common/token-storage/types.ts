export interface BrowserStorage {
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
}

export interface TokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
}

export interface TokenStorageDependencies {
  readonly storage: BrowserStorage;
}

export interface TokenStorage {
  clearAccessToken: () => void;
  clearRefreshToken: () => void;
  clearTokens: () => void;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  storeTokens: (tokens: TokenPair) => void;
}
