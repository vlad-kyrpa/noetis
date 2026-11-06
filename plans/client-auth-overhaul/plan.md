# Client Auth Overhaul — Plan

## Goal

Replace the current split auth code (`useAuth`, `useBackendHttpClient`, `api/login.ts` writing straight to storage) with:

1. **One auth context** that owns the current user and its tokens, talks to the backend for login / refresh / logout / me, and exposes `login`, `logout`, `user`, `accessTokenFactory`, `refreshTokenFactory`.
2. **A route guard** that checks auth and redirects to `/login` when the access token is invalid and cannot be refreshed.
3. **A backend client factory.** It takes the access and refresh token factories and builds per-module endpoint wrappers (tasks, notes, expenses, …). All wrappers follow one pattern: inject the token, refresh once on `401`, retry, and return typed Results.

## Current state (what's wrong)

| Problem | Where |
| --- | --- |
| `login.ts` imports concrete `http` and `createBrowserTokenStorage` directly. Login never updates the React auth state, so after logging in the app only notices on remount. | [modules/auth/api/login.ts](../../client/src/modules/auth/api/login.ts) |
| `useAuth` is a plain hook, not a context. Every caller gets its own state and its own `/auth/me` fetch. | [modules/auth/hooks/useAuth.ts](../../client/src/modules/auth/hooks/useAuth.ts) |
| Refresh logic lives inside a React hook, tied to the auth module, and has no single-flight. The backend **rotates** refresh tokens (`/api/auth/token`), so two parallel `401`s each refresh with the same token. The second refresh fails and wipes the session. | [modules/auth/hooks/useBackendHttpClient.ts](../../client/src/modules/auth/hooks/useBackendHttpClient.ts) |
| When a refresh fails, storage is cleared but nobody is told. The UI stays "authenticated" until something remounts. | same |
| There's no logout, and backend `/api/auth/logout` is never called. | — |
| `getTokenPair`, `getErrorMessage`, and the API response parsing are copy-pasted in 3 files. | login.ts, register.ts, useBackendHttpClient.ts |
| No `delete` on the backend client. | useBackendHttpClient.ts |
| `docs/client.md` describes things that no longer exist (`useAuthenticatedFetch`, `createApiPath`, `ProtectedRoute`). | [docs/client.md](../../docs/client.md) |

## Backend contract (unchanged, for reference)

All responses use the API response shape `{ ok: true, value } | { ok: false, error: string }`.

| Endpoint | Body | Success value | Failure |
| --- | --- | --- | --- |
| `POST /api/auth/login` | `{ identifier, password }` | `{ accessToken, refreshToken }` | 4xx + `error` |
| `POST /api/auth/token` | `{ refreshToken }` | `{ accessToken, refreshToken }` (rotated) | `401` |
| `POST /api/auth/logout` | `{ refreshToken }` | `{}` | always succeeds |
| `GET /api/auth/me` | Bearer access token | `{ id, username, email }` | `401` |
| `POST /api/users` | `{ username, email, password }` | user | 4xx + `error` |

## Target architecture

```
                         composition root (App.tsx / app/composition.ts)
                         ─ creates: http, tokenStorage, authApi, authSession
                                         │
          ┌──────────────────────────────┼─────────────────────────────┐
          ▼                              ▼                             ▼
   HttpMethodsProvider             AuthProvider(session)      BackendClientProvider
   (raw get/post/put/delete)       user, status, login,        createBackendClientFactory({
                                   logout, accessTokenFactory,   methods, baseUrl,
                                   refreshTokenFactory           accessTokenFactory,
                                         │                       refreshTokenFactory })
                                         ▼                             │
                                   RequireAuth                         ▼
                                   (redirects to /login     useModuleClient(createTasksClient)
                                    when status=Unauth)     → TasksClient { list, get, create… }
```

Layers, from inside out:

