import { useCallback, useEffect, useState } from 'react';
import { ApiFailureKind } from '../../../common/api/types';
import type { ApiFailure } from '../../../common/api/types';
import { useModuleClient } from '../../../common/backend-client/useModuleClient';
import { tasksClientModule } from '../api/tasks-client';
import { LoadState } from '../types';
import type { Task, TaskDetailsSnapshot, TaskDetailsState, TaskId } from '../types';

// The backend answers 404 for unknown ids and for another user's task alike.
const HTTP_NOT_FOUND = 404;

// Tells "this task does not exist" apart from failures worth a retry.
const isNotFoundFailure = (failure: ApiFailure): boolean =>
  failure.kind === ApiFailureKind.Http && failure.status === HTTP_NOT_FOUND;

// Loads one task for the details panel. Switching tasks or reloading shows "loading" until the
// matching response arrives; responses for a previous id are dropped by the effect cleanup.
export function useTask(taskId: TaskId): TaskDetailsState {
  const tasksClient = useModuleClient(tasksClientModule);
  const [generation, setGeneration] = useState(0);
  const [snapshot, setSnapshot] = useState<TaskDetailsSnapshot | null>(null);

  useEffect(() => {
    const loadController = new AbortController();

    void tasksClient.get(taskId).then((getResult) => {
      if (loadController.signal.aborted) {
        return;
      }

      setSnapshot({
        generation,
        isMissing: !getResult.ok && isNotFoundFailure(getResult.error),
        state: getResult.ok ? LoadState.Ready : LoadState.Failed,
        task: getResult.ok ? getResult.value : null,
        taskId,
      });
    });

    return (): void => loadController.abort();
  }, [generation, taskId, tasksClient]);

  const reload = useCallback((): void => setGeneration((current) => current + 1), []);

  // Swaps in a task the caller already received (a save response), keeping the snapshot's
  // request identity so it stays current and no refetch or loading flash happens.
  const replaceTask = useCallback((task: Task): void => {
    setSnapshot((current) =>
      current === null || current.taskId !== task.id
        ? current
        : { ...current, isMissing: false, state: LoadState.Ready, task },
    );
  }, []);
  const isCurrent =
    snapshot !== null && snapshot.taskId === taskId && snapshot.generation === generation;

  return isCurrent
    ? {
        isMissing: snapshot.isMissing,
        reload,
        replaceTask,
        state: snapshot.state,
        task: snapshot.task,
      }
    : { isMissing: false, reload, replaceTask, state: LoadState.Loading, task: null };
}
