import { useCallback, useEffect, useState } from 'react';
import type { ApiFailure } from '../../../common/api/types';
import { useModuleClient } from '../../../common/backend-client/useModuleClient';
import type { Result } from '../../../common/result/types';
import { viewsClientModule } from '../../views/api/views-client';
import { ViewType } from '../../views/types';
import type { View } from '../../views/types';
import { LoadState } from '../types';
import type { TaskViewsSnapshot, TaskViewsState } from '../types';

const INITIAL_SNAPSHOT: TaskViewsSnapshot = { state: LoadState.Loading, views: [] };

// Turns a finished list request into what the views list renders.
const toTaskViewsSnapshot = (result: Result<readonly View[], ApiFailure>): TaskViewsSnapshot =>
  result.ok
    ? { state: LoadState.Ready, views: result.value }
    : { state: LoadState.Failed, views: [] };

// Marks the snapshot as loading without dropping the views already on screen.
const markLoading = (snapshot: TaskViewsSnapshot): TaskViewsSnapshot => ({
  ...snapshot,
  state: LoadState.Loading,
});

// Loads the user's saved task views and lets the page reload them, e.g. after creating one.
// Responses that arrive after a newer load started are ignored.
export function useTaskViews(): TaskViewsState {
  const viewsClient = useModuleClient(viewsClientModule);
  const [snapshot, setSnapshot] = useState<TaskViewsSnapshot>(INITIAL_SNAPSHOT);
  const [loadGeneration, setLoadGeneration] = useState(0);

  useEffect(() => {
    const loadController = new AbortController();

    void viewsClient.list({ type: ViewType.Task }).then((listResult) => {
      if (!loadController.signal.aborted) {
        setSnapshot(toTaskViewsSnapshot(listResult));
      }
    });

    return (): void => loadController.abort();
  }, [loadGeneration, viewsClient]);

  const reload = useCallback((): void => {
    setSnapshot(markLoading);
    setLoadGeneration((generation) => generation + 1);
  }, []);

  return { ...snapshot, reload };
}
