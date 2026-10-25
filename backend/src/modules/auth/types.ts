import type { User } from '../user/types';

/** Defines credentials accepted by the login endpoint. */
export interface LoginInput {
  readonly identifier: string;
  readonly password: string;
}

/** Defines a refresh command submitted by an existing session. */
export interface RefreshInput {
  readonly refreshToken: string;
}

/** Defines the access and refresh tokens returned after successful authentication. */
export interface AuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
}

/** Defines the authenticated session principal carried by a verified access token. */
export interface AuthPrincipal {
  readonly userId: string;
  readonly sessionId: string;
}

/** Defines authentication behavior independently of HTTP routes. */
export interface AuthService {
  login(input: LoginInput): Promise<AuthTokens | null>;
  refresh(input: RefreshInput): Promise<AuthTokens | null>;
  logout(input: RefreshInput): Promise<void>;
  me(principal: AuthPrincipal): Promise<User | null>;
}
