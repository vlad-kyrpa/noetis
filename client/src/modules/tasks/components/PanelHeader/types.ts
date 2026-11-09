import type { ReactNode } from 'react';
import type { SearchQuery } from '../../../../common/search/types';

export interface PanelHeaderProps {
  // Top-right slot, e.g. the view actions menu; `null` leaves it empty.
  readonly actions: ReactNode;
  // Where the back link goes; `null` hides it (split layouts keep the list visible).
  readonly backTo: string | null;
  // Shows the ✕ on the search chips; panels without a search omit it.
  readonly onClearSearch?: () => void;
  readonly search: SearchQuery | null;
  // A heading or the period header; it should carry the panel's heading id.
  readonly title: ReactNode;
}
