# Client development rules

- Put reusable API communication and form handling in dedicated hooks.
- Move reusable UI elements, such as buttons, into `client/src/common`.
- Prepare computed values before JSX; keep return nodes declarative.
- Prefer mapped configuration and factories over repeated markup or branching selection logic.
- Use `useAuthenticatedFetch` for protected API calls. It supplies the access token, refreshes once after a `401`, and clears an invalid session.
- Build API URLs with `createApiPath`. The Cloudflare Worker serves both the SPA and `/api/*`, so deployed client requests must stay relative to the current origin.
- Use `useLayout` for responsive component behavior. CSS owns visual breakpoints; the hook returns the `LayoutState.Mobile` or `LayoutState.Pc` enum.
- Use `AppHud` for fixed authenticated primary navigation. It has four mapped destinations and changes from a bottom bar on mobile to a full-height left bar on PC.
- Keep `/login` outside `AppShell`. All other application routes render inside `AppShell`, which provides the persistent HUD and content spacing.
- A feature HUD button remains selected for its route and all nested routes, such as `/notes/:id`.
- `AuthProvider` stores only API-verified user data from `/api/auth/me`; session storage stores only tokens. Wrap authenticated routes in `ProtectedRoute`.