1. **`common/result`**: a shared `Result<Value, Failure>` type plus `ok()` / `fail()` helpers.
2. **`common/api`**: raw transport (`HttpMethods`, `http`) plus the new shared `readApiResponse` decoder. No auth knowledge.
3. **`common/token-storage`**: unchanged.
4. **`modules/auth/api`**: `createAuthApi({ methods, baseUrl })`, a pure factory that returns unauthenticated calls to the backend auth endpoints.
5. **`modules/auth/session`**: `createAuthSession(...)`, the **one stateful core** of auth. It owns the tokens, single-flight refresh, and expiry notifications. It is plain TS with no React.
6. **`modules/auth/context`**: `AuthProvider` / `useAuth`, a React adapter over the session that holds `user` and `status`.
7. **`common/backend-client`**: `createBackendClientFactory(...)` handles token injection and refresh-and-retry, and `useModuleClient` gives per-module clients to components.
8. **`modules/<feature>/api/<feature>-client.ts`**: typed endpoint wrappers built on a `BackendClient`.

## Types (sketch)

```ts
// common/result/types.ts
export type Result<Value, Failure> =
  | { readonly ok: true; readonly value: Value }
  | { readonly ok: false; readonly error: Failure };

// common/api/types.ts (additions)
export enum ApiFailureKind { Validation, Unauthorized, Http, Network, Decode }
export type ApiFailure =
  | { readonly kind: ApiFailureKind.Validation; readonly issues: HttpValidationIssues }
  | { readonly kind: ApiFailureKind.Unauthorized }
  | { readonly kind: ApiFailureKind.Http; readonly status: number; readonly message: string }
  | { readonly kind: ApiFailureKind.Network }
  | { readonly kind: ApiFailureKind.Decode };
export type Decoder<Value> = (value: unknown) => Value | undefined;

// modules/auth/session/types.ts
export type AccessTokenFactory = () => string | null;            // current token, sync
export type RefreshTokenFactory = () => Promise<RefreshResult>;  // rotate, single-flight
export type RefreshResult = Result<TokenPair, RefreshFailure>;
export enum RefreshFailure { NoRefreshToken, Rejected, Network }
export type SessionListener = (event: SessionEvent) => void;
export enum SessionEvent { SignedIn, Refreshed, Expired, SignedOut }

export interface AuthSession {
  accessTokenFactory: AccessTokenFactory;
  refreshTokenFactory: RefreshTokenFactory;
  login: (input: LoginInput) => Promise<Result<void, AuthFormFailure>>;
  logout: () => Promise<void>;
  hasSession: () => boolean;
  subscribe: (listener: SessionListener) => () => void;
}

// modules/auth/context/types.ts
export enum AuthStatus { Checking, Authenticated, Unauthenticated }
export interface AuthContextValue {
  status: AuthStatus;
  user: AuthenticatedUser | null;
  login: (input: LoginInput) => Promise<Result<AuthenticatedUser, AuthFormFailure>>;
  logout: () => Promise<void>;
  accessTokenFactory: AccessTokenFactory;
  refreshTokenFactory: RefreshTokenFactory;
}

// common/backend-client/types.ts
export interface BackendClientDependencies {
  methods: HttpMethods;
  baseUrl: string;
  accessTokenFactory: AccessTokenFactory;
  refreshTokenFactory: RefreshTokenFactory;
}
export interface BackendClient {
  get: <Value>(params: BackendGetParams<Value>) => Promise<Result<Value, ApiFailure>>;
  post: <Body, Value>(params: BackendPostParams<Body, Value>) => Promise<Result<Value, ApiFailure>>;
  put: <Body, Value>(params: BackendPutParams<Body, Value>) => Promise<Result<Value, ApiFailure>>;
  delete: <Value>(params: BackendDeleteParams<Value>) => Promise<Result<Value, ApiFailure>>;
}
// Each Backend*Params = Http*Params + { decode: Decoder<Value>; authenticate?: boolean }
export type BackendClientFactory = (modulePath: string) => BackendClient; // scoped to e.g. "/tasks"
export type ModuleClientFactory<Client> = (client: BackendClient) => Client;
```

Note on the auth module's "token factories" naming: `AccessTokenFactory` and `RefreshTokenFactory` are what the backend client receives. They're the only seam between auth and every other module.

## Key behaviours

