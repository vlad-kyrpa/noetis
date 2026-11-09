import { useOutletContext } from 'react-router-dom';
import type { TasksOutletContext } from '../types';

// Typed access to what the tasks shell shares with its panels (views, search, reload).
export function useTasksOutletContext(): TasksOutletContext {
  return useOutletContext<TasksOutletContext>();
}
