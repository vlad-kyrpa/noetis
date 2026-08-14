# Callbacks

Callbacks notify callers about core state changes.

Commands modify state. Queries read state. Callbacks let the application react after state changes happen.

## Change Events

Application changes should produce events that the UI and other consumers can subscribe to.

Change events are useful for:

- Rerendering views after async persistence
- Updating search indexes
- Refreshing saved queries
- Supporting future imports, automation, and filesystem watchers
- Preparing for future sync

Events should describe application-level changes, not storage implementation details.

## Consumers

Potential callback consumers include:

- UI state subscriptions
- Search/index refresh logic
- Local persistence observers
- Import or automation systems
- Future sync clients

Callbacks should keep these consumers decoupled from the command implementation.

## Event Shape

Events should be explicit enough to support efficient updates, but generic enough to avoid leaking implementation details.

Useful event data may include:

- Event type
- Affected entity IDs
- Created, updated, or deleted entity kind
- Timestamp
- Optional command correlation ID

