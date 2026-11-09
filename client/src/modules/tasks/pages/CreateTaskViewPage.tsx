import { useCallback } from 'react';
import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../../routes';
import { CreateViewPage } from '../../views/pages/CreateViewPage';
import { ViewType } from '../../views/types';
import type { View } from '../../views/types';
import { useTasksOutletContext } from '../hooks/useTasksOutletContext';
import { createTaskViewPath } from '../views/view-path';

// The tasks area only creates task views, so the shared form shows no type picker.
const TASK_VIEW_TYPES: readonly ViewType[] = [ViewType.Task];

// Mounts the shared create view page for tasks: a new view reloads the list and opens it.
export function CreateTaskViewPage(): ReactElement {
  const { reloadViews } = useTasksOutletContext();
  const navigate = useNavigate();

  const openCreatedView = useCallback(
    (view: View): void => {
      reloadViews();
      void navigate(createTaskViewPath(view.id));
    },
    [navigate, reloadViews],
  );

  const returnToViews = useCallback((): void => {
    void navigate(routes.tasks.root);
  }, [navigate]);

  return (
    <CreateViewPage onCancel={returnToViews} onCreated={openCreatedView} types={TASK_VIEW_TYPES} />
  );
}
