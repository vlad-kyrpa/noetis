import type { LucideIcon } from 'lucide-react';

export interface HudAction<TActionId extends string> {
  id: TActionId;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

export type LayoutScale = 'mobile' | 'tablet' | 'full';
