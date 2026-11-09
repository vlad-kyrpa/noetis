import { useMatch } from 'react-router-dom';
import { routes } from '../../../routes';

// True on `/tasks/:taskId`. The pattern alone also matches the static `search` and `new`
// siblings, so those are ruled out first.
export function useIsTaskDetailsOpen(): boolean {
  const detailsMatch = useMatch(routes.tasks.details);
  const searchMatch = useMatch(routes.tasks.search);
  const createTaskMatch = useMatch(routes.tasks.create);

  return detailsMatch !== null && searchMatch === null && createTaskMatch === null;
}
