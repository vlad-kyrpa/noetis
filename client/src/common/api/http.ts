import type {
  HttpBodyRequestParams,
  HttpBodyRequestResult,
  HttpDeleteParams,
  HttpDeleteResult,
  HttpGetParams,
  HttpPostParams,
  HttpPostResult,
  HttpPutParams,
  HttpPutResult,
  HttpQuery,
  HttpResponseResult,
} from './types';
import { HttpMethod, HttpNotSentReason } from './types';

interface PathWithQueryParams {
  path: string;
  query?: HttpQuery;
}

interface SendRequestParams {
  body?: BodyInit;
  headers?: HeadersInit;
  method: HttpMethod;
  path: string;
  query?: HttpQuery;
}

interface SendJsonRequestParams<BodyType> extends HttpBodyRequestParams<BodyType> {
  method: HttpMethod.Delete | HttpMethod.Post | HttpMethod.Put;
}

// Adds defined query values to a path while preserving an existing query string.
const createPathWithQuery = ({ path, query }: PathWithQueryParams): string => {
  const searchParams = new URLSearchParams();

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();

  if (queryString === '') {
    return path;
  }

  const querySeparator = path.includes('?') ? '&' : '?';

  return `${path}${querySeparator}${queryString}`;
};

// Determines whether validation returned at least one field issue.
const hasValidationIssues = (issues: Record<string, string>): boolean =>
  Object.keys(issues).length > 0;

// Sends a request and preserves the raw response for feature APIs to decode. Only the `fetch`
// call is guarded, so a transport failure becomes data while request-building bugs still throw.
const sendRequest = async ({
  body,
  headers,
  method,
  path,
  query,
}: SendRequestParams): Promise<HttpResponseResult> => {
  const url = createPathWithQuery({ path, query });

  try {
    const response = await fetch(url, { body, headers, method });

    return { response, sent: true };
  } catch (cause) {
    return { cause, reason: HttpNotSentReason.Network, sent: false };
  }
};

// Applies body validation before sending a JSON mutation request.
const sendJsonRequest = async <BodyType>({
  body,
  headers,
  method,
  path,
  query,
  validator,
}: SendJsonRequestParams<BodyType>): Promise<HttpBodyRequestResult> => {
  const issues = validator(body);

  if (hasValidationIssues(issues)) {
    return { issues, reason: HttpNotSentReason.Invalid, sent: false };
  }

  const requestHeaders = new Headers(headers);
  requestHeaders.set('Content-Type', 'application/json');

  return sendRequest({
    body: JSON.stringify(body),
    headers: requestHeaders,
    method,
    path,
    query,
  });
};

// Sends a GET request with optional query values and headers.
const get = async ({ headers, path, query }: HttpGetParams): Promise<HttpResponseResult> =>
  sendRequest({ headers, method: HttpMethod.Get, path, query });

// Sends a validated JSON POST request.
const post = async <BodyType>(params: HttpPostParams<BodyType>): Promise<HttpPostResult> =>
  sendJsonRequest({ ...params, method: HttpMethod.Post });

// Sends a validated JSON PUT request.
const put = async <BodyType>(params: HttpPutParams<BodyType>): Promise<HttpPutResult> =>
  sendJsonRequest({ ...params, method: HttpMethod.Put });

// Sends a DELETE request, validating and JSON-encoding the body only when one is supplied.
const remove = async <BodyType>(params: HttpDeleteParams<BodyType>): Promise<HttpDeleteResult> =>
  'body' in params
    ? sendJsonRequest({ ...params, method: HttpMethod.Delete })
    : sendRequest({
        headers: params.headers,
        method: HttpMethod.Delete,
        path: params.path,
        query: params.query,
      });

export const http = { delete: remove, get, post, put };
