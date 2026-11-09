import { Pencil, Trash2 } from 'lucide-react';
import type { ReactElement } from 'react';
import { ContextMenuButton } from '../../../../common/components/ContextMenuButton/ContextMenuButton';
import type { ContextMenuAction } from '../../../../common/components/ContextMenuButton/types';

const COMING_SOON_HINT = 'coming soon';

// Placeholder actions for a saved view. Edit and delete flows come later; enabling one only
// means passing `onSelect` and `disabled: false`.
const VIEW_ACTIONS: readonly ContextMenuAction[] = [
  { disabled: true, hint: COMING_SOON_HINT, icon: Pencil, id: 'edit-view', label: 'Edit view' },
  { disabled: true, hint: COMING_SOON_HINT, icon: Trash2, id: 'delete-view', label: 'Delete view' },
];

// The ⋯ menu shown at the top right of an open custom view.
export function ViewActions(): ReactElement {
  return <ContextMenuButton actions={VIEW_ACTIONS} label="view actions" />;
}
