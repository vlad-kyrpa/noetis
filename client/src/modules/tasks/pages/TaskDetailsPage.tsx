import type { ReactElement } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Button } from '../../../common/components/Button/Button';
import { Heading } from '../../../common/components/Heading/Heading';
import { HeadingScale } from '../../../common/components/Heading/types';
import { Message } from '../../../common/components/Message/Message';
import { MessageTone } from '../../../common/components/Message/types';
import { readReturnTo } from '../../../common/navigation/return-to';
import { routes } from '../../../routes';
import { PanelHeader } from '../components/PanelHeader/PanelHeader';
import { TaskEditor } from '../components/TaskEditor/TaskEditor';
import { useTask } from '../hooks/useTask';
import { LoadState } from '../types';
import type { TaskDetailsState } from '../types';
import './TaskPanel.css';

const PANEL_HEADING_ID = 'task-details-title';
const PANEL_LABEL = 'task details';
// Only mounted under `:taskId`, so a missing param means the route table is broken.
const MISSING_TASK_ID = '';
const LOADING_TITLE = 'loading task…';
const MISSING_TITLE = 'task not found';
const FAILED_TITLE = 'task';
const FAILURE_MESSAGE = 'Could not load the task.';
const MISSING_MESSAGE = 'This task does not exist or was deleted.';

interface TaskDetailsStatusProps extends TaskDetailsState {
  readonly backTo: string;
}

// Names the panel while there is no task to edit: loading, not found, or failed.
const resolveStatusTitle = ({ isMissing, state }: TaskDetailsState): string => {
  if (isMissing) {
    return MISSING_TITLE;
  }

  return state === LoadState.Failed ? FAILED_TITLE : LOADING_TITLE;
};

// The panel without a task: a header with back, then a not-found note, a retry, or nothing
// while loading.
function TaskDetailsStatus({ backTo, ...taskDetails }: TaskDetailsStatusProps): ReactElement {
  const { isMissing, reload, state } = taskDetails;
  const hasFailed = !isMissing && state === LoadState.Failed;

  return (
    <section aria-labelledby={PANEL_HEADING_ID} className="task-panel">
      <PanelHeader
        actions={null}
        backTo={backTo}
        search={null}
        title={
          <Heading id={PANEL_HEADING_ID} scale={HeadingScale.Subsection}>
            {resolveStatusTitle(taskDetails)}
          </Heading>
        }
      />
      {isMissing && (
        <div className="task-panel-empty">
          <Message>{MISSING_MESSAGE}</Message>
        </div>
      )}
      {hasFailed && (
        <div className="task-panel-empty">
          <Message tone={MessageTone.Issue}>{FAILURE_MESSAGE}</Message>
          <Button onClick={reload} type="button">
            retry
          </Button>
        </div>
      )}
    </section>
  );
}

// One task as an always-editable, full-width page, opened from a list row. Back returns to that
// list (kept in navigation state, including its `?date=`), or to `/tasks` when opened directly.
// A save swaps in the returned task; keying the editor on `updatedAt` re-seeds its fields.
export function TaskDetailsPage(): ReactElement {
  const { taskId = MISSING_TASK_ID } = useParams();
  const { state: navigationState } = useLocation();
  const taskDetails = useTask(taskId);
  const backTo = readReturnTo(navigationState) ?? routes.tasks.root;

  if (taskDetails.task === null) {
    return <TaskDetailsStatus backTo={backTo} {...taskDetails} />;
  }

  return (
    <section aria-label={PANEL_LABEL} className="task-panel">
      <TaskEditor
        backTo={backTo}
        key={`${taskDetails.task.id}:${taskDetails.task.updatedAt}`}
        onSaved={taskDetails.replaceTask}
        task={taskDetails.task}
      />
    </section>
  );
}
