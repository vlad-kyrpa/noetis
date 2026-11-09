import { isRecord } from '../api/decoders';
import type { ReturnToState } from './types';

// Builds the navigation state that lets the opened flow return to where it was started.
export const createReturnToState = (returnTo: string): ReturnToState => ({ returnTo });

// Reads the return URL from untrusted history state; only same-app paths are accepted, so a
// crafted state can never send the user to another origin.
export const readReturnTo = (state: unknown): string | null =>
  isRecord(state) &&
  typeof state.returnTo === 'string' &&
  state.returnTo.startsWith('/') &&
  !state.returnTo.startsWith('//')
    ? state.returnTo
    : null;
