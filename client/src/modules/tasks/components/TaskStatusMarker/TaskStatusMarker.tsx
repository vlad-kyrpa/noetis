import { Circle, CircleCheck, CircleDot } from 'lucide-react';
import type { ReactElement } from 'react';
import { TaskStatus } from '../../types';
import type { TaskStatusDefinition, TaskStatusMarkerProps } from './types';
import './TaskStatusMarker.css';

const TASK_STATUS_DEFINITIONS: Readonly<Record<TaskStatus, TaskStatusDefinition>> = {
  [TaskStatus.Undone]: { icon: Circle, label: 'not started' },
  [TaskStatus.InProgress]: { icon: CircleDot, label: 'in progress' },
  [TaskStatus.Done]: { icon: CircleCheck, label: 'done' },
};

// ○ / ◐ / ● status marker shared by list rows and the details panel; colours follow the status.
export function TaskStatusMarker({ isLabelShown, status }: TaskStatusMarkerProps): ReactElement {
  const { icon: StatusIcon, label } = TASK_STATUS_DEFINITIONS[status];

  return (
    <span className="task-status-marker" data-status={status}>
      <StatusIcon
        aria-hidden={isLabelShown}
        aria-label={isLabelShown ? undefined : label}
        role={isLabelShown ? undefined : 'img'}
        size="var(--icon-size-1)"
      />
      {isLabelShown && <span>{label}</span>}
    </span>
  );
}
