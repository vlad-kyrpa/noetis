import { createContext } from 'react';
import type { BackendClientFactory } from './types';

// Holds the app-wide backend client factory; null means BackendClientProvider is missing.
export const BackendClientContext = createContext<BackendClientFactory | null>(null);
