# Tech Stack

Noetis should use a lightweight cross-platform TypeScript stack.

The main goal is to share as much application and core logic as possible across desktop now and mobile later, without committing to heavy infrastructure too early.

## Primary Language

TypeScript should be the main implementation language.

TypeScript is used for:

- Shared application logic
- Shared core logic
- UI logic

Workspace packages should use ES modules.

Relative imports should be extensionless:

```ts
import { createNote } from "./core/create-note";
```

Architecture details are owned by the core, command, query, application-layer, and storage docs.

## Desktop

The first desktop targets are:

- Windows
- macOS

Tauri is a good fit for the desktop shell because it keeps the app lightweight while still allowing native capabilities when needed.

Desktop app direction:

- React UI
- TypeScript application/core logic
- Tauri shell
- Local persistence through an adapter

Native desktop details should stay outside shared TypeScript logic. The Tauri layer can provide filesystem and platform integration through adapters.

## UI

React is the preferred UI layer for the initial app.

The UI should call into the application layer through commands and queries. It should not directly own core state rules or storage behavior.

## Storage

Initial storage should be local and simple. The concrete storage direction is described in [Storage Layer](./storage-layer.md).

## Future Android

Android is a future target, not part of the first demo.

The architecture should prepare for Android by keeping shared logic in pure TypeScript modules:

- Core logic
- Application logic
- Validation rules
- Shared contracts

Possible future Android approaches:

- Tauri mobile
- React Native / Expo

The Android UI does not need to be identical to the desktop UI. The important reusable part is the TypeScript core and application layer.

## First Demo Bias

For the first demo, prefer the smallest stack that proves the product:

- TypeScript
- React
- Tauri
- Markdown
- Local persistence

Avoid adding mobile tooling, sync infrastructure, plugin systems, or complex backend services until the core workflows are useful on desktop.

## Development Tooling

Use a small toolchain that works well with TypeScript, ES modules, React, and Tauri.

Recommended tools:

- `pnpm` for workspaces and package management
- `typescript` for typechecking
- `vite` for React app development and bundling
- `vitest` for unit tests
- `@vitest/coverage-v8` for test coverage when needed
- `zod` for runtime validation and schema parsing
- `eslint`, `@eslint/js`, `typescript-eslint` for linting
- `prettier` for formatting
- `@tauri-apps/cli` for desktop app commands

Avoid adding heavier tools until the project needs them.

Optional later:

- `happy-dom` or `jsdom` for React component tests
- `@testing-library/react` for UI behavior tests
- `fast-check` for property-based tests around query/filter logic

TypeScript config should support ES modules and extensionless imports. Prefer `moduleResolution: "bundler"` for app/library code handled by Vite/Vitest.
