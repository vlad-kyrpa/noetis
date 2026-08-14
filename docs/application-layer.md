# Application Layer

The application layer is the single orchestration boundary between the UI and the core.

It accepts [commands](./commands.md), runs core logic, persists through the [storage layer](./storage-layer.md), emits [callbacks](./callback.md), and answers [queries](./queries.md).

## Responsibilities

The application layer should:

- Accept commands from the UI and other clients
- Validate commands and apply core rules
- Persist changes through the storage layer
- Emit application change events through callbacks
- Execute queries and return read models or projections
- Keep React, storage, and transport-specific code outside the core

## Boundaries

The application layer coordinates the system, but it should not become a storage adapter or UI framework.

The application layer may depend on the core model, command definitions, query definitions, storage interfaces, and callback/event interfaces.

It should not depend on implementation details such as:

- React components
- Folder paths in domain models
- Binary index formats
- Remote transport details

## Flow

A typical write flow:

1. UI submits a command.
2. Application layer validates the command.
3. Core logic produces the intended state change.
4. Repository adapter persists the change.
5. Application layer emits a change event.
6. UI subscribers refresh by running queries.

A typical read flow:

1. UI submits a query.
2. Application layer asks the repository or indexes for matching data.
3. Application layer returns a snapshot or projection.

## Future Sync

The application layer should make future sync possible without changing the UI mutation model.

A future sync client should be able to:

- Listen to local change events and send relevant mutations to a server
- Receive server changes and submit them through the same command entry point used by the UI

This does not require implementing sync in V1. The important foundation is a clean application boundary with stable commands, queries, callbacks, storage interfaces, and entity IDs.
