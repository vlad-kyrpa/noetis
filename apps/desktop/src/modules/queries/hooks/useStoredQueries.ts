import { useCallback, useEffect, useState } from "react";
import { CommandId } from "@noetis/noetis";
import type {
  CoreEngine,
  CoreError,
  StoredQueryContainer,
  StoredQueryId,
  StoredQueryItem,
} from "@noetis/noetis";
import { useCoreContext } from "@common/contexts/CoreContext";
import { useToast } from "@common/contexts/ToastContext/ToastContext";
import { createTags } from "@common/utils/tags";

export type StoredQueryDraft = {
  name: string;
  tags: string;
};

export type StoredQueryDeleteConfirmation = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export type UseStoredQueriesHookParams = {
  storedQueryId?: StoredQueryId | undefined;
  containerId?: StoredQueryId | undefined;
  onCreated?: (storedQueryId: StoredQueryId) => void;
  onRemoved?: () => void;
  onSaved?: () => void;
};

export type UseStoredQueriesHookResult = {
  storedQuery: StoredQueryDraft;
  error: CoreError | null;
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  setName: (name: string) => void;
  setTags: (tags: string) => void;
  save: () => Promise<void>;
  requestDelete: () => void;
  deleteConfirmation: StoredQueryDeleteConfirmation;
};

interface LoadStoredQueryParams {
  core: CoreEngine;
  storedQueryId: StoredQueryId;
  signal: AbortSignal;
  onLoaded: (storedQuery: StoredQueryDraft) => void;
  onError: (error: CoreError) => void;
  onSettled: () => void;
}

const EMPTY_STORED_QUERY: StoredQueryDraft = {
  name: "",
  tags: "",
};

const SAVE_SUCCESS_TEXT = "Stored query saved.";
const DELETE_SUCCESS_TEXT = "Stored query deleted.";
const DRAFT_CLEAR_TEXT = "Stored query draft cleared.";

// Converts a persisted stored query into editor field values.
function createStoredQueryDraft(item: StoredQueryItem): StoredQueryDraft {
  return {
    name: item.name,
    tags: item.query.tags.join(", "),
  };
}

// Finds a stored query item in the flat container read model.
function findStoredQuery(params: {
  containers: StoredQueryContainer[];
  storedQueryId: StoredQueryId;
}): StoredQueryItem | undefined {
  return params.containers
    .flatMap((container) => container.queries)
    .find((query) => query.id === params.storedQueryId);
}

// Loads one stored query and ignores late async completion after React cleans up the request.
async function loadStoredQuery({
  core,
  storedQueryId,
  signal,
  onLoaded,
  onError,
  onSettled,
}: LoadStoredQueryParams): Promise<void> {
  const result = await core.getStoredQueries();

  if (signal.aborted) {
    return;
  }

  if (!result.ok) {
    onError(result.error);
    onSettled();
    return;
  }

  const storedQuery = findStoredQuery({
    containers: result.value,
    storedQueryId,
  });

  if (storedQuery === undefined) {
    onError({
      code: "record-not-found",
      message: "Stored query was not found.",
    });
    onSettled();
    return;
  }

  onLoaded(createStoredQueryDraft(storedQuery));
  onSettled();
}

// Coordinates stored-query editor state with stored-query commands and reads.
export function useStoredQueries({
  storedQueryId,
  containerId,
  onCreated,
  onRemoved,
  onSaved,
}: UseStoredQueriesHookParams = {}): UseStoredQueriesHookResult {
  const { core } = useCoreContext();
  const { pushToast } = useToast();
  const [storedQuery, setStoredQuery] =
    useState<StoredQueryDraft>(EMPTY_STORED_QUERY);
  const [error, setError] = useState<CoreError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState<boolean>(false);

  useEffect(() => {
    if (storedQueryId === undefined) {
      setStoredQuery(EMPTY_STORED_QUERY);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    setIsLoading(true);
    setError(null);
    void loadStoredQuery({
      core,
      storedQueryId,
      signal: controller.signal,
      onLoaded: setStoredQuery,
      onError: (loadError) => {
        setError(loadError);
        pushToast({ type: "error", text: loadError.message });
      },
      onSettled: () => setIsLoading(false),
    });

    return () => controller.abort();
  }, [core, pushToast, storedQueryId]);

  const setName = useCallback((name: string): void => {
    setStoredQuery((current) => ({ ...current, name }));
  }, []);

  const setTags = useCallback((tags: string): void => {
    setStoredQuery((current) => ({ ...current, tags }));
  }, []);

  // Creates a new stored query and reports the created id to the route owner.
  const createStoredQuery = useCallback(async (): Promise<void> => {
    const result = await core.run({
      id: CommandId.CreateStoredQuery,
      payload: {
        ...(containerId === undefined ? {} : { containerId }),
        query: {
          name: storedQuery.name,
          query: {
            tags: createTags(storedQuery.tags),
          },
        },
      },
    });

    if (!result.ok) {
      setError(result.error);
      pushToast({ type: "error", text: result.error.message });
      return;
    }

    pushToast({ type: "success", text: SAVE_SUCCESS_TEXT });
    onCreated?.(result.value.id);
    onSaved?.();
  }, [containerId, core, onCreated, onSaved, pushToast, storedQuery]);

  // Updates an existing stored query while preserving its current container.
  const updateStoredQuery = useCallback(async (): Promise<void> => {
    if (storedQueryId === undefined) {
      return;
    }

    const result = await core.run({
      id: CommandId.UpdateStoredQuery,
      payload: {
        id: storedQueryId,
        query: {
          name: storedQuery.name,
          query: {
            tags: createTags(storedQuery.tags),
          },
        },
      },
    });

    if (!result.ok) {
      setError(result.error);
      pushToast({ type: "error", text: result.error.message });
      return;
    }

    pushToast({ type: "success", text: SAVE_SUCCESS_TEXT });
    onSaved?.();
  }, [core, onSaved, pushToast, storedQuery, storedQueryId]);

  const save = useCallback(async (): Promise<void> => {
    setIsSaving(true);
    setError(null);

    if (storedQueryId === undefined) {
      await createStoredQuery();
    } else {
      await updateStoredQuery();
    }
    setIsSaving(false);
  }, [createStoredQuery, storedQueryId, updateStoredQuery]);

  const requestDelete = useCallback((): void => {
    setIsDeleteConfirmationOpen(true);
  }, []);

  const confirmDelete = useCallback(async (): Promise<void> => {
    if (storedQueryId === undefined) {
      setStoredQuery(EMPTY_STORED_QUERY);
      setIsDeleteConfirmationOpen(false);
      pushToast({ type: "info", text: DRAFT_CLEAR_TEXT });
      onRemoved?.();
      return;
    }

    setIsDeleting(true);
    setError(null);

    const result = await core.run({
      id: CommandId.RemoveStoredQuery,
      payload: { id: storedQueryId },
    });

    setIsDeleting(false);

    if (result.ok) {
      setStoredQuery(EMPTY_STORED_QUERY);
      setIsDeleteConfirmationOpen(false);
      pushToast({ type: "success", text: DELETE_SUCCESS_TEXT });
      onRemoved?.();
      return;
    }

    setError(result.error);
    pushToast({ type: "error", text: result.error.message });
  }, [core, onRemoved, pushToast, storedQueryId]);

  return {
    storedQuery,
    error,
    isLoading,
    isSaving,
    isDeleting,
    setName,
    setTags,
    save,
    requestDelete,
    deleteConfirmation: {
      open: isDeleteConfirmationOpen,
      onOpenChange: setIsDeleteConfirmationOpen,
      onConfirm: confirmDelete,
    },
  };
}
