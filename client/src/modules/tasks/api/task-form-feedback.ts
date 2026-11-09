import { ApiFailureKind } from '../../../common/api/types';
import type { ApiFailure } from '../../../common/api/types';
import type { TaskFormFeedback } from '../types';

export const NO_TASK_FORM_FEEDBACK: TaskFormFeedback = { issues: {}, message: null };

// Form-level wording per failure; validation issues are shown on their fields instead.
const API_FAILURE_MESSAGES: Readonly<Record<ApiFailureKind, string | null>> = {
  [ApiFailureKind.Validation]: null,
  [ApiFailureKind.Unauthorized]: 'Your session ended. Log in again to save the task.',
  [ApiFailureKind.Http]: 'Could not save the task. Please try again.',
  [ApiFailureKind.Network]: 'Unable to reach the server. Check your connection.',
  [ApiFailureKind.Decode]: 'The server sent an unexpected response.',
};

// Places a failed task write on its fields (validation) or as one form message (everything
// else). Shared by the create and edit forms so both read the same.
export const toTaskFormFeedback = (failure: ApiFailure): TaskFormFeedback => ({
  issues: failure.kind === ApiFailureKind.Validation ? failure.issues : {},
  message: API_FAILURE_MESSAGES[failure.kind],
});
