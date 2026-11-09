import { ApiFailureKind } from '../../../common/api/types';
import type { ApiFailure } from '../../../common/api/types';
import { CreateViewFailureKind } from '../types';
import type { CreateViewFailure } from '../types';

// The backend answers a duplicate type + title pair with 409 Conflict.
const HTTP_CONFLICT = 409;
const UNEXPECTED_RESPONSE_MESSAGE = 'The server sent an unexpected response.';
const AUTHORIZATION_MESSAGE = 'Your session ended. Log in again to save the view.';

// Translates generic API failures into the cases the create view form handles.
const API_FAILURE_TO_CREATE_VIEW_FAILURE: Readonly<
  Record<ApiFailureKind, (failure: ApiFailure) => CreateViewFailure>
> = {
  [ApiFailureKind.Validation]: (failure) => ({
    issues: 'issues' in failure ? failure.issues : {},
    kind: CreateViewFailureKind.Invalid,
  }),
  [ApiFailureKind.Unauthorized]: () => ({
    kind: CreateViewFailureKind.Unknown,
    message: AUTHORIZATION_MESSAGE,
  }),
  [ApiFailureKind.Http]: (failure) =>
    'status' in failure && failure.status === HTTP_CONFLICT
      ? { kind: CreateViewFailureKind.DuplicateTitle }
      : {
          kind: CreateViewFailureKind.Unknown,
          message: 'message' in failure ? failure.message : UNEXPECTED_RESPONSE_MESSAGE,
        },
  [ApiFailureKind.Network]: () => ({ kind: CreateViewFailureKind.Network }),
  [ApiFailureKind.Decode]: () => ({
    kind: CreateViewFailureKind.Unknown,
    message: UNEXPECTED_RESPONSE_MESSAGE,
  }),
};

// Maps one API failure of `POST /views` to its create view failure.
export const toCreateViewFailure = (failure: ApiFailure): CreateViewFailure =>
  API_FAILURE_TO_CREATE_VIEW_FAILURE[failure.kind](failure);
