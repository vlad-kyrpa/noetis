import type { AppArea, RouteTreeNode } from '../../navigation/types';

// What "add" does in one context: a route to open, or `null` while its flow does not exist yet.
export interface ContextAddAction {
  readonly label: string;
  readonly route: string | null;
}

// One add-action subtree per area, so every area must decide what + means. A `null` value
// hides the button in that context.
export type AddActionTrees = Readonly<Record<AppArea, RouteTreeNode<ContextAddAction | null>>>;

export interface ContextAddButtonProps {
  // Already resolved for the current URL; `null` renders nothing.
  readonly action: ContextAddAction | null;
}
