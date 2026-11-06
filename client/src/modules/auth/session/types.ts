import type { AccessTokenFactory, RefreshTokenFactory } from '../../../common/backend-client/types';
import type { Result } from '../../../common/result/types';
import type { TokenStorage } from '../../../common/token-storage/types';
import type { AuthApi, AuthFormFailure, LoginInput } from '../types';

// The token factories are the seam between auth and the backend client, so they are defined
// next to the client and re-exported here for auth code.
export { RefreshFailure } from '../../../common/backend-client/types';
export type {
  AccessTokenFactory,
  RefreshResult,
  RefreshTokenFactory,
} from '../../../common/backend-client/types';

export enum SessionEvent {
  SignedIn,
  Refreshed,
  Expired,
  SignedOut,
}

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
