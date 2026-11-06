import type { ReactNode } from 'react';
import type { Result } from '../../../common/result/types';
import type { AccessTokenFactory, AuthSession, RefreshTokenFactory } from '../session/types';
import type {
  AuthApi,
  AuthenticatedUser,
  AuthFormFailure,
  LoginInput,
  RegisterInput,
} from '../types';

// `Unavailable` means tokens exist but the server could not confirm them (offline, 5xx), so
// the user is not sent to the login page.
export enum AuthStatus {
  Checking,
  Authenticated,
  Unauthenticated,
  Unavailable,
}

export type AuthFormResult<Value> = Promise<Result<Value, AuthFormFailure>>;

export interface AuthContextValue {
  accessTokenFactory: AccessTokenFactory;
  login: (input: LoginInput) => AuthFormResult<AuthenticatedUser>;
  logout: () => Promise<void>;
  refreshTokenFactory: RefreshTokenFactory;
  register: (input: RegisterInput) => AuthFormResult<AuthenticatedUser>;
  retry: () => Promise<void>;
  status: AuthStatus;
  user: AuthenticatedUser | null;
}

export interface AuthProviderProps {
  authApi: AuthApi;
  children: ReactNode;
  session: AuthSession;
}

export interface FetchCurrentUserParams {
  authApi: AuthApi;
  session: AuthSession;
}
