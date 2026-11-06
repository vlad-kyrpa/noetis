import { useContext, useMemo } from 'react';
import { BackendClientContext } from './backend-client-context';
import { createModuleClient } from './create-backend-client-factory';
import type { ModuleClientDefinition } from './types';

// Returns a feature's typed client, memoised on the definition's identity, so pass a
// module-level constant such as `tasksClientModule`.
export function useModuleClient<Client>(module: ModuleClientDefinition<Client>): Client {
  const factory = useContext(BackendClientContext);
  const client = useMemo(
    () => (factory === null ? null : createModuleClient({ factory, module })),
    [factory, module],
  );

  if (client === null) {
    throw new Error('BackendClientProvider is required before using useModuleClient.');
  }

  return client;
}
