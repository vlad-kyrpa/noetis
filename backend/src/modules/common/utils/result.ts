/** Represents an expected failure that callers can safely render. */
export type Failure = { readonly ok: false; readonly error: string };
/** Represents a successful command or query result. */
export type Success<T> = { readonly ok: true; readonly value: T };
/** Makes expected validation and lookup failures explicit in the API contract. */
export type Result<T> = Success<T> | Failure;
/** Creates a successful result. */
export const success = <T>(value: T): Success<T> => ({ ok: true, value });
/** Creates a safely serializable failure result. */
export const failure = (error: string): Failure => ({ ok: false, error });
