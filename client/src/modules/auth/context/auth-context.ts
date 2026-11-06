import { createContext } from 'react';
import type { AuthContextValue } from './types';

// Holds the one auth state shared by every component; null means the provider is missing.
export const AuthContext = createContext<AuthContextValue | null>(null);