### Single-flight refresh (in `createAuthSession`)
- While a refresh is running, the session keeps the in-flight `Promise<RefreshResult>`, and every concurrent caller awaits that same promise. It's cleared when the promise settles.
- On success, it stores the rotated pair and emits `Refreshed`.
- On `Rejected` or `NoRefreshToken`, it clears storage and emits `Expired`.
- On `Network`, it **keeps the tokens** and doesn't emit. The request fails with `ApiFailureKind.Network` and the user isn't logged out because they're offline.
- This is the only mutable state in auth. It lives in a closure created once at the composition root, which the AGENTS.md rules allow ("mutation isolated inside the application core", "initialize stateful objects at the project root").

### Authorized request (in `createBackendClientFactory`)
1. Call the request with `accessTokenFactory()` injected as `Authorization: Bearer …` when `authenticate !== false`.
2. If the response isn't `401`, decode the API response and return a Result.
3. If it is `401`, call `await refreshTokenFactory()`.
   - On `ok`, retry **once** with the new access token.
   - On `!ok`, return `{ kind: Unauthorized }`. The session has already emitted `Expired`, so the guard redirects.
4. Never retry more than once, and never refresh on `authenticate: false` calls.

### Auth context bootstrap (in `AuthProvider`)
- On mount:
  - If `!session.hasSession()`, set `Unauthenticated`.
  - Otherwise, call `GET /auth/me` through a backend client built from the session's own factories (so a `401` from `me` triggers refresh + retry for free). If it succeeds, set `Authenticated` + `user`. If it fails with `Unauthorized`, set `Unauthenticated`.
- `subscribe` to the session:
  - On `Expired` or `SignedOut`, clear `user` and set `Unauthenticated`.
  - On `SignedIn`, re-fetch `me`.
- `login(input)` runs `session.login`, then fetches `me`, then sets `Authenticated`, and returns a Result so the form can show errors.
- `logout()` runs `session.logout()`, which calls `POST /auth/logout` best-effort, clears storage, and emits `SignedOut`.

### Guard + redirect
- `RequireAuth`:
  - `Checking` shows a loading state.
  - `Unauthenticated` renders `<Navigate to={routes.login} replace state={{ from: location }} />`.
  - `Authenticated` renders `<Outlet />`.
- New `RedirectIfAuthenticated` wraps `/login` and `/register`. When authenticated, it sends the user to `state.from ?? routes.home`.
- Because the session emits `Expired` from **any** failed refresh, a protected page making a request mid-session flips the status and the guard redirects. No per-call redirect logic is needed.

## File layout

```
client/src/
  app/
    composition.ts                 # NEW  builds http, tokenStorage, authApi, authSession once
  common/
    result/
      types.ts                     # NEW  Result<Value, Failure>
      result.ts                    # NEW  ok(), fail()
    api/
      http.ts                      # keep (add nothing)
      types.ts                     # + ApiFailure, Decoder
      api-response.ts              # NEW  readApiResponse({ response, decode }) -> Result<Value, ApiFailure>
      decoders.ts                  # NEW  isRecord, decodeTokenPair, decodeErrorMessage (dedup)
      HttpMethodsProvider.tsx      # keep
    backend-client/
      types.ts                     # NEW
      backend-path.ts              # NEW  joinPath (moved from useBackendHttpClient)
      authorized-request.ts        # NEW  inject token + refresh-once-retry (pure, deps as params)
      create-backend-client-factory.ts  # NEW
      BackendClientProvider.tsx    # NEW  builds factory from useAuth() factories + useHttpMethods()
      useModuleClient.ts           # NEW  useModuleClient(createTasksClient) -> memoised client
    token-storage/                 # unchanged
  modules/
    auth/
      types.ts                     # + AuthFormFailure, session/context types re-exported
      api/
        auth-api.ts                # NEW  createAuthApi -> { login, refresh, logout, me, register }
        validators.ts              # NEW  validateLoginInput, validateRegisterInput (moved)
        login.ts                   # DELETE (folded into auth-api)
        register.ts                # DELETE (folded into auth-api)
      session/
        types.ts                   # NEW
        create-auth-session.ts     # NEW  single-flight, events, token factories
      context/
        AuthProvider.tsx           # NEW
        useAuth.ts                 # NEW  (replaces hooks/useAuth.ts)
      components/
        RequireAuth.tsx            # rewrite (status enum, redirect with `from`)
        RedirectIfAuthenticated.tsx  # NEW
      hooks/
        useAuth.ts                 # DELETE
        useBackendHttpClient.ts    # DELETE
        useLoginForm.ts            # use useAuth().login, navigate on success
        useRegisterForm.ts         # use authApi.register via context
    tasks/api/tasks-client.ts      # NEW (reference module client, see below)
```

