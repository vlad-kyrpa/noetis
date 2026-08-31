import { useCallback, useEffect, useState } from "react";
import { CommandId } from "@noetis/noetis";
import type {
  CoreError,
  StoredQueryContainer,
  StoredQueryId,
} from "@noetis/noetis";
import { useCoreContext } from "@common/contexts/CoreContext";
import { useToast } from "@common/contexts/ToastContext/ToastContext";

export type UseStoredQueriesTreeResult = {
  storedQueriesTree: StoredQueryContainer[];
  error: CoreError | null;
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  reload: () => Promise<void>;
  createContainer: (name: string) => Promise<boolean>;
  updateContainer: (params: {
    id: StoredQueryId;
    name: string;
  }) => Promise<boolean>;
  removeContainer: (id: StoredQueryId) => Promise<boolean>;
  removeQuery: (id: StoredQueryId) => Promise<boolean>;
};

const CREATE_CONTAINER_SUCCESS_TEXT = "Category created.";
const UPDATE_CONTAINER_SUCCESS_TEXT = "Category saved.";
const REMOVE_CONTAINER_SUCCESS_TEXT = "Category removed.";
const REMOVE_QUERY_SUCCESS_TEXT = "Stored query deleted.";

// Loads the stored query tree and refreshes it after core state changes.
export function useStoredQueriesTree(): UseStoredQueriesTreeResult {
  const { core } = useCoreContext();
  const { pushToast } = useToast();
  const [storedQueriesTree, setStoredQueriesTree] = useState<
    StoredQueryContainer[]
  >([]);
  const [error, setError] = useState<CoreError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const reload = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    const result = await core.getStoredQueries();

    if (result.ok) {
      setStoredQueriesTree(result.value);
      setError(null);
      setIsLoading(false);
      return;
    }

    setError(result.error);
    setIsLoading(false);
  }, [core]);

  const createContainer = useCallback(
    async (name: string): Promise<boolean> => {
      setIsSaving(true);
      setError(null);

      const result = await core.run({
        id: CommandId.CreateStoredQueryContainer,
        payload: {
          container: {
            name,
          },
        },
      });

      setIsSaving(false);

      if (!result.ok) {
        setError(result.error);
        pushToast({ type: "error", text: result.error.message });
        return false;
      }

      pushToast({ type: "success", text: CREATE_CONTAINER_SUCCESS_TEXT });
      return true;
    },
    [core, pushToast],
  );

  const updateContainer = useCallback(
    async (params: { id: StoredQueryId; name: string }): Promise<boolean> => {
      setIsSaving(true);
      setError(null);

      const result = await core.run({
        id: CommandId.UpdateStoredQueryContainer,
        payload: {
          id: params.id,
          container: {
            name: params.name,
          },
        },
      });

      setIsSaving(false);

      if (!result.ok) {
        setError(result.error);
        pushToast({ type: "error", text: result.error.message });
        return false;
      }

      pushToast({ type: "success", text: UPDATE_CONTAINER_SUCCESS_TEXT });
      return true;
    },
    [core, pushToast],
  );

  const removeContainer = useCallback(
    async (id: StoredQueryId): Promise<boolean> => {
      setIsDeleting(true);
      setError(null);

      const result = await core.run({
        id: CommandId.RemoveStoredQueryContainer,
        payload: { id },
      });

      setIsDeleting(false);

      if (!result.ok) {
        setError(result.error);
        pushToast({ type: "error", text: result.error.message });
        return false;
      }

      pushToast({ type: "success", text: REMOVE_CONTAINER_SUCCESS_TEXT });
      return true;
    },
    [core, pushToast],
  );

  const removeQuery = useCallback(
    async (id: StoredQueryId): Promise<boolean> => {
      setIsDeleting(true);
      setError(null);

      const result = await core.run({
        id: CommandId.RemoveStoredQuery,
        payload: { id },
      });

      setIsDeleting(false);

      if (!result.ok) {
        setError(result.error);
        pushToast({ type: "error", text: result.error.message });
        return false;
      }

      pushToast({ type: "success", text: REMOVE_QUERY_SUCCESS_TEXT });
      return true;
    },
    [core, pushToast],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const callback = (): void => {
      void reload();
    };

    core.addStateUpdateCallback(callback);

    return () => {
      core.removeStateUpdateCallback(callback);
    };
  }, [core, reload]);

  return {
    storedQueriesTree,
    error,
    isLoading,
    isSaving,
    isDeleting,
    reload,
    createContainer,
    updateContainer,
    removeContainer,
    removeQuery,
  };
}
