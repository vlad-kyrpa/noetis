import { isRecord } from '../../../common/api/decoders';
import type { Decoder } from '../../../common/api/types';
import type { AuthenticatedUser } from '../types';

// Accepts only the public user fields returned by the profile and registration endpoints.
export const decodeAuthenticatedUser: Decoder<AuthenticatedUser> = (value) => {
  if (!isRecord(value)) {
    return undefined;
  }

  const { email, id, username } = value;
  const hasUserFields =
    typeof id === 'string' && typeof username === 'string' && typeof email === 'string';

  return hasUserFields ? { email, id, username } : undefined;
};
