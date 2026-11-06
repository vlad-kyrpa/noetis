import { ApiFailureKind } from '../../../common/api/types';
import type { ApiFailure } from '../../../common/api/types';
import { fail, ok } from '../../../common/result/result';
import type { Result } from '../../../common/result/types';
import type { TokenPair } from '../../../common/token-storage/types';
import { toAuthFormFailure } from '../api/form-failure';
import { RefreshFailure, SessionEvent } from './types';
import type {
  AuthSession,
  AuthSessionDependencies,
  RefreshResult,
  RefreshTokenFactory,
  SessionListener,
} from './types';

const SERVER_ERROR_STATUS = 500;

interface PendingRefresh {
  current: Promise<RefreshResult> | null;
}

// Separates "the refresh token is dead" from "the server could not be reached right now",
// so a user who goes offline or hits a 5xx is not logged out.
const classifyRefreshFailure = (failure: ApiFailure): RefreshFailure => {
  const isTransportFailure = failure.kind === ApiFailureKind.Network;
  const isServerFailure =
    failure.kind === ApiFailureKind.Http && failure.status >= SERVER_ERROR_STATUS;

  return isTransportFailure || isServerFailure ? RefreshFailure.Network : RefreshFailure.Rejected;
};

// Creates the single stateful auth core: it owns the tokens, de-duplicates refreshes, and
// tells subscribers when the session starts, rotates, expires, or ends.
export const createAuthSession = ({
  authApi,
  tokenStorage,
}: AuthSessionDependencies): AuthSession => {
  const listeners = new Set<SessionListener>();
  const pendingRefresh: PendingRefresh = { current: null };

  // Notifies every subscriber about a session lifecycle change.
  const emit = (event: SessionEvent): void => listeners.forEach((listener) => listener(event));

  // Drops credentials that can no longer be refreshed and reports the session as expired.
  const expire = (failure: RefreshFailure): RefreshResult => {
    tokenStorage.clearTokens();
    emit(SessionEvent.Expired);

    return fail(failure);
  };

  // Stores a rotated pair, or decides whether a failed refresh should end the session.
  const settleRefresh = (result: Result<TokenPair, ApiFailure>): RefreshResult => {
    if (result.ok) {
      tokenStorage.storeTokens(result.value);
      emit(SessionEvent.Refreshed);

      return result;
    }

    const failure = classifyRefreshFailure(result.error);

    return failure === RefreshFailure.Rejected ? expire(failure) : fail(failure);
  };

  // Exchanges the stored refresh token for a new pair.
  const startRefresh = async (): Promise<RefreshResult> => {
    const refreshToken = tokenStorage.getRefreshToken();

    if (refreshToken === null) {
      return expire(RefreshFailure.NoRefreshToken);
    }

    return settleRefresh(await authApi.refresh({ refreshToken }));
  };

  // Shares one in-flight refresh between concurrent callers, because the backend rotates the
  // refresh token and a second call with the old token would be rejected.
  const refreshTokenFactory: RefreshTokenFactory = () => {
    if (pendingRefresh.current !== null) {
      return pendingRefresh.current;
    }

    const refresh = startRefresh().finally(() => {
      pendingRefresh.current = null;
    });
    pendingRefresh.current = refresh;

    return refresh;
  };

  return {
    // Reads the current access token straight from storage so it always reflects the latest rotation.
    accessTokenFactory: () => tokenStorage.getAccessToken(),
    // Reports whether there are any stored credentials worth verifying on startup.
    hasSession: () =>
      tokenStorage.getRefreshToken() !== null || tokenStorage.getAccessToken() !== null,
    // Exchanges credentials for tokens and announces the new session.
    login: async (input) => {
      const result = await authApi.login(input);

      if (!result.ok) {
        return fail(toAuthFormFailure(result.error));
      }

      tokenStorage.storeTokens(result.value);
      emit(SessionEvent.SignedIn);

      return ok(undefined);
    },
    // Ends the session locally first so the UI reacts at once, then revokes it on the backend best-effort.
    logout: async () => {
      const refreshToken = tokenStorage.getRefreshToken();
      tokenStorage.clearTokens();
      emit(SessionEvent.SignedOut);

      if (refreshToken !== null) {
        await authApi.logout({ refreshToken });
      }
    },
    refreshTokenFactory,
    // Registers a lifecycle listener and returns its unsubscribe function for effect cleanup.
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
};
