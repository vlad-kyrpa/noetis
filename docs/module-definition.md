# Backend module structure

```text
module/
  types.ts
  constants.ts
  controller.ts
  routes/
    route.ts
    route.test.ts
  services/
    service.ts
    service-impl.ts
    service-impl.test.ts
  utils/
    util.ts
    util.test.ts
    test-utils.ts
```

- `types.ts` - Shared domain types and service interfaces for the module.
- `constants.ts` - Module-specific constants and reusable configuration values.
- `controller.ts` - Collects and exposes the module's route handlers.
- `routes/` - Route handlers, request-validation schemas, and route-level tests.
- `services/` - Service interfaces, implementations, and service-level tests.
- `utils/` - Small reusable helpers and their tests; keep test-only helpers in `test-utils.ts`.

## Rules

- Put broadly reusable utilities and components in the `common` module, using the same structure as feature modules.
- Validate every route handler's body, path parameters, and query parameters with middleware. Keep the validation schema in the route handler file.
- Add tests for every file that contains functional behavior; keep tests adjacent to the code they cover.
- Reuse a consistent filter shape for `find(filters)` operations across modules.
- Keep database access in services and use Drizzle there. Depend on a testable database interface rather than a concrete database client.
- Route handlers receive the context required to initialize their service and access the database. Keep this dependency setup reusable for the Wrangler serverless runtime.
