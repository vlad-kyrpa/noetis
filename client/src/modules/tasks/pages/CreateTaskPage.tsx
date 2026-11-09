import { useCallback, useState } from 'react';
import type { ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Heading } from '../../../common/components/Heading/Heading';
import { HeadingScale } from '../../../common/components/Heading/types';
import { readReturnTo } from '../../../common/navigation/return-to';
import { useRegional } from '../../../common/regional/useRegional';
import { routes } from '../../../routes';
import { CreateTaskForm } from '../components/CreateTaskForm/CreateTaskForm';
import { PanelHeader } from '../components/PanelHeader/PanelHeader';
import { useCreateTaskForm } from '../hooks/useCreateTaskForm';
import { useTasksOutletContext } from '../hooks/useTasksOutletContext';
import { resolveReturnSelection } from '../views/return-selection';
import { resolveTaskDraftDefaults } from '../views/task-draft-defaults';
import './TaskPanel.css';

const PANEL_HEADING_ID = 'create-task-title';

// Opened by + from any task list. It prefills from that list (Day → due date, saved view →
// tags) and returns to it after creating or cancelling, where the list refetches on mount.
export function CreateTaskPage(): ReactElement {
  const { views } = useTasksOutletContext();
  const { state: navigationState } = useLocation();
  const navigate = useNavigate();
  const { clock, settings } = useRegional();
  const returnTo = readReturnTo(navigationState);

  // Seeded once: later view list reloads must not overwrite what the user already typed.
  const [defaults] = useState(() =>
    resolveTaskDraftDefaults({
      selection: resolveReturnSelection({
        firstDayOfWeek: settings.firstDayOfWeek,
        returnTo,
        today: clock.today(),
      }),
      views: views.views,
    }),
  );

  const returnToOrigin = useCallback((): void => {
    void navigate(returnTo ?? routes.tasks.root);
  }, [navigate, returnTo]);

  const form = useCreateTaskForm({ defaults, onCreated: returnToOrigin });

  return (
    <section aria-labelledby={PANEL_HEADING_ID} className="task-panel">
      <PanelHeader
        actions={null}
        backTo={null}
        search={null}
        title={
          <Heading id={PANEL_HEADING_ID} scale={HeadingScale.Subsection}>
            create task
          </Heading>
        }
      />
      <CreateTaskForm form={form} onCancel={returnToOrigin} />
    </section>
  );
}
