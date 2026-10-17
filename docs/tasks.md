# Tasks module architecture

Task

- id — stable identifier used for updates, links, and storage.
- tag — optional category or label for grouping related tasks.
- title — short, human-readable summary of the work to do.
- description — optional detail that captures context, acceptance criteria, or next steps.
- linkedTasks — references to tasks that are related, dependent, or blocked by this task.
- linkedNotes — references to notes that provide supporting context.
- createdAt — timestamp recorded when the task is first created.
- updatedAt — timestamp refreshed whenever task content or links change.
- dueTo — optional target date or deadline for completing the task.

Operations

- create — add a task with its initial content, metadata, and links.
- edit — update task fields while preserving its stable identity.
- delete — remove a task and clean up references to it where needed.
- find note by title and link — locate a note by title and attach it to the task.
- find task by title and link — locate another task by title and create a task-to-task link.
