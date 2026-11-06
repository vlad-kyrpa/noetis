import type { Decoder } from '../api/types';
import { sendAuthorizedRequest } from './authorized-request';
import { joinPath } from './backend-path';
import type {
  BackendClient,
  BackendClientDependencies,
  BackendClientFactory,
  BackendResult,
  CreateModuleClientParams,
  SendWithHeaders,
} from './types';

interface SendModuleRequestParams<Value> {
  authenticate?: boolean;
  callerHeaders?: HeadersInit;
  decode: Decoder<Value>;
  sendWithHeaders: SendWithHeaders;
}

// Builds the one place where tokens are injected and refreshed for every feature module. Each
// call to the returned factory yields a client whose paths are relative to `modulePath`.
export const createBackendClientFactory =
  ({
    accessTokenFactory,
    baseUrl,
    methods,
    refreshTokenFactory,
  }: BackendClientDependencies): BackendClientFactory =>
  (modulePath) => {
    const moduleBaseUrl = joinPath({ baseUrl, path: modulePath });

    // Resolves an endpoint path against this module's base URL.
    const resolveEndpointPath = (endpointPath: string): string =>
      joinPath({ baseUrl: moduleBaseUrl, path: endpointPath });

    // Routes every verb through the shared authorize-refresh-retry flow.
    const sendModuleRequest = <Value>({
      authenticate = true,
      callerHeaders,
      decode,
      sendWithHeaders,
    }: SendModuleRequestParams<Value>): BackendResult<Value> =>
      sendAuthorizedRequest({
        accessTokenFactory,
        authenticate,
        callerHeaders,
        decode,
        refreshTokenFactory,
        sendWithHeaders,
      });

    const backendClient: BackendClient = {
      delete: ({ authenticate, decode, headers, ...requestParams }) =>
        sendModuleRequest({
          authenticate,
          callerHeaders: headers,
          decode,
          sendWithHeaders: (outgoingHeaders) =>
            methods.delete({
              ...requestParams,
              headers: outgoingHeaders,
              path: resolveEndpointPath(requestParams.path),
            }),
        }),
      get: ({ authenticate, decode, headers, path, query }) =>
        sendModuleRequest({
          authenticate,
          callerHeaders: headers,
          decode,
          sendWithHeaders: (outgoingHeaders) =>
            methods.get({ headers: outgoingHeaders, path: resolveEndpointPath(path), query }),
        }),
      post: ({ authenticate, decode, headers, ...requestParams }) =>
        sendModuleRequest({
          authenticate,
          callerHeaders: headers,
          decode,
          sendWithHeaders: (outgoingHeaders) =>
            methods.post({
              ...requestParams,
              headers: outgoingHeaders,
              path: resolveEndpointPath(requestParams.path),
            }),
        }),
      put: ({ authenticate, decode, headers, ...requestParams }) =>
        sendModuleRequest({
          authenticate,
          callerHeaders: headers,
          decode,
          sendWithHeaders: (outgoingHeaders) =>
            methods.put({
              ...requestParams,
              headers: outgoingHeaders,
              path: resolveEndpointPath(requestParams.path),
            }),
        }),
    };

    return backendClient;
  };

// Binds a feature's endpoint wrapper to a backend client scoped to the feature's path.
export const createModuleClient = <Client>({
  factory,
  module,
}: CreateModuleClientParams<Client>): Client => module.create(factory(module.modulePath));
