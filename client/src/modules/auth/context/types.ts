import type { ReactNode } from 'react';
import type { Result } from '../../../common/result/types';
import type { AuthSession } from '../session/types';
import type {
  AuthApi,
  AuthClient,
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
  login: (input: LoginInput) => AuthFormResult<AuthenticatedUser>;
  logout: () => Promise<void>;
  register: (input: RegisterInput) => AuthFormResult<AuthenticatedUser>;
  retry: () => Promise<void>;
  status: AuthStatus;
  user: AuthenticatedUser | null;
}

export interface AuthProviderProps {
  authApi: AuthApi;
  authClient: AuthClient;
  children: ReactNode;
  session: AuthSession;
}
