import type { TokenPair } from '../token-storage/types';
import type { Decoder } from './types';

// Narrows unknown JSON to an object whose fields can be inspected safely.
export const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null;

// Narrows unknown JSON to an array of strings, e.g. ids or tag labels.
export const isStringArray = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

// Narrows unknown JSON to a string or an explicit null, the wire shape of optional fields.
export const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

// Lifts an item decoder to a list decoder that rejects the whole list if any item is invalid.
export const decodeListOf =
  <Value>(decode: Decoder<Value>): Decoder<readonly Value[]> =>
  (value) => {
    if (!Array.isArray(value)) {
      return undefined;
    }

    const items = value.map(decode).filter((item): item is Value => item !== undefined);

    return items.length === value.length ? items : undefined;
  };

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
