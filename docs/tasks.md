# Tasks module architecture

Task:

- id - Stable identifier used for updates, links, and storage.
- tag - Optional category or label for grouping related tasks.
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
  - filters
    - tag - Exact tag match.
    - title - Partial, case-insensitive title match.
    - dueTo - Match a specific due date or tasks with a defined due date.
    - status - Exact status match.
- findNoteByTitleAndLink(title) - Locate a note by title and attach it to the task.
- findTaskByTitleAndLink(title) - Locate another task by title and create a task-to-task link.
