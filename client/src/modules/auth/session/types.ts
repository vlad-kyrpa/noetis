import type { Result } from '../../../common/result/types';
import type { TokenPair, TokenStorage } from '../../../common/token-storage/types';
import type { AuthApi, AuthFormFailure, LoginInput } from '../types';

// Why a refresh did not produce a new token pair. Only `Network` keeps the stored tokens.
export enum RefreshFailure {
  NoRefreshToken,
  Rejected,
  Network,
}

export enum SessionEvent {
  SignedIn,
  Refreshed,
  Expired,
  SignedOut,
}

export type RefreshResult = Result<TokenPair, RefreshFailure>;

// Returns the current access token synchronously so request code can inject it as a header.
export type AccessTokenFactory = () => string | null;

// Rotates the token pair; concurrent callers share one in-flight backend call.
export type RefreshTokenFactory = () => Promise<RefreshResult>;

export type SessionListener = (event: SessionEvent) => void;

export interface AuthSessionDependencies {
  authApi: AuthApi;
  tokenStorage: TokenStorage;
}

export interface AuthSession {
  accessTokenFactory: AccessTokenFactory;
  hasSession: () => boolean;
  login: (input: LoginInput) => Promise<Result<void, AuthFormFailure>>;
  logout: () => Promise<void>;
  refreshTokenFactory: RefreshTokenFactory;
  subscribe: (listener: SessionListener) => () => void;
}
