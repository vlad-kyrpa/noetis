import type { Result } from './types';

// Wraps a successful value so callers can branch on `ok` instead of catching exceptions.
export const ok = <Value>(value: Value): Result<Value, never> => ({ ok: true, value });

// Wraps an expected failure so it travels as data rather than as a thrown error.
export const fail = <Failure>(error: Failure): Result<never, Failure> => ({ error, ok: false });
