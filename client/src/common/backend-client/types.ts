import type {
  ApiFailure,
  Decoder,
  HttpDeleteParams,
  HttpGetParams,
  HttpMethods,
  HttpPostParams,
  HttpPutParams,
  HttpRequestResult,
} from '../api/types';
import type { Result } from '../result/types';
import type { TokenPair } from '../token-storage/types';

// Why a refresh did not produce a new token pair. Only `Network` keeps the stored tokens.
export enum RefreshFailure {
  NoRefreshToken,
  Rejected,
  Network,
}

export type RefreshResult = Result<TokenPair, RefreshFailure>;

// Returns the current access token synchronously so request code can inject it as a header.
export type AccessTokenFactory = () => string | null;

// Rotates the token pair; concurrent callers share one in-flight backend call.
export type RefreshTokenFactory = () => Promise<RefreshResult>;

export type BackendResult<Value> = Promise<Result<Value, ApiFailure>>;

export interface BackendClientDependencies {
  readonly accessTokenFactory: AccessTokenFactory;
  readonly baseUrl: string;
  readonly methods: HttpMethods;
  readonly refreshTokenFactory: RefreshTokenFactory;
}

// Extra options every backend call accepts on top of the raw HTTP params. `authenticate`
// defaults to true; set it to false for public endpoints so no token is sent or refreshed.
export interface BackendRequestOptions<Value> {
  readonly authenticate?: boolean;
  readonly decode: Decoder<Value>;
}

export type BackendGetParams<Value> = HttpGetParams & BackendRequestOptions<Value>;

export type BackendPostParams<Body, Value> = HttpPostParams<Body> & BackendRequestOptions<Value>;

export type BackendPutParams<Body, Value> = HttpPutParams<Body> & BackendRequestOptions<Value>;

export type BackendDeleteParams<Body, Value> = HttpDeleteParams<Body> &
  BackendRequestOptions<Value>;

// Paths passed to a backend client are relative to the module path it was created for.
export interface BackendClient {
  delete: <Body = never, Value = unknown>(
    params: BackendDeleteParams<Body, Value>,
  ) => BackendResult<Value>;
  get: <Value>(params: BackendGetParams<Value>) => BackendResult<Value>;
  post: <Body, Value>(params: BackendPostParams<Body, Value>) => BackendResult<Value>;
  put: <Body, Value>(params: BackendPutParams<Body, Value>) => BackendResult<Value>;
}

// Builds a backend client scoped to one module's path, e.g. "/tasks".
export type BackendClientFactory = (modulePath: string) => BackendClient;

// Describes a feature's typed endpoint wrapper. Declare it as a module-level constant so hooks
// can memoise the client on its identity.
export interface ModuleClientDefinition<Client> {
  readonly create: (client: BackendClient) => Client;
  readonly modulePath: string;
}

// Sends one raw request with the final headers (token already injected when authenticated).
export type SendWithHeaders = (headers: Headers) => Promise<HttpRequestResult>;

export interface AuthorizedRequestParams<Value> {
  readonly accessTokenFactory: AccessTokenFactory;
  readonly authenticate: boolean;
  readonly callerHeaders?: HeadersInit;
  readonly decode: Decoder<Value>;
  readonly refreshTokenFactory: RefreshTokenFactory;
  readonly sendWithHeaders: SendWithHeaders;
}

export interface CreateModuleClientParams<Client> {
  readonly factory: BackendClientFactory;
  readonly module: ModuleClientDefinition<Client>;
}
