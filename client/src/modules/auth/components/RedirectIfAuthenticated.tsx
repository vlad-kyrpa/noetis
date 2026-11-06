import type { ReactElement } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { routes } from '../../../routes';
import { AuthStatus } from '../context/types';
import { useAuth } from '../context/useAuth';
import { readRedirectTarget } from './redirect-target';
import { SessionPending } from './SessionNotice';

// Keeps signed-in users off the login and register pages, and completes the post-login
// redirect back to the page that sent them here.
export function RedirectIfAuthenticated(): ReactElement {
  const { status } = useAuth();
  const location = useLocation();

  const views: Readonly<Record<AuthStatus, () => ReactElement>> = {
    [AuthStatus.Checking]: () => <SessionPending />,
    [AuthStatus.Authenticated]: () => (
      <Navigate replace to={readRedirectTarget(location.state) ?? routes.home} />
    ),
    [AuthStatus.Unauthenticated]: () => <Outlet />,
    [AuthStatus.Unavailable]: () => <Outlet />,
  };

  return views[status]();
}
