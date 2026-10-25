# Noetis

Noetis is a serverless personal-workspace application. The React client is built with Vite and served as static assets by a Cloudflare Worker. The Worker exposes the API through Hono and persists data in Cloudflare D1 through Drizzle ORM.

## Project layout

- `client/` — React 19 and Vite single-page application.
- `backend/` — Hono Worker, D1 schema, Drizzle migrations, and API tests.
- `docs/` — domain notes and module conventions.

The deployed application uses one origin: the Worker handles `/api/*` and serves the built client for all other application routes.

## Prerequisites

- A current Node.js LTS release and npm.
- A Cloudflare account for remote D1 migrations and deployment.
- Wrangler authentication for production work (`npx wrangler login` from `backend/`).

Install dependencies in both independently versioned packages:

```powershell
npm --prefix client ci
npm --prefix backend ci
```

## Development

### Client-only development

Run the Vite development server when working on the UI:

```powershell
npm --prefix client run dev
```

Vite serves the client on its own development origin. There is currently no Vite API proxy, so `/api` calls are not forwarded automatically; use the Worker workflow below when exercising client-to-API integration.

### Worker and local D1 development

Create and migrate the local D1 database before starting the Worker:

```powershell
npm --prefix backend run db:migrate:local
npm --prefix client run build
npm --prefix backend run dev
```

The Worker serves `client/dist` as its static assets and routes `/api/*` to the Hono API. Rebuild the client after UI changes before refreshing the Worker-served application. Verify that the API is running with `GET /api/health`, which returns `{ "ok": true }`.

Local D1 data is isolated from Cloudflare's remote database. The configuration and migrations live in `backend/wrangler.jsonc` and `backend/drizzle/`. The migration scripts explicitly target the configured `noetis` database, as required by current Wrangler versions.

The ownership migration recreates tags, notes, tasks, expenses, views, and their relation tables to add required `user_id` values. It intentionally removes existing records in those tables; apply it only where that reset is acceptable.

Configure a local signing secret before using authentication endpoints:

```powershell
npm --prefix backend exec wrangler secret put AUTH_TOKEN_SECRET --local
```

Enter a long, random value when prompted, then restart `npm --prefix backend run dev`.

### Database changes

1. Update `backend/src/database/schema.ts`.
2. Generate a migration:

   ```powershell
   npm --prefix backend run db:generate
   ```

3. Review the generated SQL in `backend/drizzle/` and commit it with the schema change.
4. Apply it locally and run the relevant tests:

   ```powershell
   npm --prefix backend run db:migrate:local
   npm --prefix backend run test
   npm --prefix backend run test:e2e
   ```

Do not edit migrations that have already been applied to a production database. Add a new migration instead.

### Quality checks

Run these before opening a pull request or deploying:

```powershell
npm --prefix client run build
npm --prefix client run lint
npm --prefix client run format:check
npm --prefix backend run test
npm --prefix backend run test:e2e
npm --prefix backend run format:check
```

The backend end-to-end suite uses `backend/wrangler.e2e.jsonc` and an isolated local D1 instance; it does not touch the development or production database.

## Production

### Initial Cloudflare setup

1. Authenticate with Cloudflare:

   ```powershell
   npm --prefix backend exec wrangler login
   ```

2. Create the production D1 database:

   ```powershell
   npm --prefix backend exec wrangler d1 create noetis
   ```

3. Copy the returned database ID into `backend/wrangler.jsonc`, replacing the placeholder value `replace-with-your-d1-database-id`. Keep the binding name as `DB`, because the Worker requires that binding.
4. Apply the committed migrations to the remote database:

   ```powershell
   npm --prefix backend run db:migrate:remote
   ```

Configure the authentication signing secret before deployment:

```powershell
npm --prefix backend exec wrangler secret put AUTH_TOKEN_SECRET
```

Keep this secret out of `wrangler.jsonc` and source control.

### Deploy

From the repository root, deploy with:

```powershell
npm --prefix backend run deploy
```

This command builds `client/dist` first, then runs `wrangler deploy` from `backend/`. Apply remote migrations before deploying code that depends on them. After the deployment, check the published `/api/health` endpoint and exercise the affected user flow.

### Release checklist

- Confirm `backend/wrangler.jsonc` has the intended Worker name and D1 database ID.
- Commit the schema update and its new Drizzle migration together.
- Run all quality checks listed above.
- Apply `db:migrate:remote` successfully.
- Deploy and smoke-test the Worker and `/api/health` endpoint.
