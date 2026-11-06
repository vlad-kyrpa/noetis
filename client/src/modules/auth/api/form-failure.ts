import { ApiFailureKind } from '../../../common/api/types';
import type { ApiFailure, HttpValidationIssues } from '../../../common/api/types';
import type { AuthFormFailure } from '../types';

const NO_ISSUES: HttpValidationIssues = {};

const DEFAULT_FAILURE_MESSAGES: Readonly<Record<ApiFailureKind, string>> = {
  [ApiFailureKind.Validation]: 'Check the highlighted fields.',
  [ApiFailureKind.Unauthorized]: 'Invalid credentials.',
  [ApiFailureKind.Http]: 'Something went wrong. Please try again.',
  [ApiFailureKind.Network]: 'Unable to reach the server. Check your connection.',
  [ApiFailureKind.Decode]: 'The server sent an unexpected response.',
};

// Picks the most specific message a failure carries, falling back to a per-kind default.
const describeFailure = (failure: ApiFailure): string => {
  if (failure.kind === ApiFailureKind.Validation) {
    return Object.values(failure.issues)[0] ?? DEFAULT_FAILURE_MESSAGES[failure.kind];
  }

  return 'message' in failure ? failure.message : DEFAULT_FAILURE_MESSAGES[failure.kind];
};

// Reshapes any API failure into the headline-plus-issues form that auth pages render.
export const toAuthFormFailure = (failure: ApiFailure): AuthFormFailure => ({
  issues: failure.kind === ApiFailureKind.Validation ? failure.issues : NO_ISSUES,
  message: describeFailure(failure),
});
