import { useCallback, useEffect, useState } from 'react';
import { useModuleClient } from '../../../common/backend-client/useModuleClient';
import { tasksClientModule } from '../api/tasks-client';
import { LoadState } from '../types';
import type { Task, TaskListSnapshot, TaskListState, UseTaskListParams } from '../types';

const NO_TASKS: readonly Task[] = [];

interface ResolveTaskListViewParams {
  readonly generation: number;
  readonly query: UseTaskListParams['query'];
  readonly snapshot: TaskListSnapshot | null;
  readonly submission: number;
}

type TaskListView = Pick<TaskListState, 'state' | 'tasks'>;

// Derives what to render: the snapshot when it answers the current request, otherwise
// "loading" with the previous tasks kept on screen so the list does not flash empty.
const resolveTaskListView = ({
  generation,
  query,
  snapshot,
  submission,
}: ResolveTaskListViewParams): TaskListView => {
  if (query === null) {
    return { state: LoadState.Idle, tasks: NO_TASKS };
  }

  const isCurrent =
    snapshot !== null &&
    snapshot.query === query &&
    snapshot.submission === submission &&
    snapshot.generation === generation;

  return isCurrent
    ? { state: snapshot.state, tasks: snapshot.tasks }
    : { state: LoadState.Loading, tasks: snapshot?.tasks ?? NO_TASKS };
};

// Fetches tasks once whenever the query identity or the submission changes (callers memoize the
// query, so typing elsewhere never refetches). Only the latest response is kept: a newer request
// aborts the older one's update in the effect cleanup.
export function useTaskList({ query, submission }: UseTaskListParams): TaskListState {
  const tasksClient = useModuleClient(tasksClientModule);
  const [generation, setGeneration] = useState(0);
  const [snapshot, setSnapshot] = useState<TaskListSnapshot | null>(null);

  useEffect(() => {
    if (query === null) {
      return undefined;
    }

    const loadController = new AbortController();

    void tasksClient.list(query).then((listResult) => {
      if (!loadController.signal.aborted) {
        setSnapshot({
          generation,
          query,
          state: listResult.ok ? LoadState.Ready : LoadState.Failed,
          submission,
          tasks: listResult.ok ? listResult.value : NO_TASKS,
        });
      }
    });

    return (): void => loadController.abort();
  }, [generation, query, submission, tasksClient]);

  const reload = useCallback((): void => setGeneration((current) => current + 1), []);

  return { ...resolveTaskListView({ generation, query, snapshot, submission }), reload };
}
