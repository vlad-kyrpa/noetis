import { House, ListTodo, Menu, NotebookPen, WalletCards } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { routes } from '../../../routes';
import { useLayout } from '../../hooks/useLayout';
import { findAppArea } from '../../navigation/app-area';
import { AppArea } from '../../navigation/types';
import './Layout.css';
import { ContextAddButton } from '../ContextAddButton/ContextAddButton';
import { Hud } from '../Hud/Hud';
import type { HudAction } from './types';

interface LayoutProps {
  children: ReactNode;
}

// Combines page content, the persistent HUD, and the contextual add bookmark into one shell.
export const Layout = ({ children }: LayoutProps) => {
  const layoutScale = useLayout();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const layoutHudActions: readonly HudAction<AppArea>[] = useMemo(
    () => [
      { id: AppArea.Home, label: 'home', icon: House, onClick: () => navigate(routes.home) },
      {
        id: AppArea.Tasks,
        label: 'tasks',
        icon: ListTodo,
        onClick: () => navigate(routes.tasks.root),
      },
      {
        id: AppArea.Notes,
        label: 'notes',
        icon: NotebookPen,
        onClick: () => navigate(routes.notes.root),
      },
      {
        id: AppArea.Expenses,
        label: 'expenses',
        icon: WalletCards,
        onClick: () => navigate(routes.expenses.root),
      },
      { id: AppArea.Menu, label: 'menu', icon: Menu, onClick: () => navigate(routes.menu) },
    ],
    [navigate],
  );

  const activeArea = findAppArea(pathname);

  return (
    <div className="layout" data-layout-scale={layoutScale}>
      <Hud actions={layoutHudActions} activeAction={activeArea} />
      <ContextAddButton area={activeArea} />
      <main className="layout-content">{children}</main>
    </div>
  );
};
