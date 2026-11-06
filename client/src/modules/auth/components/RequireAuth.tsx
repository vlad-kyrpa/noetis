import type { ReactElement } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { routes } from '../../../routes';
import { AuthStatus } from '../context/types';
import { useAuth } from '../context/useAuth';
import { createRedirectState } from './redirect-target';
import { SessionPending, SessionUnavailable } from './SessionNotice';

// Guards protected routes; because the session emits `Expired` on any failed refresh, a page
// whose request loses the session is redirected here without per-call redirect logic.
export function RequireAuth(): ReactElement {
  const { retry, status } = useAuth();
  const location = useLocation();

  const views: Readonly<Record<AuthStatus, () => ReactElement>> = {
    [AuthStatus.Checking]: () => <SessionPending />,
    [AuthStatus.Authenticated]: () => <Outlet />,
    [AuthStatus.Unauthenticated]: () => (
      <Navigate replace state={createRedirectState(location)} to={routes.login} />
    ),
    [AuthStatus.Unavailable]: () => <SessionUnavailable onRetry={() => void retry()} />,
  };

  return views[status]();
}
