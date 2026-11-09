import type { View } from '../../../views/types';
import type { LoadState } from '../../types';

export interface ViewsListProps {
  readonly customViews: readonly View[];
  readonly customViewsState: LoadState;
  readonly onRetry: () => void;
}

export interface ViewsListItemProps {
  readonly label: string;
  readonly tags: readonly string[];
  readonly viewId: string;
}

export interface ViewsListItemContentProps {
  readonly isActive: boolean;
  readonly label: string;
  readonly tags: readonly string[];
}

export interface CustomViewsSectionProps {
  readonly onRetry: () => void;
  readonly state: LoadState;
  readonly views: readonly View[];
}
