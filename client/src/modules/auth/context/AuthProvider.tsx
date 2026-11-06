import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { ApiFailureKind } from '../../../common/api/types';
import type { ApiFailure } from '../../../common/api/types';
import { fail } from '../../../common/result/result';
import type { Result } from '../../../common/result/types';
import { toAuthFormFailure } from '../api/form-failure';
import { SessionEvent } from '../session/types';
import type { AuthenticatedUser } from '../types';
import { AuthContext } from './auth-context';
import { AuthStatus } from './types';
import type { AuthContextValue, AuthProviderProps } from './types';

// Leaves state alone for events the provider already handles elsewhere (login fetches `me` itself).
const ignoreSessionEvent = (): void => undefined;

// Adapts the auth session to React: holds the current user and status, and exposes the
// session's actions and token factories to the component tree.
export function AuthProvider({
  authApi,
  authClient,
  children,
  session,
}: AuthProviderProps): ReactElement {
  const [status, setStatus] = useState<AuthStatus>(() =>
    session.hasSession() ? AuthStatus.Checking : AuthStatus.Unauthenticated,
  );
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  // Moves the provider into the state that matches a profile lookup outcome.
  const applyUserResult = useCallback((result: Result<AuthenticatedUser, ApiFailure>): void => {
    if (result.ok) {
      setUser(result.value);
      setStatus(AuthStatus.Authenticated);
      return;
    }

    setUser(null);
    setStatus(
      result.error.kind === ApiFailureKind.Unauthorized
        ? AuthStatus.Unauthenticated
        : AuthStatus.Unavailable,
    );
  }, []);

  // Restores a stored session once on mount; the guard ignores late results after unmount.
  useEffect(() => {
    if (!session.hasSession()) {
      return;
    }

    const mounted = { current: true };
    void authClient.me().then((result) => {
      if (mounted.current) {
        applyUserResult(result);
      }
    });

    return () => {
      mounted.current = false;
    };
  }, [applyUserResult, authClient, session]);

  // Signs the UI out whenever the session ends, including a failed refresh mid-request.
  useEffect(() => {
    const signOut = (): void => {
      setUser(null);
      setStatus(AuthStatus.Unauthenticated);
    };
    const handlers: Readonly<Record<SessionEvent, () => void>> = {
      [SessionEvent.SignedIn]: ignoreSessionEvent,
      [SessionEvent.Refreshed]: ignoreSessionEvent,
      [SessionEvent.Expired]: signOut,
      [SessionEvent.SignedOut]: signOut,
    };

    return session.subscribe((event) => handlers[event]());
  }, [session]);

  const login = useCallback<AuthContextValue['login']>(
    async (input) => {
      const signedIn = await session.login(input);

      if (!signedIn.ok) {
        return signedIn;
      }

      const result = await authClient.me();
      applyUserResult(result);

      return result.ok ? result : fail(toAuthFormFailure(result.error));
    },
    [applyUserResult, authClient, session],
  );

  const register = useCallback<AuthContextValue['register']>(
    async (input) => {
      const result = await authApi.register(input);

      return result.ok ? result : fail(toAuthFormFailure(result.error));
    },
    [authApi],
  );

  const retry = useCallback<AuthContextValue['retry']>(async () => {
    setStatus(AuthStatus.Checking);
    applyUserResult(await authClient.me());
  }, [applyUserResult, authClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      login,
      logout: session.logout,
      register,
      retry,
      status,
      user,
    }),
    [login, register, retry, session, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
