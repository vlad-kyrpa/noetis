import { decodeEmpty, decodeTokenPair } from '../../../common/api/decoders';
import { sendApiRequest } from '../../../common/api/api-response';
import type { HttpMethods } from '../../../common/api/types';
import { joinPath } from '../../../common/backend-client/backend-path';
import type { AuthApi } from '../types';
import { decodeAuthenticatedUser } from './decoders';
import { validateLoginInput, validateRefreshInput, validateRegisterInput } from './validators';

const AUTH_PATHS = {
  login: '/auth/login',
  logout: '/auth/logout',
  refresh: '/auth/token',
  register: '/users',
} as const;

interface AuthApiDependencies {
  baseUrl: string;
  methods: HttpMethods;
}

// Builds the unauthenticated auth endpoint calls; token lifecycle lives in the session, not here.
export const createAuthApi = ({ baseUrl, methods }: AuthApiDependencies): AuthApi => {
  // Resolves an auth endpoint against the configured backend base URL.
  const toPath = (path: string): string => joinPath({ baseUrl, path });

  return {
    login: (input) =>
      sendApiRequest({
        decode: decodeTokenPair,
        send: () =>
          methods.post({
            body: input,
            path: toPath(AUTH_PATHS.login),
            validator: validateLoginInput,
          }),
      }),
    logout: (input) =>
      sendApiRequest({
        decode: decodeEmpty,
        send: () =>
          methods.post({
            body: input,
            path: toPath(AUTH_PATHS.logout),
            validator: validateRefreshInput,
          }),
      }),
    refresh: (input) =>
      sendApiRequest({
        decode: decodeTokenPair,
        send: () =>
          methods.post({
            body: input,
            path: toPath(AUTH_PATHS.refresh),
            validator: validateRefreshInput,
          }),
      }),
    register: (input) =>
      sendApiRequest({
        decode: decodeAuthenticatedUser,
        send: () =>
          methods.post({
            body: input,
            path: toPath(AUTH_PATHS.register),
            validator: validateRegisterInput,
          }),
      }),
  };
};
