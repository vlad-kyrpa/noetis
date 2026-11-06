import type { ApiFailure, HttpValidationIssues } from '../../common/api/types';
import type { Result } from '../../common/result/types';
import type { TokenPair } from '../../common/token-storage/types';

export interface LoginInput {
  readonly identifier: string;
  readonly password: string;
}

export interface AuthenticatedUser {
  readonly email: string;
  readonly id: string;
  readonly username: string;
}

export interface RegisterInput {
  readonly email: string;
  readonly password: string;
  readonly username: string;
}

export interface RefreshInput {
  readonly refreshToken: string;
}

// A failure shaped for auth forms: one headline message plus any per-field issues.
export interface AuthFormFailure {
  readonly issues: HttpValidationIssues;
  readonly message: string;
}

export type AuthApiResult<Value> = Promise<Result<Value, ApiFailure>>;

// Unauthenticated auth endpoints; the session uses these to obtain and rotate tokens.
export interface AuthApi {
  login: (input: LoginInput) => AuthApiResult<TokenPair>;
  logout: (input: RefreshInput) => AuthApiResult<null>;
  refresh: (input: RefreshInput) => AuthApiResult<TokenPair>;
  register: (input: RegisterInput) => AuthApiResult<AuthenticatedUser>;
}

// Authenticated auth endpoints, served through the shared backend client (token + refresh).
export interface AuthClient {
  me: () => AuthApiResult<AuthenticatedUser>;
}
