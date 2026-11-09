import type { ReactElement } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '../../../../common/components/Button/Button';
import { Message } from '../../../../common/components/Message/Message';
import { MessageTone } from '../../../../common/components/Message/types';
import { TagChips } from '../../../../common/components/TagChips/TagChips';
import { Text } from '../../../../common/components/Text/Text';
import { createReturnToState } from '../../../../common/navigation/return-to';
import { formatIsoDate } from '../../../../common/regional/format-date';
import { useRegional } from '../../../../common/regional/useRegional';
import { LoadState } from '../../types';
import { createTaskDetailsPath } from '../../views/view-path';
import { TaskStatusMarker } from '../TaskStatusMarker/TaskStatusMarker';
import type { DayGroupsProps, TaskListProps, TaskRowProps, TaskRowsProps } from './types';
import './TaskList.css';

const LOADING_MESSAGE = 'loading tasks…';
const FAILURE_MESSAGE = 'Could not load tasks.';
const EMPTY_DAY_MARKER = '—';

// One task row linking to its details: status marker, title, tags and (unless redundant) the
// due date. The link carries the current list URL so the details panel can return to it.
function TaskRow({ isDueDateShown, task }: TaskRowProps): ReactElement {
  const { settings } = useRegional();
  const { pathname, search } = useLocation();
  const dueLabel =
    task.dueTo === null ? null : formatIsoDate({ date: task.dueTo, locale: settings.locale });

  return (
    <li className="task-row" data-status={task.status}>
      <NavLink
        className="task-row-link"
        state={createReturnToState(`${pathname}${search}`)}
        to={createTaskDetailsPath(task.id)}
      >
        <TaskStatusMarker isLabelShown={false} status={task.status} />
        <span className="task-row-title">{task.title}</span>
        <TagChips tags={task.tags} />
        {isDueDateShown && dueLabel !== null && (
          <time className="task-row-due" dateTime={task.dueTo ?? undefined}>
            {dueLabel}
          </time>
        )}
      </NavLink>
    </li>
  );
}

// A flat list of task rows.
function TaskRows({ isDueDateShown, tasks }: TaskRowsProps): ReactElement {
  return (
    <ul className="task-rows">
      {tasks.map((task) => (
        <TaskRow isDueDateShown={isDueDateShown} key={task.id} task={task} />
      ))}
    </ul>
  );
}

// The Week view: one section per day in regional order; empty days show a muted dash.
function DayGroups({ dayGroups }: DayGroupsProps): ReactElement {
  return (
    <div className="task-day-groups">
      {dayGroups.map((group) => (
        <section aria-label={group.label} className="task-day-group" key={group.date}>
          <h4 className="task-day-heading">{group.label}</h4>
          {group.tasks.length === 0 ? (
            <p className="task-day-empty">{EMPTY_DAY_MARKER}</p>
          ) : (
            <TaskRows isDueDateShown={false} tasks={group.tasks} />
          )}
        </section>
      ))}
    </div>
  );
}

// Renders a task list's loading, failure and empty states, or its rows (grouped by day for Week).
// While reloading, the previous rows stay visible and are marked busy.
export function TaskList({
  dayGroups,
  emptyMessage,
  isDueDateShown,
  onRetry,
  state,
  tasks,
}: TaskListProps): ReactElement {
  if (state === LoadState.Failed) {
    return (
      <div className="task-list-status">
        <Message tone={MessageTone.Issue}>{FAILURE_MESSAGE}</Message>
        <Button onClick={onRetry} type="button">
          retry
        </Button>
      </div>
    );
  }

  const isLoading = state === LoadState.Loading;

  if (isLoading && tasks.length === 0) {
    return (
      <div className="task-list-status">
        <Message>{LOADING_MESSAGE}</Message>
      </div>
    );
  }

  if (tasks.length === 0 && dayGroups === null) {
    return (
      <div className="task-list-status">
        <Text>{emptyMessage}</Text>
      </div>
    );
  }

  return (
    <div aria-busy={isLoading} className="task-list">
      {dayGroups === null ? (
        <TaskRows isDueDateShown={isDueDateShown} tasks={tasks} />
      ) : (
        <DayGroups dayGroups={dayGroups} />
      )}
    </div>
  );
}
