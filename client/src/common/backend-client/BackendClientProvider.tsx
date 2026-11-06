import type { ReactElement, ReactNode } from 'react';
import { BackendClientContext } from './backend-client-context';
import type { BackendClientFactory } from './types';

interface BackendClientProviderProps {
  children: ReactNode;
  factory: BackendClientFactory;
}

// Supplies the factory built at the composition root so feature hooks get authorised clients
// without importing auth or transport code.
export function BackendClientProvider({
  children,
  factory,
}: BackendClientProviderProps): ReactElement {
  return <BackendClientContext.Provider value={factory}>{children}</BackendClientContext.Provider>;
}
