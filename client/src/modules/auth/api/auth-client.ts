import type { BackendClient, ModuleClientDefinition } from '../../../common/backend-client/types';
import type { AuthClient } from '../types';
import { decodeAuthenticatedUser } from './decoders';

const AUTH_MODULE_PATH = '/auth';
const ME_PATH = '/me';

// Binds the authenticated auth endpoints to a backend client, so an expired access token on
// `/me` is refreshed and retried like any other request.
const createAuthClient = (client: BackendClient): AuthClient => ({
  me: () => client.get({ decode: decodeAuthenticatedUser, path: ME_PATH }),
});

export const authClientModule: ModuleClientDefinition<AuthClient> = {
  create: createAuthClient,
  modulePath: AUTH_MODULE_PATH,
};
