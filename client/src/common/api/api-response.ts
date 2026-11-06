import { fail, ok } from '../result/result';
import type { Result } from '../result/types';
import { decodeErrorMessage, isRecord } from './decoders';
import { ApiFailureKind, HttpNotSentReason } from './types';
import type { ApiFailure, Decoder, HttpRequestResult } from './types';

const UNAUTHORIZED_STATUS = 401;
const DEFAULT_UNAUTHORIZED_MESSAGE = 'Your session is not authorized.';

interface ReadApiResponseParams<Value> {
  decode: Decoder<Value>;
  response: Response;
}

interface SendApiRequestParams<Value> {
  decode: Decoder<Value>;
  send: () => Promise<HttpRequestResult>;
}

interface ReadResponseBodyParams<Value> {
  body: unknown;
  decode: Decoder<Value>;
}

interface ReadFailureBodyParams {
  body: unknown;
  status: number;
}

// Decodes the `{ ok: true, value }` part of a successful API response into a typed value.
const readSuccessBody = <Value>({
  body,
  decode,
}: ReadResponseBodyParams<Value>): Result<Value, ApiFailure> => {
  const value = isRecord(body) && body.ok === true ? decode(body.value) : undefined;

  return value === undefined ? fail({ kind: ApiFailureKind.Decode }) : ok(value);
};

// Converts a non-2xx response into a typed failure, keeping the server message when present.
const readFailureBody = ({ body, status }: ReadFailureBodyParams): ApiFailure => {
  const message = decodeErrorMessage(body);

  return status === UNAUTHORIZED_STATUS
    ? { kind: ApiFailureKind.Unauthorized, message: message ?? DEFAULT_UNAUTHORIZED_MESSAGE }
    : { kind: ApiFailureKind.Http, message: message ?? `Request failed (${status}).`, status };
};

// Turns a backend API response into one Result shape shared by every API module.
export const readApiResponse = async <Value>({
  decode,
  response,
}: ReadApiResponseParams<Value>): Promise<Result<Value, ApiFailure>> => {
  const body: unknown = await response.json().catch(() => undefined);

  return response.ok
    ? readSuccessBody({ body, decode })
    : fail(readFailureBody({ body, status: response.status }));
};

// Runs a request and maps validation, network, and API response outcomes into a single Result.
export const sendApiRequest = async <Value>({
  decode,
  send,
}: SendApiRequestParams<Value>): Promise<Result<Value, ApiFailure>> => {
  const request = await send();

  if (request.sent) {
    return readApiResponse({ decode, response: request.response });
  }

  return request.reason === HttpNotSentReason.Invalid
    ? fail({ issues: request.issues, kind: ApiFailureKind.Validation })
    : fail({ cause: request.cause, kind: ApiFailureKind.Network });
};
