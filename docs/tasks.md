# Tasks module architecture

Task:

- id - Stable identifier used for updates, links, and storage.
- tags - Any number of lower-case tag labels, stored through `task_tags`.
- title - Short, human-readable summary of the work to do.
- description - Optional detail that captures context, acceptance criteria, or next steps.
- linkedTasks - References to tasks that are related, dependent, or blocked by this task.
- linkedNotes - References to notes that provide supporting context.
- createdAt - Timestamp recorded when the task is first created.
- updatedAt - Timestamp refreshed whenever task content or links change.
- dueTo - Optional target date or deadline for completing the task.
- status - Current task state: `undone`, `inProgress`, or `done`.

Operations

- create - Add a task with its initial content, metadata, and links.
- update - Change task fields while preserving its stable identity.
- remove(ids[]) - Delete one or more tasks and clean up references where needed.
- get(ids[]) - Retrieve complete task data for one or more identifiers.
- find(filters) - Return tasks that match the supplied filters.
  - filters (every supplied filter combines with AND)
    - title - Partial, case-insensitive title match. The description is not searched. SQLite folds ASCII only, so non-Latin titles match case-sensitively.
    - tags - `tags=a,b`: the task must carry **all** of these labels, each matched in full (`wor` does not match `work`). Labels are lower-cased before matching; an unknown label returns `[]`.
    - viewId - The task must carry all tags of this owned `task` view. A view with no tags adds no condition; an unknown or foreign view returns `[]`.
    - dueFrom / dueUntil - Inclusive `YYYY-MM-DD` bounds on `dueTo`. Tasks without a due date never match a range.
    - dueTo - Match a specific due date, or `defined` for any task with a due date.
    - tagId - The task must carry this tag id.
    - status - Exact status match.
  - Results are ordered by `updatedAt` descending.
- findNoteByTitleAndLink(title) - Locate a note by title and attach it to the task.
- findTaskByTitleAndLink(title) - Locate another task by title and create a task-to-task link.
