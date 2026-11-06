import { createTokenStorage } from './token-storage';
import type { TokenStorage } from './types';

// Connects the shared token adapter to persistent browser storage at the application boundary.
export const createBrowserTokenStorage = (): TokenStorage =>
  createTokenStorage({
    storage: window.localStorage,
  });
