import type { BackendClient, ModuleClientDefinition } from '../../../common/backend-client/types';
import { fail } from '../../../common/result/result';
import type { ViewsClient } from '../types';
import { toCreateViewFailure } from './create-view-failure';
import { decodeView, decodeViewList } from './decoders';
import { validateViewInput } from './validators';

const VIEWS_MODULE_PATH = '/views';
const VIEWS_ROOT = '';

// Binds the saved-view endpoints shared by every area to a pre-authorised backend client.
const createViewsClient = (client: BackendClient): ViewsClient => ({
  create: async (input) => {
    const createResult = await client.post({
      body: input,
      decode: decodeView,
      path: VIEWS_ROOT,
      validator: validateViewInput,
    });

    return createResult.ok ? createResult : fail(toCreateViewFailure(createResult.error));
  },
  list: ({ type }) => client.get({ decode: decodeViewList, path: VIEWS_ROOT, query: { type } }),
});

// Use with `useModuleClient(viewsClientModule)` inside components and hooks.
export const viewsClientModule: ModuleClientDefinition<ViewsClient> = {
  create: createViewsClient,
  modulePath: VIEWS_MODULE_PATH,
};
