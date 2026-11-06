import { ApiFailureKind } from '../../../common/api/types';
import type { ApiFailure } from '../../../common/api/types';
import { fail } from '../../../common/result/result';
import type { Result } from '../../../common/result/types';
import { RefreshFailure } from '../session/types';
import type { AuthenticatedUser } from '../types';
import type { FetchCurrentUserParams } from './types';

const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';

const MISSING_ACCESS_TOKEN: ApiFailure = {
  kind: ApiFailureKind.Unauthorized,
  message: SESSION_EXPIRED_MESSAGE,
};

const REFRESH_FAILURES: Readonly<Record<RefreshFailure, ApiFailure>> = {
  [RefreshFailure.NoRefreshToken]: MISSING_ACCESS_TOKEN,
  [RefreshFailure.Rejected]: MISSING_ACCESS_TOKEN,
  [RefreshFailure.Network]: { kind: ApiFailureKind.Network },
};

// Loads the signed-in profile, refreshing once on 401 so an expired access token is renewed
// silently. Phase 4 replaces this with the shared backend client, which does the same for
// every request.
export const fetchCurrentUser = async ({
  authApi,
  session,
}: FetchCurrentUserParams): Promise<Result<AuthenticatedUser, ApiFailure>> => {
  const accessToken = session.accessTokenFactory();
  const firstAttempt =
    accessToken === null ? fail(MISSING_ACCESS_TOKEN) : await authApi.me(accessToken);

  if (firstAttempt.ok || firstAttempt.error.kind !== ApiFailureKind.Unauthorized) {
    return firstAttempt;
  }

  const refreshed = await session.refreshTokenFactory();

  return refreshed.ok
    ? authApi.me(refreshed.value.accessToken)
    : fail(REFRESH_FAILURES[refreshed.error]);
};
