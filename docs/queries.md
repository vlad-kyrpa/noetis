# Queries

Queries are the read side of the core.

If commands are the only way to modify core state, queries are the only way to get a snapshot or projection of core state.

## Search-First Navigation

Noetis should be search-first. Folder navigation is not a core priority.

Search should cover:

- Note titles
- Note content
- Tags
- Useful properties
- Attachment names

The main navigation model should be query-based. Instead of hardcoded folders, users can create saved queries that act as sidebar entries or views.

For example, a saved query named `Walnut Tasks` could match notes tagged with:

- `note`
- `task`
- `project:walnut`
- `status:undone`

Opening that navigation item shows the current matching notes dynamically.

## Query Model

The core should define query semantics independently of any particular storage engine.

The query model should eventually support:

- Text search
- Tag filtering
- Property filtering
- Time ranges
- Sorting
- Grouping
- Aggregation
- Limits

This enables domain-specific modules without adding domain-specific entities to the core. For example, an expense view can query expense notes for the current month, group them by category, and sum the `amount` property.

The internal query representation may resemble SQL concepts. That is acceptable. User-facing screens should expose convenient controls rather than requiring users to write SQL.

