export type HttpQueryValue = boolean | number | string | null | undefined;

export type HttpQuery = Readonly<Record<string, HttpQueryValue>>;

export type HttpValidationIssues = Record<string, string>;

export type HttpBodyValidator<BodyType> = (body: BodyType) => HttpValidationIssues;

export interface HttpRequestParams {
  headers?: HeadersInit;
  path: string;
  query?: HttpQuery;
}

export interface HttpBodyRequestParams<BodyType> extends HttpRequestParams {
  body: BodyType;
  validator: HttpBodyValidator<BodyType>;
}

export type HttpPostParams<BodyType> = HttpBodyRequestParams<BodyType>;

export type HttpPutParams<BodyType> = HttpBodyRequestParams<BodyType>;

export type HttpGetParams = HttpRequestParams;

export type HttpDeleteParams = HttpRequestParams;

// Why a request never produced an HTTP response.
export enum HttpNotSentReason {
  Invalid,
  Network,
}

export interface HttpSentResult {
  readonly response: Response;
  readonly sent: true;
}

export interface HttpInvalidResult {
  readonly issues: HttpValidationIssues;
  readonly reason: HttpNotSentReason.Invalid;
  readonly sent: false;
}

// Only `fetch` itself rejecting lands here; bugs while building the request still throw.
export interface HttpNetworkFailureResult {
  readonly cause: unknown;
  readonly reason: HttpNotSentReason.Network;
  readonly sent: false;
}

export type HttpResponseResult = HttpSentResult | HttpNetworkFailureResult;

export type HttpBodyRequestResult = HttpResponseResult | HttpInvalidResult;

export type HttpPostResult = HttpBodyRequestResult;

export type HttpPutResult = HttpBodyRequestResult;

export interface HttpMethods {
  delete: (params: HttpDeleteParams) => Promise<HttpResponseResult>;
  get: (params: HttpGetParams) => Promise<HttpResponseResult>;
  post: <BodyType>(params: HttpPostParams<BodyType>) => Promise<HttpPostResult>;
  put: <BodyType>(params: HttpPutParams<BodyType>) => Promise<HttpPutResult>;
}

export type HttpRequestResult = HttpBodyRequestResult;

export enum ApiFailureKind {
  Validation,
  Unauthorized,
  Http,
  Network,
  Decode,
}

export type ApiFailure =
  | { readonly kind: ApiFailureKind.Validation; readonly issues: HttpValidationIssues }
  | { readonly kind: ApiFailureKind.Unauthorized; readonly message: string }
  | { readonly kind: ApiFailureKind.Http; readonly message: string; readonly status: number }
  | { readonly cause?: unknown; readonly kind: ApiFailureKind.Network }
  | { readonly kind: ApiFailureKind.Decode };

export type Decoder<Value> = (value: unknown) => Value | undefined;

export enum HttpMethod {
  Delete = 'DELETE',
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
}
