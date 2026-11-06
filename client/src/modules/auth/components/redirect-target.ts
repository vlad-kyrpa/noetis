import type { Location } from 'react-router-dom';
import { isRecord } from '../../../common/api/decoders';

export interface RedirectState {
  readonly from: string;
}

// Remembers the full protected URL so login can return the user exactly where they were.
export const createRedirectState = ({ hash, pathname, search }: Location): RedirectState => ({
  from: `${pathname}${search}${hash}`,
});

// Reads the remembered URL from router state, which is untyped and may come from anywhere.
export const readRedirectTarget = (state: unknown): string | undefined =>
  isRecord(state) && typeof state.from === 'string' ? state.from : undefined;
