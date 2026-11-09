import type { LucideIcon } from 'lucide-react';

export interface ContextMenuAction {
  readonly disabled: boolean;
  // Secondary text for the item, e.g. "coming soon" on a disabled action.
  readonly hint?: string;
  readonly icon: LucideIcon;
  readonly id: string;
  readonly label: string;
  // Enabling an action later only means passing this and `disabled: false`.
  readonly onSelect?: () => void;
}

export interface ContextMenuButtonProps {
  readonly actions: readonly ContextMenuAction[];
  // Accessible name of the ⋯ trigger, e.g. "view actions".
  readonly label: string;
}

export interface ContextMenuItemProps {
  readonly action: ContextMenuAction;
  readonly onClose: () => void;
}

// Where focus should land inside the menu, given the focused item and the item count.
export interface MenuFocusPosition {
  readonly count: number;
  readonly index: number;
}

export interface FocusMenuItemParams {
  readonly menu: HTMLElement | null;
  readonly resolveIndex: (position: MenuFocusPosition) => number;
}
