import { useCallback, useEffect, useState } from "react";
import type {
  CoreEngine,
  CoreError,
  NoteId,
  StoredRecord,
} from "@noetis/noetis";
import { useCoreContext } from "@common/contexts/CoreContext";
import { useToast } from "@common/contexts/ToastContext";

export type NoteDraft = {
  title: string;
  tags: string;
  body: string;
};

export type NoteDeleteConfirmation = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export type UseNoteHookParams = {
  noteId?: NoteId | undefined;
  onCreated?: (noteId: NoteId) => void;
};

export type UseNoteHookResult = {
  note: NoteDraft;
  error: CoreError | null;
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  setTitle: (title: string) => void;
  setTags: (tags: string) => void;
  setBody: (body: string) => void;
  save: () => Promise<void>;
  requestDelete: () => void;
  deleteConfirmation: NoteDeleteConfirmation;
};

interface LoadNoteParams {
  core: CoreEngine;
  noteId: NoteId;
  signal: AbortSignal;
  onLoaded: (note: NoteDraft) => void;
  onError: (error: CoreError) => void;
  onSettled: () => void;
}

const EMPTY_NOTE: NoteDraft = {
  title: "",
  tags: "",
  body: "",
};

const SAVE_SUCCESS_TEXT = "Note saved.";
const DELETE_SUCCESS_TEXT = "Note deleted.";
const DRAFT_CLEAR_TEXT = "Draft cleared.";

// Converts comma-separated editor text into normalized tag labels.
function createTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

// Converts a persisted record into editor field values.
function createNoteDraft(record: StoredRecord): NoteDraft {
  return {
    title: record.title,
    tags: record.tags.join(", "),
    body: record.content,
  };
}

// Loads one note and ignores late async completion after React cleans up the request.
async function loadNote({
  core,
  noteId,
  signal,
  onLoaded,
  onError,
  onSettled,
}: LoadNoteParams): Promise<void> {
  const result = await core.get([noteId]);

  if (signal.aborted) {
    return;
  }

  if (!result.ok) {
    onError(result.error);
    onSettled();
    return;
  }

  const record = result.value[0];

  if (record === undefined) {
    onError({
      code: "record-not-found",
      message: "Note was not found.",
    });
    onSettled();
    return;
  }

  onLoaded(createNoteDraft(record));
  onSettled();
}

// Coordinates editor state with note commands and direct note reads.
export function useNote({
  noteId,
  onCreated,
}: UseNoteHookParams = {}): UseNoteHookResult {
  const { core } = useCoreContext();
  const { pushToast } = useToast();
  const [note, setNote] = useState<NoteDraft>(EMPTY_NOTE);
  const [error, setError] = useState<CoreError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState<boolean>(false);

  useEffect(() => {
    if (noteId === undefined) {
      setNote(EMPTY_NOTE);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    setIsLoading(true);
    setError(null);
    void loadNote({
      core,
      noteId,
      signal: controller.signal,
      onLoaded: setNote,
      onError: (loadError) => {
        setError(loadError);
        pushToast({ type: "error", text: loadError.message });
      },
      onSettled: () => setIsLoading(false),
    });

    return () => controller.abort();
  }, [core, noteId, pushToast]);

  const setTitle = useCallback((title: string): void => {
    setNote((current) => ({ ...current, title }));
  }, []);

  const setTags = useCallback((tags: string): void => {
    setNote((current) => ({ ...current, tags }));
  }, []);

  const setBody = useCallback((body: string): void => {
    setNote((current) => ({ ...current, body }));
  }, []);

  // Creates a new note and reports the created id to the route owner.
  const createNote = useCallback(async (): Promise<void> => {
    const result = await core.run({
      id: "create-note",
      payload: {
        title: note.title,
        content: note.body,
        tags: createTags(note.tags),
        createdAt: new Date(),
      },
    });

    if (!result.ok) {
      setError(result.error);
      pushToast({ type: "error", text: result.error.message });
      return;
    }

    pushToast({ type: "success", text: SAVE_SUCCESS_TEXT });
    onCreated?.(result.value.id);
  }, [core, note, onCreated, pushToast]);

  // Updates an existing note while preserving the current route.
  const updateNote = useCallback(async (): Promise<void> => {
    if (noteId === undefined) {
      return;
    }

    const result = await core.run({
      id: "update-note",
      payload: {
        id: noteId,
        title: note.title,
        content: note.body,
        tags: createTags(note.tags),
        updatedAt: new Date(),
      },
    });

    if (!result.ok) {
      setError(result.error);
      pushToast({ type: "error", text: result.error.message });
      return;
    }

    pushToast({ type: "success", text: SAVE_SUCCESS_TEXT });
  }, [core, note, noteId, pushToast]);

  const save = useCallback(async (): Promise<void> => {
    setIsSaving(true);
    setError(null);

    if (noteId === undefined) {
      await createNote();
    } else {
      await updateNote();
    }
    setIsSaving(false);
  }, [createNote, noteId, updateNote]);

  const requestDelete = useCallback((): void => {
    setIsDeleteConfirmationOpen(true);
  }, []);

  const confirmDelete = useCallback(async (): Promise<void> => {
    if (noteId === undefined) {
      setNote(EMPTY_NOTE);
      setIsDeleteConfirmationOpen(false);
      pushToast({ type: "info", text: DRAFT_CLEAR_TEXT });
      return;
    }

    setIsDeleting(true);
    setError(null);

    const result = await core.run({
      id: "remove-note",
      payload: { id: noteId },
    });

    setIsDeleting(false);

    if (result.ok) {
      setNote(EMPTY_NOTE);
      setIsDeleteConfirmationOpen(false);
      pushToast({ type: "success", text: DELETE_SUCCESS_TEXT });
      return;
    }

    setError(result.error);
    pushToast({ type: "error", text: result.error.message });
  }, [core, noteId, pushToast]);

  return {
    note,
    error,
    isLoading,
    isSaving,
    isDeleting,
    setTitle,
    setTags,
    setBody,
    save,
    requestDelete,
    deleteConfirmation: {
      open: isDeleteConfirmationOpen,
      onOpenChange: setIsDeleteConfirmationOpen,
      onConfirm: confirmDelete,
    },
  };
}
