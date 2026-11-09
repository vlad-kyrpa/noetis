import { useContext } from 'react';
import { RegionalContext } from './regional-context';
import type { RegionalContextValue } from './types';

// Returns the regional settings and clock; a missing provider is a wiring bug, so it throws.
export function useRegional(): RegionalContextValue {
  const regional = useContext(RegionalContext);

  if (regional === null) {
    throw new Error('RegionalProvider is required before using useRegional.');
  }

  return regional;
}
