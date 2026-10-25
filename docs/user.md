## DB entities

user:

- id
- username (unique)
- email
- password_hash
- password_salt
- created_at
- updated_at

user_refresh_tokens

- session_id
- user_id
- refresh_token
- created_at
- expires_at

## Modules

common
auth

- routes
  - login.ts (get access and refresh tokens)
  - token.ts (refresh)
  - logout.ts (remove refresh token)
  - me.ts (get current user from db)
- services
  - auth-service.ts
  - token-utils.ts
  - token-utils.test.ts
- middleware
  - auth-middleware.ts
- controller.ts
- types.ts
  user
- routes
  - create.ts
  - update.ts
  - remove.ts
  - get-by-id.ts
- services
  - user-service.ts
- controller.ts
- types.ts
