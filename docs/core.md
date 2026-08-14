# Core

The primary entity is a `Note`.

A note represents a unit of information. It may be a work note, task, project page, expense record, habit entry, meeting note, reference, or something else defined later by tags and properties.

A note contains:

- Stable ID
- Title
- Content
- Tags
- Typed properties
- Attachment references
- Timestamps

Links to other notes and external URLs live in note content.

The core Note model should not contain storage-specific details.

## Notes as Universal Entities

Different concepts are represented as notes with different tags and properties, not as separate core models.

Examples:

- Task: `note`, `task`, `project:walnut`, `status:undone`
- Knowledge entry: `note`, `knowledge`, `category:keycloak`
- Expense: `expense` with `amount`, `category`, `type`, and `date` properties
- Habit entry: `habit-entry` with `habit`, `completed` or `value`, and `date` properties

The core does not need to know what an expense, habit, project, or task means. Domain-specific screens and workflows can impose conventions on top of generic notes, tags, properties, and queries.

This keeps the core stable while allowing the product to grow through projections, saved views, and specialized UI.

## Tags and Properties

Tags are lightweight labels used for organization, filtering, and workflow state. They may be plain tags like `task` or namespaced tags like:

- `project:walnut`
- `status:doing`
- `category:keycloak`

Properties store structured values that are useful for filtering, sorting, grouping, or aggregation. Property values should be typed enough for the core to support reliable queries.

Useful property types may include:

- Text
- Number
- Boolean
- Date/time

Tags are best for identity, classification, and simple state. Properties are best for structured values such as dates, amounts, counters, or user-defined fields.

Queries, commands, callbacks, and application-layer orchestration are described separately:

- [Queries](./queries.md)
- [Commands](./commands.md)
- [Callbacks](./callback.md)
- [Application Layer](./application-layer.md)
- [Storage Layer](./storage-layer.md)

## Storage Boundary

The core should remain pure and storage-agnostic. Storage details are owned by the [Storage Layer](./storage-layer.md).

## Initial Scope

The first demo should stay small and useful.

Priorities:

- Note CRUD
- Markdown editing
- Tags
- Fast search
- Saved query navigation
- `[[note]]` links
- File attachments
- Local persistence
- Clean application/core/repository boundaries

Avoid spending the first demo on:

- Sync
- Mobile
- Expense-specific UI
- Habit-specific UI
- Complex query language
- Rich text editing
- Plugin architecture
- Over-generalized infrastructure

The demo succeeds if Noetis can already be used for real work notes: opening a task-related note should reveal its context, links, discussion fragments, and attachments, while search makes nearby notes easy to find without navigating folders.
