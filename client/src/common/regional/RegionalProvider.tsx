import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { RegionalContext } from './regional-context';
import type { RegionalProviderProps } from './types';

// Supplies the settings and clock created at the composition root to every consumer.
export function RegionalProvider({
  children,
  clock,
  settings,
}: RegionalProviderProps): ReactElement {
  const regional = useMemo(() => ({ clock, settings }), [clock, settings]);

  return <RegionalContext.Provider value={regional}>{children}</RegionalContext.Provider>;
}
