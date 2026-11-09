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
  - A `404` from `GET /api/auth/me` means the account no longer exists (e.g. after a database reset). The provider calls `logout()`, which clears the tokens and sends the user to `/login`.
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

## Regional settings

- `RegionalSettings { locale, timeZone, firstDayOfWeek }` is read once at the composition root and provided by `RegionalProvider`; consumers call `useRegional()` for `{ settings, clock }`.
  - `locale` is `navigator.language`, `timeZone` is the resolved `Intl` time zone.
  - `firstDayOfWeek` comes from `Intl.Locale` week info and falls back to **Monday** where the engine has none (Firefox).
- `clock.today()` is the calendar date in `timeZone`; it is the only code that reads the system time.
- Dates are `IsoDate` (`YYYY-MM-DD`, branded, created only by `parseIsoDate`). Day math (`addDays`, `startOfWeek`) runs in UTC so DST never skips or repeats a day. Format them with `timeZone: 'UTC'`.
- A user-settings override can later replace the provider value without touching consumers.

## Search (reusable)

`common/search` plus the `SearchBar` and `SearchQueryChips` components know nothing about any module.

- Syntax: `#tag1 #tag2 some text` or `some text #tag`. Tags go only at the start or the end; `#a text #b` and `some #a text` are rejected with explicit messages.
- `parseSearchInput({ input, syntax })` is pure and returns `Result<SearchQuery, SearchParseFailure>`. It sanitizes (NFKC, invisible characters → space, collapsed whitespace), checks length, validates tags against `syntax.tagLabelPattern` (Unicode letters, digits, `_`, `-`), checks the layout and lower-cases and dedupes tags.
- `useSearchInput({ onSearch })` holds the text and failure. Typing never searches; every successful submit calls `onSearch`, even for an unchanged query.
- A module reuses it by supplying its own `onSearch` and a `SearchQuery` → request mapper.

## Tasks area

| Path | Mobile | Tablet / PC |
| --- | --- | --- |
| `/tasks` | Views list | Views list + "pick a view" |
| `/tasks/views/day?date=…` | Day tasks | Views list + Day tasks |
| `/tasks/views/week?date=…` | Week tasks | Views list + Week tasks |
| `/tasks/views/all` | All tasks | Views list + All tasks |
| `/tasks/views/:id` | Saved view | Views list + saved view |
| `/tasks/views/new` | Create view form | Views list + form |
| `/tasks/search` | Global results | Views list + global results |
| `/tasks/new` | Create task | Views list + create task |
| `/tasks/:taskId` | Task details | Task details, full width |

- `TasksPage` is the shell: the search bar always on top, then the views list and the matched panel. `useLayout()` decides the split: tablet and PC show both columns, mobile shows the panel instead of the list with a back link.
- **The URL is the state for views.** The view id and the period anchor (`?date=`) live in the route; ◀ / ▶ write a new `?date=` so browser back works. An invalid date falls back to regional today, and Week snaps to the regional first day.
- **Built-in views** (`BUILT_IN_VIEWS`): Day (`dueFrom = dueUntil = date`), Week (seven days from the week start, grouped by day) and All tasks (no filter). Saved views send `viewId`, and the backend matches all of their tags.
- **Search scope.** A submit with a view open narrows that view (one request with the view's filters plus `title` / `tags`). With no view open it searches everything and opens `/tasks/search`. The active search is page state tagged with its scope: stepping Day/Week keeps it, switching views drops it (the text stays in the input), ✕ clears it.
- **Requests.** `useTaskList` sends one request when the memoized query or the submit counter changes, and keeps only the latest response. Typing sends nothing.
- **Create view.** `modules/views` owns the area-agnostic `CreateViewPage({ types, onCreated, onCancel })`. One type hides the picker; tags are previewed lower-cased as they will be saved. The tasks area mounts it with `ViewType.Task`.
- **Create task** (`/tasks/new`). Opened by + from any task list, with the list's URL passed as `returnTo` navigation state. Day prefills the due date and a saved view prefills its tags; saving or cancelling returns to that list.

- **Task details** (`/tasks/:taskId`). Every row links here with the list URL as `returnTo` state, and back returns to it (or `/tasks` when opened directly). It always takes the full width, also on tablet/PC, because the description holds long-form context (it starts at half the viewport height). The top line, back · title · save, stays pinned while scrolling. Title, description, status, tags and due date are always editable; created/updated are read-only, in the regional time zone. **save** appears only when the draft differs from the saved task (`hasTaskDraftChanges` ignores surrounding whitespace, tag case and tag order). Saving sends the full `PUT` with the links carried over, swaps in the returned task, and re-seeds the editor (keyed on `updatedAt`). A 404 shows "task not found". Opening details does not drop the active search, so coming back keeps it. `search` and `new` are static siblings, so they outrank `:taskId`.

## Context add button (route tree)

What + does is resolved from the URL by a route tree, not a flat map per area.

- `RouteTreeNode<Value> { pattern, value?, children? }` and the pure helpers live in `common/navigation/route-tree.ts`:
  - `resolveRouteBranch({ node, pathname })` returns the matched chain from the root to the deepest node, e.g. `/tasks > /tasks/views/:viewId`. Use it when you need the whole context path.
  - `resolveRouteValue({ node, pathname })` returns the deepest defined `value`, so children override parents and value-less nodes inherit.
  - A node matches its pattern as a prefix. Children are tried in order, so put static segments (`views/new`) before params (`views/:viewId`).
- `app/add-action-tree.ts` holds `ADD_ACTION_TREES: Record<AppArea, RouteTreeNode<ContextAddAction | null>>`, so every area must decide what + means. `App.tsx` passes it to `Layout`, and common code never imports feature modules.
  - Tasks: `/tasks` and `/tasks/views/new` mean "create view". `/tasks/views/:viewId` (Day, Week, All, saved), `/tasks/search` and `/tasks/new` mean "create task".
  - `null` hides the button. `route: null` only logs, for areas whose flow does not exist yet.
- The button navigates with `{ returnTo }` state (`common/navigation/return-to.ts`). `readReturnTo` only accepts same-app paths.
- **View actions.** Saved views show a `⋯` `ContextMenuButton` with Edit and Delete, disabled ("coming soon") until those flows exist.
