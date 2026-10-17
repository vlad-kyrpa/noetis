# Notes module architecture

Note:

- id - Stable identifier used for updates, links, and storage.
- title - Concise, searchable name for the note.
- body - The note's full text content.
- createdAt - Timestamp recorded when the note is first created.
- updatedAt - Timestamp refreshed whenever the note changes.
- tags - Tag references used for organization and filtering.
- linkedTasks - References to tasks that the note supports or describes.
- linkedNotes - References to other notes with related context.

Operations

- create - Add a note with its initial content, tags, and links.
- update - Change note content, tags, or links while preserving its identity.
- remove(ids[]) - Delete one or more notes by identifier and clean up references where needed.
- get(ids[]) - Retrieve complete note data for one or more identifiers.
- find(filters) - Return notes that match the supplied filters.
  - filters
    - tags - Exact tag matches.
    - title - Partial, case-insensitive title match.
    - body - Partial, case-insensitive body-content match.
