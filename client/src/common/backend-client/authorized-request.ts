import { sendApiRequest } from '../api/api-response';
import { ApiFailureKind } from '../api/types';
import type { ApiFailure, Decoder } from '../api/types';
import { fail } from '../result/result';
import type { Result } from '../result/types';
import { RefreshFailure } from './types';
import type { AuthorizedRequestParams, BackendResult, SendWithHeaders } from './types';

const AUTHORIZATION_HEADER = 'Authorization';
const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';

const SESSION_EXPIRED_FAILURE: ApiFailure = {
  kind: ApiFailureKind.Unauthorized,
  message: SESSION_EXPIRED_MESSAGE,
};

// A refresh that could not reach the server must not look like an expired session to callers.
const REFRESH_FAILURE_TO_API_FAILURE: Readonly<Record<RefreshFailure, ApiFailure>> = {
  [RefreshFailure.NoRefreshToken]: SESSION_EXPIRED_FAILURE,
  [RefreshFailure.Rejected]: SESSION_EXPIRED_FAILURE,
  [RefreshFailure.Network]: { kind: ApiFailureKind.Network },
};

interface CreateOutgoingHeadersParams {
  accessToken: string | null;
  callerHeaders?: HeadersInit;
}

interface AttemptRequestParams<Value> {
  accessToken: string | null;
  callerHeaders?: HeadersInit;
  decode: Decoder<Value>;
  sendWithHeaders: SendWithHeaders;
}

// Builds the headers for one attempt: the caller's headers plus a bearer token when one is
// available. Unauthenticated calls and a missing token leave them unauthorised.
const createOutgoingHeaders = ({
  accessToken,
  callerHeaders,
}: CreateOutgoingHeadersParams): Headers => {
  const outgoingHeaders = new Headers(callerHeaders);

  if (accessToken !== null) {
    outgoingHeaders.set(AUTHORIZATION_HEADER, `Bearer ${accessToken}`);
  }

  return outgoingHeaders;
};

// Sends the request once with the given access token and decodes the API response.
const attemptRequest = <Value>({
  accessToken,
  callerHeaders,
  decode,
  sendWithHeaders,
}: AttemptRequestParams<Value>): BackendResult<Value> =>
  sendApiRequest({
    decode,
    send: () => sendWithHeaders(createOutgoingHeaders({ accessToken, callerHeaders })),
  });

// Only a 401 is worth a refresh; validation, network, and other HTTP failures are final.
const isUnauthorizedFailure = <Value>(result: Result<Value, ApiFailure>): boolean =>
  !result.ok && result.error.kind === ApiFailureKind.Unauthorized;

// Sends a backend request with the current access token. On a 401 it retries exactly once: with
// the already-rotated token if another request refreshed in the meantime, otherwise after a
// (single-flight) refresh. A failed refresh has already expired the session, so the caller only
// gets a typed failure and the route guard handles the redirect.
export const sendAuthorizedRequest = async <Value>({
  accessTokenFactory,
  authenticate,
  callerHeaders,
  decode,
  refreshTokenFactory,
  sendWithHeaders,
}: AuthorizedRequestParams<Value>): BackendResult<Value> => {
  if (!authenticate) {
    return attemptRequest({ accessToken: null, callerHeaders, decode, sendWithHeaders });
  }

  const initialAccessToken = accessTokenFactory();
  const initialResult =
    initialAccessToken === null
      ? fail(SESSION_EXPIRED_FAILURE)
      : await attemptRequest({
          accessToken: initialAccessToken,
          callerHeaders,
          decode,
          sendWithHeaders,
        });

  if (!isUnauthorizedFailure(initialResult)) {
    return initialResult;
  }

  const latestAccessToken = accessTokenFactory();
  const wasRotatedMeanwhile =
    latestAccessToken !== null && latestAccessToken !== initialAccessToken;

  if (wasRotatedMeanwhile) {
    return attemptRequest({
      accessToken: latestAccessToken,
      callerHeaders,
      decode,
      sendWithHeaders,
    });
  }

  const refreshResult = await refreshTokenFactory();

  return refreshResult.ok
    ? attemptRequest({
        accessToken: refreshResult.value.accessToken,
        callerHeaders,
        decode,
        sendWithHeaders,
      })
    : fail(REFRESH_FAILURE_TO_API_FAILURE[refreshResult.error]);
};
