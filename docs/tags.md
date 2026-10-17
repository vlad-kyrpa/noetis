# Tags module architecture

Tag:

- id - Stable identifier for the tag.
- label - Human-readable name used to categorize notes, tasks, and expenses.
- createdAt - Timestamp recorded when the tag is created.

Operations

- find(label) - Return tags whose labels partially match the query; return all tags when the query is null.
