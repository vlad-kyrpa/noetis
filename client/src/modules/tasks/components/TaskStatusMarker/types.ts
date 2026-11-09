import type { LucideIcon } from 'lucide-react';
import type { TaskStatus } from '../../types';

// How one status reads: an icon for the eye and a label for assistive technology.
export interface TaskStatusDefinition {
  readonly icon: LucideIcon;
  readonly label: string;
}

export interface TaskStatusMarkerProps {
  // Also renders the label next to the icon, e.g. in the details panel.
  readonly isLabelShown: boolean;
  readonly status: TaskStatus;
}
