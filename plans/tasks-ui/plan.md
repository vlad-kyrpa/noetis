# Task Views UI — Plan

## Goal

The main page of the tasks area (`/tasks`) shows the user's **task lists**, which are views over tasks:

1. **Search bar** across the top of the page: a text input and a search button. It fires one request per submit.
   - The input accepts `#tag1 #tag2 some text` or `some text #tag`.
   - It is parsed into a search text plus a lower-case tag list.
   - **Scope:** with a view open, the search narrows **that view**. With no view open, it searches **all tasks**.
2. **Built-in views**, hardcoded and always first:
   - **Day**: tasks due on one date.
   - **Week**: tasks due in one full 7-day week.
   - **All tasks**: every task, with no date filter.
   - Day and Week show the date or range as a header, with ◀ / ▶ buttons that step by a day or a week.
   - "Today", the first day of the week, and date formatting all come from **regional settings**. They default to the browser's current locale and time zone.
3. **Custom views**, the user's saved `task` views from `GET /api/views?type=task`, listed below the built-ins.
4. The **context add button** (top-right bookmark) opens the **create view** form.
   - The form is a **reusable** views-module page that takes the view type(s) it creates (`task`, `note`, `expense`).
   - The tasks area mounts it with `ViewType.Task`. The notes and expenses areas can mount the same page later.
5. A **view actions button** sits at the top right of an open **custom** view. It is a placeholder for edit and delete, which come later.
6. Clicking a view, or running a search, opens a **task list**:
   - **Mobile**: the list replaces the views page, with a back control.
   - **Tablet / PC** (`LayoutScale.Tablet | Full`): the page splits in half, with views on the left and tasks on the right.
   - With nothing selected, the right side shows a "pick a view" placeholder.
7. **Tags are lower case everywhere.** Search tags, view tags and every saved tag are normalized to lower case, and existing tags are migrated.

## Current state

| Fact | Where | Impact |
| --- | --- | --- |
| The `/tasks/*` route renders a placeholder `<h1>tasks</h1>`. | [App.tsx](../../client/src/App.tsx) | Replace it with the new page tree. |
| `modules/tasks` on the client is empty. | `client/src/modules/tasks` | Everything here is new. |
| No backend client factory or `useModuleClient` exists yet. Only `joinPath` does. | [common/backend-client](../../client/src/common/backend-client) | **Prerequisite**: phase 4 of [client-auth-overhaul](../client-auth-overhaul/plan.md). |
| `GET /api/tasks` supports `dueTo` only as an exact match or `'defined'`. | [tasks/routes/get.ts](../../backend/src/modules/tasks/routes/get.ts) | Week needs a date **range**. |
| The task service still filters and writes `tasks.tagId`, which the schema dropped in favour of `task_tags`. | [task-service.ts](../../backend/src/modules/tasks/services/task-service.ts) | **Prerequisite**: finish the tags migration in the task service. |
| Views carry tag labels (`View.tags`). Tasks can only be filtered by a single `tagId`. | [views/types.ts](../../backend/src/modules/views/types.ts) | Custom views and search need multi-tag filters. |
| Tag labels are stored as typed. `tags_user_label_unique` is case-sensitive, so `Work` and `work` can both exist. | [schema.ts](../../backend/src/database/schema.ts) | Normalize on write and migrate existing rows (merging duplicates). |
| Tags are written in two places: `resolveTags` (used by tasks, notes, expenses and views) and `tagService.create`. | [resolve-tags.ts](../../backend/src/modules/tags/services/resolve-tags.ts), [tag-service.ts](../../backend/src/modules/tags/services/tag-service.ts) | One shared normalizer covers every write. |
| SQLite `lower()` / `LIKE` fold ASCII only. | — | Lowercasing happens in JS, never in SQL. |
| `title` filter is a case-insensitive substring `LIKE`. | task-service `find` | Search text reuses it. |
| Client `HttpQuery` values are scalars only. | [common/api/types.ts](../../client/src/common/api/types.ts) | Search tags are sent comma-joined. |
| `ContextAddButton` maps area → label and only runs `console.info`. | [ContextAddButton.tsx](../../client/src/common/components/ContextAddButton/ContextAddButton.tsx) | Map area → action (label + route) instead. |
| `useLayout()` already returns `LayoutScale`. | [useLayout.ts](../../client/src/common/hooks/useLayout.ts) | It drives split vs. single-pane. |
| `dueTo` is a `YYYY-MM-DD` string or `null`. | e2e fixtures | ISO dates compare correctly as strings, so ranges are cheap. |

## UX

### Page shape

```
Tablet / PC                                         Mobile
┌──────────────────────────────────────────────┐    ┌──────────────────────┐
│ [ #urgent review                ] [ search ] │    │ [ #urgent… ] [search]│
├──────────────────────┬───────────────────────┤    ├──────────────────────┤
│ Day                  │ Work               ⋯  │    │ Day                  │
│ Week                 │ review  #urgent    ✕  │    │ Week                 │
│ All tasks            │   ○ Review PR   #work │    │ All tasks            │
├──────────────────────┤   ◐ Review plan #work │    ├──────────────────────┤
│ Work          ●      │                       │    │ Work           #work │
│ Groceries   #errands │                       │    │ Groceries   #errands │
└──────────────────────┴───────────────────────┘    └──────────────────────┘
```

- The search bar sits above both columns. On mobile it shows above the views list and above whichever task list is open.
- `⋯` is the view actions button, shown on custom views only.
- `review #urgent ✕` is the active search, scoped to this view, with a clear button.

### Routes

| Path | Mobile | Tablet / PC |
| --- | --- | --- |
| `/tasks` | Views list | Views list + "pick a view" placeholder |
| `/tasks/views/day?date=2026-11-07` | Day tasks + header | Views list + day tasks |
| `/tasks/views/week?date=2026-11-02` | Week tasks + header | Views list + week tasks |
| `/tasks/views/all` | All tasks | Views list + all tasks |
| `/tasks/views/:id` | Custom view tasks | Views list + custom view tasks |
| `/tasks/views/new` | Create view form | Views list + create view form |
| `/tasks/search` | Global search results | Views list + global search results |

