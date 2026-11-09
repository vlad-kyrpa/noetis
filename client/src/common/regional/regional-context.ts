import { createContext } from 'react';
import type { RegionalContextValue } from './types';

// Null until `RegionalProvider` mounts, so a missing provider fails loudly in `useRegional`.
export const RegionalContext = createContext<RegionalContextValue | null>(null);
