# Tags module architecture

Tag:

- id - Stable identifier for the tag.
- label - Human-readable name used to categorize notes, tasks, and expenses.
- createdAt - Timestamp recorded when the tag is created.

Operations

- find(label) - Return tags whose labels partially match the query; return all tags when the query is null.

Normalization

- Labels are lower case everywhere. `normalizeTagLabel` (`modules/tags/normalize-tag-label.ts`) trims and calls JS `toLowerCase()`, which is Unicode-aware, so `Робота` becomes `робота`. SQLite `lower()` folds ASCII only, so lowercasing never happens in SQL.
- It runs at every write boundary: the zod `tags` arrays of task, note and view inputs (`tagLabelsSchema`, which also dedupes), the tag create `label`, and again inside `resolveTags` and `tagService.create`, so services never depend on validation having run.
- Existing rows are migrated by `backend/scripts/normalize-tag-labels.ts`. It groups tags by user and normalized label, keeps the oldest tag of each group, moves the task/note/expense/view links of duplicates onto it, deletes the duplicates and lower-cases the kept label. Run it from `backend/`:
  1. `npx tsx scripts/normalize-tag-labels.ts --remote --dry-run` — print the merges without writing.
  2. `npx tsx scripts/normalize-tag-labels.ts --local`, then `--remote` — apply.
  - It is idempotent: a second run finds nothing to change.
