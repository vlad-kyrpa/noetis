# Client development rules

- Put reusable API communication and form handling in dedicated hooks.
- Move reusable UI elements, such as buttons, into `client/src/common`.
- Prepare computed values before JSX; keep return nodes declarative.
- Prefer mapped configuration and factories over repeated markup or branching selection logic.
- Use `useLayout` for responsive component behavior. CSS owns visual breakpoints; the hook returns a `LayoutScale` value.
- A feature HUD button remains selected for its route and all nested routes, such as `/notes/:id`.

## Composition root

`client/src/app/composition.ts` creates every stateful or shared object exactly once: the token storage, `authApi`, `authSession`, the `backendClientFactory`, and the `authClient`. `App.tsx` passes them into providers:

```tsx
<AuthProvider authApi={authApi} authClient={authClient} session={authSession}>
  <BackendClientProvider factory={backendClientFactory}>
    <BrowserRouter>…</BrowserRouter>
  </BackendClientProvider>
</AuthProvider>
```

The token factories go from `authSession` straight into `createBackendClientFactory` at the composition root. They are deliberately not on the React context, so nothing can build a second client inside React that bypasses the shared refresh.

API paths stay relative to `/api`. The Cloudflare Worker serves both the SPA and `/api/*`, so deployed requests must stay on the current origin.

## Auth

- `createAuthSession` (`modules/auth/session`) is the single stateful auth core. It owns the tokens in `localStorage`, exposes `accessTokenFactory` and `refreshTokenFactory`, and emits `SignedIn`, `Refreshed`, `Expired` and `SignedOut`.
- Refresh is **single-flight**: the backend rotates refresh tokens, so concurrent callers share one in-flight `/auth/token` call.
  - A rejected refresh, or a missing refresh token, clears storage and emits `Expired`.
  - A network or 5xx failure keeps the tokens, so going offline never logs the user out.
- `AuthProvider` / `useAuth()` adapt the session to React. They expose `status` (`AuthStatus`), `user`, `login`, `logout`, `register` and `retry`. `user` only ever holds data verified by `GET /api/auth/me`.
- Wrap protected routes in `RequireAuth`. It redirects to `/login` (remembering the original URL) when the status becomes `Unauthenticated`, including after a mid-session refresh failure. Wrap `/login` and `/register` in `RedirectIfAuthenticated`.

## Backend clients

All authenticated requests go through a `BackendClient` from `common/backend-client`. Never add `Authorization` headers or refresh logic by hand.

- `createBackendClientFactory({ methods, baseUrl, accessTokenFactory, refreshTokenFactory })` returns `(modulePath) => BackendClient`. Paths passed to the client are relative to `modulePath`.
- Every call (`get`, `post`, `put`, `delete`):
  1. Injects `Authorization: Bearer <access token>` (skip with `authenticate: false` for public endpoints).
  2. On a `401`, retries **once**: with the current token if another request already rotated it, otherwise after `refreshTokenFactory()`.
  3. Decodes the `{ ok, value | error }` response and returns `Result<Value, ApiFailure>`. Requests never throw for expected failures.
- `ApiFailureKind` tells callers what happened: `Validation` (the body validator rejected it, nothing was sent), `Unauthorized`, `Http`, `Network`, or `Decode`.
- `post`, `put`, and a `delete` with a body take a `validator`; `delete` without a body takes none.

### Adding a module client

Each feature writes only paths, validators and decoders. See `modules/tasks/api/tasks-client.ts`:

```ts
const createTasksClient = (client: BackendClient): TasksClient => ({
  get: (id) => client.get({ decode: decodeTask, path: encodeURIComponent(id) }),
  create: (input) =>
    client.post({ body: input, decode: decodeTask, path: '', validator: validateTaskInput }),
});

export const tasksClientModule: ModuleClientDefinition<TasksClient> = {
  create: createTasksClient,
  modulePath: '/tasks',
};

// In a component or hook:
const tasks = useModuleClient(tasksClientModule);
```

- Declare the definition as a module-level constant. `useModuleClient` memoises on its identity.
- Outside React (e.g. the composition root), use `createModuleClient({ factory, module })`.
