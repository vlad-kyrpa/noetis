import type { LucideIcon } from 'lucide-react';

export interface HudAction<TActionId extends string> {
  id: TActionId;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

// Values are written to the `data-layout-scale` attribute for CSS to select on.
export enum LayoutScale {
  Mobile = 'mobile',
  Tablet = 'tablet',
  Full = 'full',
}
