import type { TokenPair } from '../token-storage/types';
import type { Decoder } from './types';

// Narrows unknown JSON to an object whose fields can be inspected safely.
export const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null;

// Accepts any successful payload for endpoints whose value carries no information.
export const decodeEmpty: Decoder<null> = () => null;

// Accepts only an access and refresh token pair returned by login and refresh endpoints.
export const decodeTokenPair: Decoder<TokenPair> = (value) => {
  if (!isRecord(value)) {
    return undefined;
  }

  const { accessToken, refreshToken } = value;

  return typeof accessToken === 'string' && typeof refreshToken === 'string'
    ? { accessToken, refreshToken }
    : undefined;
};

// Extracts a displayable server message without trusting an arbitrary response body.
export const decodeErrorMessage: Decoder<string> = (body) =>
  isRecord(body) && typeof body.error === 'string' ? body.error : undefined;
