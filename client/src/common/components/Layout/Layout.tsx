import { House, ListTodo, Menu, NotebookPen, WalletCards } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { routes } from '../../../routes';
import { useLayout } from '../../hooks/useLayout';
import './Layout.css';
import { Hud } from '../Hud/Hud';
import type { HudAction } from './types';

type LayoutHudActionId = 'home' | 'tasks' | 'notes' | 'expenses' | 'menu';

const layoutActionRouteRoots: Readonly<Record<LayoutHudActionId, string>> = {
  home: routes.home,
  tasks: routes.tasks.root,
  notes: routes.notes.root,
  expenses: routes.expenses.root,
  menu: routes.menu,
};

interface LayoutProps {
  children: ReactNode;
}

interface PathAtRouteRootParams {
  pathname: string;
  routeRoot: string;
}

interface FindActiveHudActionParams {
  actions: readonly HudAction<LayoutHudActionId>[];
  pathname: string;
}

// Matches an action's root page and every nested route below it without letting home match all paths.
const isPathAtRouteRoot = ({ pathname, routeRoot }: PathAtRouteRootParams): boolean =>
  pathname === routeRoot || (routeRoot !== routes.home && pathname.startsWith(`${routeRoot}/`));

// Selects the HUD action associated with the current route, when a route root has one.
const findActiveHudAction = ({
  actions,
  pathname,
}: FindActiveHudActionParams): LayoutHudActionId | undefined =>
  actions.find((action) =>
    isPathAtRouteRoot({ pathname, routeRoot: layoutActionRouteRoots[action.id] }),
  )?.id;

// Combines page content and the persistent HUD into one responsive application shell.
export const Layout = ({ children }: LayoutProps) => {
  const layoutScale = useLayout();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const layoutHudActions: readonly HudAction<LayoutHudActionId>[] = useMemo(
    () => [
      { id: 'home', label: 'home', icon: House, onClick: () => navigate(routes.home) },
      { id: 'tasks', label: 'tasks', icon: ListTodo, onClick: () => navigate(routes.tasks.root) },
      {
        id: 'notes',
        label: 'notes',
        icon: NotebookPen,
        onClick: () => navigate(routes.notes.root),
      },
      {
        id: 'expenses',
        label: 'expenses',
        icon: WalletCards,
        onClick: () => navigate(routes.expenses.root),
      },
      { id: 'menu', label: 'menu', icon: Menu, onClick: () => navigate(routes.menu) },
    ],
    [navigate],
  );

  const activeHudAction = findActiveHudAction({ actions: layoutHudActions, pathname });

  return (
    <div className="layout" data-layout-scale={layoutScale}>
      <Hud actions={layoutHudActions} activeAction={activeHudAction} />
      <main className="layout-content">{children}</main>
    </div>
  );
};
