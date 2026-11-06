import { useContext } from 'react';
import { AuthContext } from './auth-context';
import type { AuthContextValue } from './types';

// Reads the shared auth state and fails loudly when AuthProvider is missing from the tree.
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);

  if (value === null) {
    throw new Error('AuthProvider is required before using useAuth.');
  }

  return value;
}
