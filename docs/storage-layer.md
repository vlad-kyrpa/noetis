# Storage Layer

The storage layer persists Noetis data behind a generic interface for note manipulation and query execution.

It is an adapter layer, not part of the core model. The core and application layer should work through storage interfaces instead of knowing how notes are stored on disk.

## Responsibilities

The storage layer owns persistence concerns:

- Persist notes
- Persist attachment metadata
- Persist saved queries
- Maintain indexes needed for fast lookup
- Load data for the application layer
- Save changes requested through repositories

Storage code should handle implementation details such as folders, files, binary indexes, serialization, and migrations.

## Boundaries

The core should depend on repository interfaces, not concrete storage implementations.

The initial storage adapter may know about:

- Folder structure
- Note file paths
- Attachment file paths
- Binary index files
- Migration details

Core models should not know about those details.

For example, a `Note` can have attachment references, but it should not need to know where attachment bytes are stored on disk.

## Storage Interface

The storage layer exposes the persistence side of note manipulation and querying.

Initial capabilities should include:

- Get note
- Save note
- Delete note
- Search notes
- Query notes by tags
- Query notes by properties
- List saved queries
- Save saved query
- Save attachment reference or metadata

Interface methods should describe domain operations rather than storage mechanics. Query semantics are defined in [Queries](./queries.md).

## Initial Implementation

The initial implementation is a folder-based structure plus a binary indexing file.

Notes are stored as files in folders. A binary index maps file paths to tags so tag-based lookup can be fast without scanning every note file on each query.

Initial storage pieces:

- Folder-based note storage
- File-based attachments
- Binary tag index
- Saved query storage
- Index rebuild path

The binary index should be treated as derived data. If it becomes stale or corrupted, it should be possible to rebuild it from the note files.

## Attachments

The note model should keep attachment references, while the storage layer manages:

- File location
- Original filename
- MIME type where available
- Size
- Created timestamp
- Any generated metadata or thumbnails later

Attachment storage should be replaceable without changing the note model.

## Search and Indexing

The first index should focus on mapping file paths to tags.

This supports fast tag-based queries such as:

- All task notes
- All notes for `project:walnut`
- All notes with `status:undone`

The index can grow later to include more query data. The generic query interface should stay stable even if the indexing strategy changes.

## Migrations

Storage formats will change over time.

The storage layer should own migrations for concrete implementations. Migration details should not leak into the core or UI.

Useful migration concerns include:

- Schema versions
- Index rebuilds
- Property type changes
- Attachment metadata changes

## Local Source of Truth

Local storage is the source of truth for the first version.

Future sync is coordinated by the [Application Layer](./application-layer.md), not by storage adapters directly.