- `day`, `week`, `all` and `new` are reserved view ids. Custom ids are UUIDs, so they can't collide.
- The period anchor lives in the URL (`?date=`). Reload, back/forward and sharing all keep the position.
  - A missing or invalid `date` falls back to regional today.
  - For Week, the date snaps to the regional first day of that week.
- The selected view is highlighted in the list. A `NavLink` gives `aria-current` for free.
- The active search is page state, not part of the URL (see [Search](#search)). Reloading drops it, and `/tasks/search` then shows "enter a search".

### Views list

```
┌─────────────────────────────┐
│ Day                         │  ← built-in section
│ Week                        │
│ All tasks                   │
├─────────────────────────────┤
│ Work                  #work │  ← custom views, title + tags
│ Groceries          #errands │
└─────────────────────────────┘
```

- States: loading, error (with a retry), and empty custom section ("no views yet — use + to create one").

### Regional settings

- The app reads `RegionalSettings { locale, timeZone, firstDayOfWeek }` once at the composition root.
  - **locale**: `navigator.language`.
  - **timeZone**: `Intl.DateTimeFormat().resolvedOptions().timeZone`.
  - **firstDayOfWeek**: `new Intl.Locale(locale)`, then `getWeekInfo()` (or the `weekInfo` getter in older engines), then `.firstDay`. It falls back to **Monday** where the API is missing, which is Firefox today.
- These are the "current by default" values. A user-settings override can replace the provider value later without touching any consumer.
- **Day:**
  - "Today" is the calendar date in `timeZone`. The clock reads `Intl.DateTimeFormat('en-CA', { timeZone })`, which formats as `YYYY-MM-DD`.
  - The header is formatted with `locale`.
- **Week:**
  - 7 days, starting on `firstDayOfWeek`. That is Monday–Sunday for `en-GB` / `uk` / `de`, and Sunday–Saturday for `en-US`.
  - The header is formatted with `locale`.

### Period header (Day / Week only)

```
◀   Saturday, 7 Nov 2026   ▶        (day: ±1 day)
◀     2 – 8 Nov 2026       ▶        (week: ±7 days, Monday-first locale)
◀     1 – 7 Nov 2026       ▶        (week: Sunday-first locale, e.g. en-US)
◀  30 Nov – 6 Dec 2026     ▶        (range across months)
◀ 29 Dec 2025 – 4 Jan 2026 ▶        (range across years)
```

- Ranges use `Intl.DateTimeFormat.prototype.formatRange`, which collapses shared month or year parts correctly for each locale.
- ◀ / ▶ are `Button`s with `aria-label="previous day"`, `"next week"` and so on. They replace the `date` query param, which adds a history entry so browser back works.
- In the week view, tasks are grouped under 7 per-day sub-headings in regional order, with locale weekday names. Empty days show a muted "—".

### Task list (all views and search)

- **Panel header:**
  - The view title (or the period header for Day and Week).
  - The active search chips with a ✕ clear button, when a search is applied.
  - The view actions button `⋯` at the top right, on custom views only.
- **Rows** show the title, a status marker (`undone` / `inProgress` / `done`), the tags, and `dueTo`. `dueTo` is hidden in the Day view because it's redundant.
- **States:** loading, error (with a retry), and empty ("no tasks" / "nothing found").
- A mobile-only back control in the header returns to `/tasks`.
- All tasks and search results are ordered by the backend's `updatedAt desc`.

### View actions button (placeholder)

- A `⋯` button at the top right of an open **custom** view's panel header. Built-in views have nothing to edit, so they don't show it.
- It opens a small menu with **Edit view** and **Delete view**.
  - Both are rendered **disabled**, with "coming soon" as a hint, until those flows are built.
  - Enabling one later only means passing a handler. The menu is not restructured.
- It's built on a reusable `ContextMenuButton` (`common/components/ContextMenuButton`). This takes `actions: readonly ContextMenuAction[]` (`id`, `label`, `icon`, `onSelect?`, `disabled`).
- It's keyboard accessible: `aria-haspopup="menu"` and `aria-expanded`. Escape closes the menu and returns focus to the button. Arrow keys move between items.
- The backend already has `PUT` and `DELETE /api/views/:id`, so wiring edit and delete later needs no backend work.

### Search

**Scope**

| Where the user is | Submit applies to | Request |
| --- | --- | --- |
| A view (`/tasks/views/:viewId`) | That view: its date range or `viewId` **AND** the search | `GET /api/tasks?viewId=…&title=…&tags=…` (or `dueFrom/dueUntil` + search) |
| No view (`/tasks`, `/tasks/views/new`) | All tasks; navigates to `/tasks/search` | `GET /api/tasks?title=…&tags=…` |
| `/tasks/search` | All tasks | same |

- The active search is stored with the **scope** it was submitted in: a view id, or `global`.
- **Within the same view**, stepping ◀ / ▶ on Day or Week keeps the search applied. Each step is one request, which happens anyway when navigating.
- **Switching to a different view** drops the active search, so a search never silently filters a view it wasn't run in. The text stays in the input, so one click re-applies it.
- **✕ on the chips** clears the active search and refetches the plain view (one request).

**Interaction**
- It is a `<form>` with an input and a **search** button. A submit (button click or Enter in the input) is the only search action that triggers a request.
- Typing does **not** search. There is no debounce, no search-as-you-type and no request deduplication. Every submit sends exactly one request, even when the query is unchanged, so the user can refresh results.
- If a previous request is still in flight, it is not cancelled. Only the **latest** response is rendered.
- On a parse failure, no request is sent. The message shows under the input (`aria-describedby`, `aria-invalid`) and clears on the next edit.

**Reusable by design.** The parser, its failures and messages, the input-state hook and the `SearchBar` / `SearchQueryChips` components live in `common/`. They know nothing about tasks, so notes, expenses or any other list can reuse them as-is. The tasks module only adds the last steps: mapping a parsed `SearchQuery` to a task request, and the view scoping.

**Parsing** (`parseSearchInput({ input, syntax })`, pure, returns `Result<SearchQuery, SearchParseFailure>`)

`syntax: SearchSyntax` is optional and defaults to `DEFAULT_SEARCH_SYNTAX`. It holds the tag prefix, the tag label pattern and the length limits, so another module can tighten or loosen the rules without forking the parser. The steps below use the default values.

1. **Sanitize** the raw input:
   1. Normalize it with `normalize('NFKC')`.
   2. Replace control and format characters (`\p{Cc}`, `\p{Cf}`, such as zero-width spaces) with a space.
   3. Collapse whitespace runs to one space, then trim.
2. **Guard** the result:
   - Empty → `Empty`.
   - Longer than `maxInputLength` (200) → `TooLong`.
3. **Tokenize** on spaces. A token that starts with `#` is a **tag**. Anything else is a **word**.
4. **Validate tags.** Strip the `#`, then check the label:
   - It must match `tagLabelPattern` (`^[\p{L}\p{N}_-]+$`, so Unicode letters work: `#робота` is fine).
   - It must be at most `maxTagLength` characters.
   - A bare `#` → `EmptyTag`. Anything else invalid (`#a,b`, `#a#b`) → `InvalidTag { token }`, quoting what the user typed.
5. **Check the layout.** Collapse consecutive tokens of the same kind into runs. Only these shapes are accepted:
   - `tags`
   - `words`
   - `tags words`
   - `words tags`
   - `tags words tags` → `TextBetweenTags`.
   - `words tags words`, or any longer run sequence → `TagsInsideText`.
6. **Build** the query:
   - `text` is the words joined with one space, or `null` when there are no words.
   - `tags` are the labels passed through the shared `normalizeTagLabel` (trim + `toLowerCase()`, which is Unicode-aware and locale-independent). They are then deduped, keeping input order.

| Input | Result |
| --- | --- |
| `#tag1 #tag2 some custom text` | `{ text: "some custom text", tags: ["tag1", "tag2"] }` |
| `some string #tag` | `{ text: "some string", tags: ["tag"] }` |
| `   some​   text  ` | `{ text: "some text", tags: [] }` |
| `#Work #work` | `{ text: null, tags: ["work"] }` |
| `Review #Urgent #Робота` | `{ text: "Review", tags: ["urgent", "робота"] }` |
| `#a some text #b` | ✗ `TextBetweenTags` |
| `some #a text` | ✗ `TagsInsideText` |
| `#` / `text #` | ✗ `EmptyTag` |
| `#a,b text` | ✗ `InvalidTag "#a,b"` |
| (empty / spaces only) | ✗ `Empty` |

Messages come from `SEARCH_FAILURE_MESSAGES: Record<SearchParseFailureKind, (failure) => string>`, for example "Put tags at the start or the end, not between words".

**Request (tasks-specific)**
- `mergeTaskListQueries({ view: toTaskListQuery(selection), search: toSearchTaskListQuery(query) })` combines the view's fields with the search's `title` and `tags`.
- Commas in `tags=a,b` are safe because the tag label pattern excludes them.
- The client only parses and passes values on. **All matching is decided by the backend:**
  - **Text** is a partial, case-insensitive match against the task **title** only.
  - **Tags** are full-label matches. The task must have **all** the given tags.
  - Everything combines with AND: the view's tags and range, the search text and the search tags.

### Create view form (reusable, multi-type)

- Lives in the shared **views** module, not in tasks. It knows nothing about any one area.
- It takes `types: readonly ViewType[]`, where `ViewType` is `Task | Note | Expense`:
  - **One type** (`[ViewType.Task]` from the tasks area) means the type is fixed and no picker is shown.
  - **Several types** show a segmented **Type** picker as the first field. It defaults to `types[0]`.
- Labels per type come from `VIEW_TYPE_DEFINITIONS: Record<ViewType, { label, titlePlaceholder }>`. Every type must be handled, and the form has no `switch`.
- Fields:
  - **Type**, shown only when there is more than one.
  - **Title**, required and trimmed.
  - **Tags**, a comma-separated input rendered as chips, optional. Chips show the **lower-cased** label as it will be saved.
- The page is driven by callbacks: `onCreated(view)` and `onCancel()`. The owning area decides where to navigate and what to reload. The tasks area refreshes its views list and navigates to `/tasks/views/:newId`.
- Failures:
  - `409` shows "A view with this title already exists" on the title field.
  - Validation issues show per field.
  - Network failures show a form-level message.
- In the tasks area, cancel navigates back to `/tasks`.

### Context add button

- In `AppArea.Tasks`, it shows "create view" and navigates to `routes.tasks.createView`.
- Other areas keep their labels. Their actions stay as `console.info` until their flows exist. When notes or expenses get a views page, they point at their own `…/views/new` route, which mounts the same `CreateViewPage` with their type.

## Backend changes

### 1. Finish the tags migration in the task service (prerequisite)

- Remove `tasks.tagId` usage in `create` / `update` / `find`.
- Filter by tag through `task_tags`.

### 2. Lower-case tag labels everywhere

**On write**
- Add `normalizeTagLabel(label: string): string` (trim + `toLowerCase()`) in `modules/tags/normalize-tag-label.ts`.
- Apply it at every boundary:
  - In zod: the `tags` arrays of task, note, expense and view inputs, and `label` in tag create. Each becomes `.transform(normalizeTagLabel)`, followed by a dedupe of the array.
  - In `resolveTags` and `tagService.create`, as a second line of defence. Services must not depend on validation having run.
- Responses return the stored, already lower-case labels, so clients see the canonical form right after saving.

**Existing rows: a one-off data migration**
- SQLite `lower()` folds ASCII only, so a plain SQL migration would leave `Робота` untouched. The migration is computed in JS.
- Add `backend/scripts/normalize-tag-labels.ts`:
  1. Read all `tags` rows with `wrangler d1 execute <db> --json --command "SELECT id, user_id, label, created_at FROM tags"`.
  2. Group the rows by `(user_id, normalizeTagLabel(label))`. In each group, keep the **oldest** id.
  3. For every duplicate id, emit SQL that moves its links to the kept id, then deletes it:
     - For each of `task_tags`, `note_tags`, `expense_tags` and `view_tags`: `INSERT OR IGNORE INTO x_tags (owner_id, tag_id) SELECT owner_id, '<kept>' FROM x_tags WHERE tag_id = '<dup>'`, then `DELETE FROM x_tags WHERE tag_id = '<dup>'`.
     - Then `DELETE FROM tags WHERE id = '<dup>'`.
  4. Emit `UPDATE tags SET label = '<normalized>' WHERE id = '<kept>'` wherever the label changes.
  5. Write everything to `normalize-tag-labels.sql` in one transaction, and run it with `wrangler d1 execute --file`.
- Steps 3 and 4 each run once per environment: `--local`, the e2e database, and remote.
- The script is idempotent. A second run finds no groups and no changed labels, and emits nothing.
- `--dry-run` prints the merges without writing. Check it against remote before applying.
- After the migration, `tags_user_label_unique` effectively becomes case-insensitive, because every label is lower case.

### 3. Extend `TaskFilters`

```ts
export interface TaskFilters {
  readonly title?: string;                 // substring, case-insensitive (unchanged)
  readonly tagId?: string;
  readonly dueTo?: string;                 // exact day or 'defined' (unchanged)
  readonly dueFrom?: string;               // NEW inclusive, YYYY-MM-DD
  readonly dueUntil?: string;              // NEW inclusive, YYYY-MM-DD
  readonly viewId?: string;                // NEW tasks matching all of the view's tags
  readonly tags?: readonly string[];       // NEW tasks having all these labels (query: comma-joined)
  readonly status?: TaskStatus;
}
```

- **All filters combine with AND.** This is what makes view-scoped search work: `viewId` (or `dueFrom`/`dueUntil`) plus `title` plus `tags` in one request.
- **`dueFrom` / `dueUntil`** turn into `gte(tasks.dueTo, from)` and `lte(tasks.dueTo, until)`. Both are validated with `z.string().regex(ISO_DATE_PATTERN)`.
  - Day view: `dueFrom = dueUntil = date`.
  - Week view: `dueFrom = weekStart`, `dueUntil = weekStart + 6`.
  - The client computes both bounds from regional settings. The backend stays locale-agnostic.
- **`viewId`**: the service looks up the owned view's tag ids.
  - A view with no tags adds no tag condition.
  - An unknown or foreign `viewId` returns `[]`.
- **`title`** (unchanged): a partial, case-insensitive substring match on the title (`lower(title) LIKE %text%`). The description is not searched.
  - Known limitation: SQLite folds ASCII only, so Cyrillic titles match case-sensitively. This is out of scope here.
- **`tags`**: the query string `tags=a,b` is parsed by zod: `z.string().transform(split(',') → normalizeTagLabel → filter non-empty → dedupe)`, with a max count.
  - Stored labels are lower case after step 2, so matching is plain SQL equality: `inArray(tags.label, normalized)` scoped to the user. There's no full-scan comparison in JS.
  - Each label must **fully** match a tag. There is no prefix or substring matching, so `#wor` does not match `work`.
  - If any requested label has no matching tag, the result is `[]`, returned before the task query.
- **Tag matching helper.** The tag ids from `viewId` and from `tags` are unioned and passed to one helper. It builds the "has all of these tag ids" condition: a `task_tags` `GROUP BY task_id HAVING COUNT(DISTINCT tag_id) = n`.

### 4. Tests

Add e2e cases to `tasks.e2e.test.ts`, `tags.e2e.test.ts` and `views.e2e.test.ts`:

**Date range**
- range bounds are inclusive
- tasks with `dueTo` outside the range are excluded
- `null` `dueTo` is excluded

**`viewId`**
- `viewId` uses match-all semantics
- a foreign view returns `[]`

**`tags` and `title`**
- `tags` uses match-all semantics and full-label matching (`wor` ≠ `work`)
- `tags=Робота` matches a tag saved as `Робота`, because both sides normalize to `робота`
- `title` matches partially and case-insensitively (`REV` finds "Code review"), never against the description
- `viewId` + `title` + `tags` applies all filters (AND); `dueFrom`/`dueUntil` + `tags` likewise
- an unknown tag returns `[]`

**Saving tags**
- creating a task, note, expense, view or tag with `Work` stores and returns `work`
- `["Work", "work"]` in one input saves a single tag

## Client architecture

Follows AGENTS.md:
- Date math, the search parser, query merging and view → query mapping are pure functions.
- Hooks are thin React adapters.
- Clients come from `useModuleClient`.

### Types (`modules/tasks/types.ts`)

```ts
export enum TaskStatus { Undone = 'undone', InProgress = 'inProgress', Done = 'done' }

export interface Task {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly tags: readonly string[];
  readonly dueTo: IsoDate | null;
  readonly status: TaskStatus;
}

// Reserved route ids of the hardcoded views; also the URL segment.
export enum BuiltInViewId { Day = 'day', Week = 'week', All = 'all' }

// What a selected view is, so query building and headers can be looked up by key.
export enum ViewKind { Day = 'day', Week = 'week', All = 'all', Custom = 'custom' }

export enum PeriodDirection { Previous = -1, Next = 1 }

export type ViewSelection =
  | { readonly kind: ViewKind.Day; readonly anchor: IsoDate }
  | { readonly kind: ViewKind.Week; readonly anchor: IsoDate }   // always the regional week start
  | { readonly kind: ViewKind.All }
  | { readonly kind: ViewKind.Custom; readonly viewId: string };

export interface TaskListQuery {
  readonly dueFrom?: IsoDate;
  readonly dueUntil?: IsoDate;
  readonly viewId?: string;
  readonly title?: string;
  readonly tags?: readonly string[];   // serialized comma-joined by the tasks client
}

// Where a search was submitted; a view id ('day' | 'week' | 'all' | uuid) or global.
export const GLOBAL_SEARCH_SCOPE = 'global';
export type SearchScope = string;

export interface ActiveSearch {
  readonly query: SearchQuery;
  readonly scope: SearchScope;
  readonly submission: number;         // increments on every submit → one request each
}

export enum LoadState { Idle, Loading, Ready, Failed }
```

### Shared tag normalization (`common/tags/normalize-tag-label.ts`)

- `normalizeTagLabel(label)` trims and calls `toLowerCase()`. It's the client twin of the backend function.
- It's used by the search parser and by the create view form's tags field.

### Reusable search (`common/search/types.ts`)

```ts
// Module-agnostic result of parsing "#tag1 #tag2 some text".
export interface SearchQuery {
  readonly text: string | null;
  readonly tags: readonly string[];    // labels without the prefix, lower-cased, deduped
}

// Tunable rules, so other modules can reuse the parser with different limits.
export interface SearchSyntax {
  readonly tagPrefix: string;          // '#'
  readonly tagLabelPattern: RegExp;    // /^[\p{L}\p{N}_-]+$/u
  readonly maxInputLength: number;     // 200
  readonly maxTagLength: number;       // 32
}

export interface ParseSearchInputParams {
  readonly input: string;
  readonly syntax?: SearchSyntax;      // defaults to DEFAULT_SEARCH_SYNTAX
}

export enum SearchParseFailureKind {
  Empty = 'empty',
  TooLong = 'tooLong',
  EmptyTag = 'emptyTag',
  InvalidTag = 'invalidTag',
  TextBetweenTags = 'textBetweenTags',
  TagsInsideText = 'tagsInsideText',
}

export type SearchParseFailure =
  | { readonly kind: SearchParseFailureKind.Empty }
  | { readonly kind: SearchParseFailureKind.TooLong; readonly maxLength: number }
  | { readonly kind: SearchParseFailureKind.EmptyTag }
  | { readonly kind: SearchParseFailureKind.InvalidTag; readonly token: string }
  | { readonly kind: SearchParseFailureKind.TextBetweenTags }
  | { readonly kind: SearchParseFailureKind.TagsInsideText };

export interface UseSearchInputParams {
  readonly onSearch: (query: SearchQuery) => void;  // called once per successful submit
  readonly syntax?: SearchSyntax;
}

export interface SearchInputState {
  readonly input: string;
  readonly setInput: (value: string) => void;       // also clears the failure
  readonly failure: SearchParseFailure | null;
  readonly failureMessage: string | null;
  readonly submit: () => void;
}
```

The shared `SearchBar` component (`common/components/SearchBar`) is presentational only:

```ts
export interface SearchBarProps {
  readonly id: string;
  readonly label: string;              // visually hidden; "search tasks"
  readonly placeholder: string;        // "#tag some text"
  readonly value: string;
  readonly failureMessage: string | null;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => void;
}
```

`SearchQueryChips` (`common/components/SearchQueryChips`) renders a `SearchQuery` as text plus tag chips, with an optional `onClear` that shows a ✕.

### Shared context menu (`common/components/ContextMenuButton`)

```ts
export interface ContextMenuAction {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly disabled: boolean;
  readonly hint?: string;              // e.g. "coming soon"
  readonly onSelect?: () => void;
}

export interface ContextMenuButtonProps {
  readonly label: string;              // aria-label, e.g. "view actions"
  readonly actions: readonly ContextMenuAction[];
}
```

### Regional settings and clock (`common/regional`)

```ts
declare const isoDateBrand: unique symbol;
export type IsoDate = string & { readonly [isoDateBrand]: true }; // YYYY-MM-DD, made only by parseIsoDate

export interface DateRange { readonly from: IsoDate; readonly until: IsoDate }

// ISO numbering, same as Intl weekInfo.firstDay.
export enum Weekday { Monday = 1, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday }

export interface RegionalSettings {
  readonly locale: string;
  readonly timeZone: string;
  readonly firstDayOfWeek: Weekday;
}

export interface Clock { today: () => IsoDate }   // calendar date in RegionalSettings.timeZone
```

- `resolveRegionalSettings(environment)` is pure. It takes `{ language, resolvedTimeZone, weekInfoFirstDay }`, read at the root, and applies the Monday fallback.
- `createRegionalClock(settings)` is the one impure seam, because it reads the system time.
- Both are created once in `app/composition.ts` and provided by `RegionalProvider`. Consumers use `useRegional()`, which returns `{ settings, clock }`.
- `IsoDate` and the date helpers live in `common/regional`, because notes and expenses will need them too.

### Pure core

| Function | Module | Purpose |
| --- | --- | --- |
| `parseIsoDate(value: string): IsoDate \| undefined` | `common/regional/iso-date` | Validates `YYYY-MM-DD` and a real calendar date. |
| `addDays({ date, days }): IsoDate` | same | Calendar math in UTC, so DST can't skip or repeat a day. |
| `weekdayOf(date): Weekday` | same | Gives the ISO weekday of a date. |
| `startOfWeek({ date, firstDayOfWeek }): IsoDate` | `common/regional/weeks` | Steps back `(weekdayOf(date) - firstDayOfWeek + 7) % 7` days. |
| `normalizeTagLabel(label): string` | `common/tags/normalize-tag-label` | Trim + `toLowerCase()`. |
| `sanitizeSearchInput(raw): string` | `common/search/sanitize-search-input` | NFKC, control/format characters → space, collapse whitespace, trim. |
| `tokenizeSearchInput({ input, syntax }): readonly SearchToken[]` | `common/search/tokenize` | Classifies each token as a tag or a word. |
| `collapseRuns(tokens): readonly SearchTokenRun[]` | same | Groups consecutive tokens of the same kind, for the layout check. |
| `parseSearchInput({ input, syntax }): Result<SearchQuery, SearchParseFailure>` | `common/search/parse-search-input` | Sanitize, guard, tokenize, validate tags, check the layout, then build. |
| `formatSearchFailure(failure): string` | `common/search/messages` | Looks up `SEARCH_FAILURE_MESSAGES: Record<SearchParseFailureKind, …>`. |
| `DEFAULT_SEARCH_SYNTAX` | `common/search/constants` | Default prefix, pattern and limits. |
| `resolvePeriodRange({ selection }): DateRange` | `tasks/views/periods` | Day → `{d, d}`; Week → `{start, start+6}`. |
| `shiftSelection({ selection, direction }): ViewSelection` | same | Day → ±1 day; Week → ±7 days. |
| `formatPeriodTitle({ selection, locale }): string` | same | `Intl.DateTimeFormat(locale, { timeZone: 'UTC' })`, using `format` for Day and `formatRange` for Week. |
| `resolveViewSelection({ viewId, dateParam, today, firstDayOfWeek }): ViewSelection` | `tasks/views/view-selection` | Maps the route param + `?date=` to a selection, with fallback to today and week snapping. |
| `toTaskListQuery(selection): TaskListQuery` | `tasks/views/task-list-query` | Built from a `Record<ViewKind, …>`. `All` → `{}`. |
| `groupTasksByDay({ tasks, range, locale }): readonly DayGroup[]` | `tasks/views/group-by-day` | Builds 7 sections in regional order with weekday labels. |
| `BUILT_IN_VIEWS: Readonly<Record<BuiltInViewId, BuiltInViewDefinition>>` | `tasks/views/built-in-views` | Each entry holds a label, a kind, whether it has a period header, whether it has view actions (all `false`), and its order. |
| `toSearchTaskListQuery(query: SearchQuery): TaskListQuery` | `tasks/search/to-task-list-query` | Maps `text → title` and keeps `tags`. |
| `mergeTaskListQueries({ view, search }): TaskListQuery` | `tasks/search/merge-queries` | Combines the view's fields with the search's `title` / `tags`. |
| `searchForScope({ active, scope }): SearchQuery \| null` | `tasks/search/scope` | Returns the active search only when it was submitted in this scope. |

### API clients

**Tasks (`modules/tasks/api`)**
- `createTasksClient(client)` returns `{ list(query): Promise<Result<readonly Task[], ApiFailure>> }`. It serializes `tags` to `tags=a,b` and omits empty fields.
- `decoders.ts` has `decodeTask` and `decodeTaskList`, using the `isRecord` helpers from `common/api/decoders`.

**Views (`modules/views`, shared by every area)**
- `createViewsClient(client)` returns:
  - `list({ type }): Promise<Result<readonly View[], ApiFailure>>`. This is `GET /views?type=…`.
  - `create(input: ViewInput): Promise<Result<View, CreateViewFailure>>`. This is `POST /views`, and it maps `Http 409` to `DuplicateTitle`.
  - `update` and `remove` are added later, alongside the edit and delete flows.
- `decoders.ts` has `decodeView` and `decodeViewList`. They reject unknown `type` values.
- `validators.ts` has `validateViewInput`. The type must be one of the allowed types and a title is required. Tags go through `normalizeTagLabel`, must be non-empty, and are deduped.
- `view-types.ts` holds `VIEW_TYPE_DEFINITIONS: Readonly<Record<ViewType, ViewTypeDefinition>>`.
- `useCreateViewForm({ types, onCreated })` follows the `useLoginForm` pattern: values (`type`, `title`, `tagsText`), field issues, form state and `submit`.
- `CreateViewForm` renders the fields, and the type picker only when `types.length > 1`. `CreateViewPage` wraps it with a heading and a cancel action.

**Views module types (`modules/views/types.ts`)**

```ts
// Wire values match the backend `ViewType`.
export enum ViewType { Task = 'task', Note = 'note', Expense = 'expense' }

export interface View {
  readonly id: string;
  readonly type: ViewType;
  readonly title: string;
  readonly tags: readonly string[];
}

export interface ViewInput {
  readonly type: ViewType;
  readonly title: string;
  readonly tags: readonly string[];
}

export interface ViewTypeDefinition {
  readonly label: string;            // "Tasks", "Notes", "Expenses"
  readonly titlePlaceholder: string; // "e.g. Work"
}

export interface CreateViewPageProps {
  readonly types: readonly ViewType[];  // non-empty; one = fixed type, several = picker
  readonly onCreated: (view: View) => void;
  readonly onCancel: () => void;
}

export enum CreateViewFailureKind { DuplicateTitle, Invalid, Network, Unknown }
export type CreateViewFailure =
  | { readonly kind: CreateViewFailureKind.DuplicateTitle }
  | { readonly kind: CreateViewFailureKind.Invalid; readonly issues: HttpValidationIssues }
  | { readonly kind: CreateViewFailureKind.Network }
  | { readonly kind: CreateViewFailureKind.Unknown; readonly message: string };
```

### Hooks

| Hook | Module | Returns |
| --- | --- | --- |
| `useSearchInput({ onSearch, syntax })` | `common/search` | `SearchInputState`. `submit()` parses the input. On failure it sets `failure`. On success it calls `onSearch(query)` **every time**, with no comparison to the previous query. It does no fetching. |
| `useTaskViews()` | `tasks/hooks` | `{ state, views, reload }` over `viewsClient.list({ type: ViewType.Task })`. It's owned by `TasksPage` and shared via the outlet context. |
| `useViewSelection()` | same | Reads `:viewId` + `?date=` + `useRegional()` and returns `{ selection, scope, step(direction) }`. `step` writes `?date=`. |
| `useTaskSearch()` | same | Owned by `TasksPage`. It composes `useSearchInput`, and its `onSearch` stores `ActiveSearch { query, scope: currentScope, submission: n + 1 }`. With no view open, it also navigates to `/tasks/search`. It exposes `{ inputState, active, clear }`. |
| `useTaskList({ query, submission })` | same | `{ state, tasks, reload }`. It fetches once whenever the serialized `query` **or** `submission` changes. A re-submit of an identical query still bumps `submission`, so it still sends one request. Stale responses are ignored via a cancelled flag in the effect cleanup. |

How a panel gets its tasks (`ViewTasksPage` / `SearchResultsPage`):

```ts
const search = searchForScope({ active, scope });          // null if submitted elsewhere
const query = mergeTaskListQueries({ view: toTaskListQuery(selection), search: search && toSearchTaskListQuery(search) });
const list = useTaskList({ query, submission: search ? active.submission : 0 });
```

- **Navigating** changes `query`, so it sends one request.
- **Submitting** changes `submission`, so it sends one request.
- **Typing** changes neither, so it sends nothing.
- **✕ clear** sets `active` to `null`, which changes `query`, so it sends one request.
- `SearchResultsPage` uses `selection = All` and `scope = GLOBAL_SEARCH_SCOPE`.

### Components and pages

```
client/src/
  app/composition.ts                       # + regionalSettings, clock
  common/
    regional/                              # NEW types.ts, iso-date.ts, weeks.ts,
                                           #     resolve-regional-settings.ts, regional-clock.ts,
                                           #     RegionalProvider.tsx, useRegional.ts
    tags/
      normalize-tag-label.ts               # NEW trim + toLowerCase
    search/                                # NEW reusable, module-agnostic
      types.ts                             # SearchQuery, SearchSyntax, SearchParseFailure, hook types
      constants.ts                         # DEFAULT_SEARCH_SYNTAX
      sanitize-search-input.ts
      tokenize.ts                          # tokenizeSearchInput, collapseRuns
      parse-search-input.ts                # parseSearchInput
      messages.ts                          # SEARCH_FAILURE_MESSAGES, formatSearchFailure
      useSearchInput.ts                    # input + failure + submit → onSearch(query)
    components/
      SearchBar/                           # NEW SearchBar.tsx, SearchBar.css, types.ts
      SearchQueryChips/                    # NEW text + tag chips, optional ✕ clear
      ContextMenuButton/                   # NEW ⋯ button + accessible menu of actions
      ContextAddButton/                    # record of { label, route } per area; navigate on click
  routes.ts                                # + tasks.createView, tasks.search, day/week/all view helpers
  modules/views/                           # NEW shared, area-agnostic
    types.ts
    view-types.ts
    api/        views-client.ts, decoders.ts, validators.ts
    hooks/      useCreateViewForm.ts
    components/ CreateViewForm/  CreateViewForm.tsx, CreateViewForm.css
    pages/      CreateViewPage.tsx         # props: types, onCreated, onCancel
  modules/tasks/
    types.ts
    api/        tasks-client.ts, decoders.ts
    views/      built-in-views.ts, periods.ts, view-selection.ts, task-list-query.ts, group-by-day.ts
    search/     to-task-list-query.ts, merge-queries.ts, scope.ts
    hooks/      useTaskViews.ts, useViewSelection.ts, useTaskSearch.ts, useTaskList.ts
    components/
      ViewsList/       ViewsList.tsx, ViewsList.css, types.ts    # built-in + custom sections
      PeriodHeader/    PeriodHeader.tsx, PeriodHeader.css        # ◀ title ▶
      PanelHeader/     PanelHeader.tsx, PanelHeader.css          # title/period + chips + actions slot
      ViewActions/     ViewActions.tsx                           # ContextMenuButton: edit/delete (disabled)
      TaskList/        TaskList.tsx, TaskList.css, types.ts      # rows, optional day grouping
    pages/
      TasksPage.tsx, TasksPage.css     # shell: search bar + views list + <Outlet>
      ViewTasksPage.tsx                # selection (+ scoped search) → PanelHeader + TaskList
      SearchResultsPage.tsx            # global search → PanelHeader + TaskList
      CreateTaskViewPage.tsx           # <CreateViewPage types={[ViewType.Task]} …/>
      NoViewSelected.tsx               # "pick a view" placeholder on split layouts
backend/
  scripts/normalize-tag-labels.ts      # NEW one-off data migration (dry-run + apply)
  src/modules/tags/normalize-tag-label.ts   # NEW
```

Routing in `App.tsx` replaces the `/tasks/*` placeholder:

```tsx
<Route element={<TasksPage />} path={routes.tasks.root}>
  <Route element={<NoViewSelected />} index />
  <Route element={<SearchResultsPage />} path="search" />
  <Route element={<CreateTaskViewPage />} path="views/new" />
  <Route element={<ViewTasksPage />} path="views/:viewId" />
</Route>
```

- React Router ranks the static `views/new` above `views/:viewId`.
- `ViewTasksPage` resolves `day` / `week` / `all` through `BUILT_IN_VIEWS`. Anything else is treated as a custom view, which shows `ViewActions`.
- The existing `routes.tasks.create` / `details` stay reserved for task CRUD later.

### Split layout (`TasksPage`)

- `isSplit = layoutScale !== LayoutScale.Mobile` and `hasPanel = useMatch(...)` (or the presence of an outlet child).
- The `SearchBar` always renders first, full width.
- Below it, the shell uses two small render helpers and picks one by `isSplit`:
  - **Split**: a `ViewsList` column and a panel column (`<Outlet context={{ reloadViews, search }} />`).
  - **Single**: render the `<Outlet>` when `hasPanel`; otherwise render `ViewsList`.
- New tokens in `index.css`:
  - `--layout-split-columns: 1fr 1fr` ("half")
  - `--layout-split-gap: var(--space-4)`
  - `--layout-panel-divider: var(--color-border)`
  - `--menu-min-width` for the context menu.
- Both columns scroll independently on split layouts (`overflow-y: auto`, height from `100dvh` minus layout padding and the search bar).

## Phases

Each phase leaves the app building and working.

0. **Prerequisites.**
   - Auth plan phase 4: `BackendClientProvider` and `useModuleClient`.
   - Finish the task-service tags migration.
1. **Lower-case tags (backend).**
   - Add `normalizeTagLabel` and apply it in the zod schemas, `resolveTags` and `tagService.create`.
   - Add `scripts/normalize-tag-labels.ts`, then run it: dry-run → local → e2e → remote.
   - Add e2e tests.
2. **Backend filters.**
   - Add `dueFrom` / `dueUntil` / `viewId` / `tags` to `TaskFilters` (AND-combined), the zod query schema and the service.
   - Add e2e tests.
3. **Client domain core.**
   - Add `common/regional`, `common/tags` and `common/search` (types, syntax, sanitize, tokenize, parse, messages).
   - Add `modules/views` types, client, decoders and validators.
   - Add tasks `types.ts`, `views/*`, `search/*` and `tasks-client`. Nothing is rendered yet.
4. **Views list page.**
   - Add the `TasksPage` shell (single-pane only), `ViewsList` and `useTaskViews`.
   - Replace the `/tasks/*` placeholder.
5. **View task lists.**
   - Add `ViewTasksPage`, `PanelHeader`, `TaskList` and `useTaskList` for All tasks and custom views.
   - Add Day/Week with `PeriodHeader`, `useViewSelection` and regional week grouping.
6. **Split layout.** Add tablet/PC two-column mode, `NoViewSelected` and the CSS tokens.
7. **Search.**
   - Add the shared `useSearchInput`, `SearchBar` and `SearchQueryChips`.
   - Add `useTaskSearch` with scoping, `SearchResultsPage` and the `/tasks/search` route.
8. **Create view and view actions.**
   - Add the reusable `modules/views` `CreateViewPage`, `CreateViewForm` and `useCreateViewForm`, and mount it as `CreateTaskViewPage`.
   - Switch `ContextAddButton` to area → `{ label, route }` and navigate.
   - Add `ContextMenuButton` and the `ViewActions` placeholder (edit and delete disabled).
9. **Docs.** Add the tasks area (routes, split behaviour, built-in views, regional settings, search syntax and scope, tag normalization) to `docs/client.md`.

## Verification

- `npm run build` and `npm run lint` pass in `client/` and `backend/` after each phase. Backend e2e tests pass after phases 1 and 2.
- **Tag migration:**
  - After the script runs, `SELECT label FROM tags WHERE label <> lower(label)` returns nothing for ASCII labels.
  - A seeded `Робота` + `робота` pair has merged into one tag, and its task, note, expense and view links are kept.
  - A second run is a no-op.
- **Search parser:** every row of the parser table above holds when checked by hand in the running app. There is no client test runner (see Decisions).
- Manual checks against `wrangler dev`:
  - **Views list:** `/tasks` lists Day, Week and All tasks first, then custom task views. Note and expense views are not listed.
  - **Day view:** shows regional today. ◀ / ▶ move one day, and `?date=` updates. Browser back returns to the previous day.
  - **Week view, Monday-first browser** (e.g. `en-GB`): on Saturday 2026-11-07 it shows **2 – 8 Nov 2026**, and ▶ shows **9 – 15 Nov 2026**.
  - **Week view, Sunday-first** (`en-US`, set via DevTools locale override): it shows **Nov 1 – 7, 2026**. Day headings are in regional order, and cross-month and cross-year ranges format correctly.
  - **Week contents:** the week shows tasks due on all 7 days, including the weekend. Tasks without `dueTo` never appear in Day or Week, but they do appear in All tasks.
  - **Day view scope:** today's Day view does not show overdue unfinished tasks from earlier days.
  - **Custom views:** a custom view shows only tasks carrying all of its tags.
  - **Search requests:**
    - Typing sends no request.
    - Each click on search (or Enter) sends exactly one `GET /api/tasks`, including repeated clicks with the same query.
    - An invalid query sends none and shows the message.
  - **Search scope:**
    - In the Work view, `#urgent review` returns only Work tasks that are also tagged `urgent` and whose title contains "review". The request carries `viewId` + `tags` + `title`.
    - In the Week view, the search keeps the date range, and ◀ / ▶ keep the search applied.
    - Switching from Work to Groceries drops the search, and the input text remains.
    - ✕ clears the search and shows the plain view.
    - On `/tasks` (no view), submitting navigates to `/tasks/search` and searches all tasks.
  - **Search matching:**
    - `#Work` and `#work` both search `work`.
    - `#wor` returns nothing when only `work` exists.
  - **Tag case:** creating a view with tags `Work, Errands` shows and saves `work`, `errands`.
  - **View actions:** `⋯` appears on custom views only. Its menu shows Edit and Delete as disabled with "coming soon". Escape closes it and focus returns to the button.
  - **Mobile width:** tapping a view or searching replaces the list, and back returns to it.
  - **Tablet/PC width:**
    - The page is split in half, and the list stays visible.
    - With nothing selected, the right side shows "pick a view".
    - The selected view is highlighted.
    - Resizing across the breakpoint switches modes without losing the route or the active search.
  - **Create view:**
    - In the tasks area, + opens the create form with no type picker.
    - Creating a view adds it to the list and opens it.
    - A duplicate title shows the field error.
  - **Multi-type form:** temporarily mount `CreateViewPage` with `types={[ViewType.Task, ViewType.Note]}`. The picker appears, and the created view has the chosen `type`.
  - **Bad input:** `/tasks/views/garbage-id` shows an empty or "view not found" state instead of crashing. `?date=nope` falls back to regional today.

## Decisions

- **The URL is the state for views.** View id and period anchor live in the route and query, with no client store. The active search is page state, because search is explicitly request-per-submit.
- **Regional by default.** Locale, time zone and first day of the week come from the browser. The week has 7 days. The fallback first day is Monday.
- **The client owns date bounds.** The backend only receives inclusive `YYYY-MM-DD` ranges and knows nothing about locales.
- **The backend decides all matching.** The client only parses and passes values on.
  - Tags must match the full label, and a task must have all of them.
  - Text is a partial, case-insensitive match on the title only.
  - All filters combine with AND.
  - A view with no tags shows all tasks.
- **Tags are lower case everywhere.**
  - Search tags, view form tags and every backend write are normalized with JS `toLowerCase()`.
  - Existing rows are migrated by a JS-computed script, because SQLite `lower()` is ASCII-only.
  - Duplicates that differ only by case are merged into the oldest tag.
- **Search is scoped to the open view.** Without a view, it is global. Switching views drops the search, while stepping Day/Week keeps it.
- **Search parsing is shared.** `common/search` and the `SearchBar` / `SearchQueryChips` components have no tasks imports. A module reuses them by supplying its own `onSearch` and a `SearchQuery` → request mapper.
- **Search syntax is strict.** Tags go only at the start or the end. `#a text #b` and `some #a text` are both rejected with explicit messages.
- **Search requests are never deduplicated.** Only out-of-order responses are discarded.
- **Day is strictly that date.** Overdue unfinished tasks from earlier days are not carried into today.
- **Day/Week/All show every status**, including `done`. Filtering by status is out of scope.
- **Split layout with nothing selected** shows a "pick a view" placeholder.
- **View edit and delete come later.** The `⋯` view actions button and its disabled menu ship now, so the slot and the interaction are settled.
- **No client test runner.** Vitest is not added. The backend is covered by e2e tests.
- **No task CRUD in this plan.** Rows are read-only. Opening a task's details and editing it come later.

## Open questions

None at the moment.