Provider order in `App.tsx`:

```tsx
<HttpMethodsProvider methods={http}>
  <AuthProvider session={authSession}>
    <BackendClientProvider baseUrl={API_BASE_URL}>
      <BrowserRouter> … </BrowserRouter>
    </BackendClientProvider>
  </AuthProvider>
</HttpMethodsProvider>
```

## Module client pattern (reference)

```ts
// modules/tasks/api/tasks-client.ts
const TASKS_PATH = '/tasks';

export interface TasksClient {
  list: (query: TaskListQuery) => Promise<Result<readonly Task[], ApiFailure>>;
  get: (id: TaskId) => Promise<Result<Task, ApiFailure>>;
  create: (input: CreateTaskInput) => Promise<Result<Task, ApiFailure>>;
}

// Binds task endpoints to a pre-authorised backend client.
export const createTasksClient = (client: BackendClient): TasksClient => ({
  list: (query) => client.get({ path: TASKS_PATH, query, decode: decodeTaskList }),
  get: (id) => client.get({ path: `${TASKS_PATH}/${id}`, decode: decodeTask }),
  create: (input) =>
    client.post({ path: TASKS_PATH, body: input, validator: validateCreateTask, decode: decodeTask }),
});

// in a component/hook
const tasks = useModuleClient(createTasksClient);
```

Each module only writes paths, validators, and decoders. Tokens, refresh, API response parsing, and error mapping all live in one place.

## Phases

Each phase leaves the app building and working.

1. **Foundations.** Add `common/result`, `common/api/api-response.ts` and `decoders.ts`, and `ApiFailure`. Dedupe `getTokenPair` / `getErrorMessage` in the existing files. No behaviour change.
2. **Auth API + session core.** Add `createAuthApi` and `createAuthSession` with single-flight refresh and events, plus `app/composition.ts`. Nothing uses them yet.
3. **Auth context.** Add `AuthProvider` / `useAuth`, and rewrite `RequireAuth` + add `RedirectIfAuthenticated`. Switch `useLoginForm` / `useRegisterForm` to the context. Delete old `hooks/useAuth.ts`, `api/login.ts`, `api/register.ts`.
4. **Backend client factory.** Add `common/backend-client/*` and `BackendClientProvider` + `useModuleClient`, and add `delete`. Move `/auth/me` in `AuthProvider` onto it. Delete `useBackendHttpClient.ts`.
5. **Logout UI.** Add a logout action (HUD or menu page) wired to `useAuth().logout`.
6. **Reference module client.** Add `tasks-client.ts` as the template for notes and expenses.
7. **Docs.** Rewrite the auth / API sections of `docs/client.md` to describe the new pattern.

## Verification

- `npm run build` and `npm run lint` pass after every phase.
- Manual checks against `wrangler dev`:
  - Log in, and the app lands on home without a reload.
  - Reload, and the session is restored via `/me`.
  - Corrupt the access token in localStorage, then make a request. It refreshes silently and the request succeeds.
  - Corrupt both tokens, then make a request. It redirects to `/login`, and after logging in it returns to the original page.
  - Fire 3 protected requests at once with an expired access token. Only **one** `/auth/token` call appears in the network tab.
  - Log out. `/auth/logout` is called, storage is cleared, and the app redirects to `/login`.
  - Go offline with an expired token. The request fails with a Network error and the user is **not** logged out.

## Decisions

- **Refresh only on `401`.** There's no proactive refresh and no decoding of `expiresAt` on the client. `GET /auth/me` is the first authenticated call on every app load, so an expired access token is usually refreshed there before any feature request runs.
- **Both tokens stay in `localStorage`.** We keep the existing `common/token-storage` unchanged, with no cookies and no backend changes.
- **Keep it simple.** Cross-tab sync and other extras are out of scope.

## Open questions

1. **Client tests.** The client has no test runner. Should we add `vitest` in phase 1? The session core and authorized-request logic are pure and easy to unit test, especially the single-flight and retry-once behaviour.
