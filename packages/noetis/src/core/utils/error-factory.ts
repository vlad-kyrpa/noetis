import { CoreError, Result } from "../types";

// Creates a typed not-found error for missing stored records.
export function createRecordNotFoundError(
  id: string,
): Result<never, CoreError> {
  return {
    ok: false,
    error: {
      code: "record-not-found",
      message: `Record "${id}" was not found.`,
    },
  };
}

// Creates a typed validation error for storage formatting problems.
export function createValidationError(
  message: string,
): Result<never, CoreError> {
  return {
    ok: false,
    error: {
      code: "validation-failed",
      message,
    },
  };
}
