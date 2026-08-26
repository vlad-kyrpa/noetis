import {
  ButtonType,
  ConfirmationModal,
  IconButton,
  TextArea,
  TextField,
  TextFieldVariant,
} from "@common/components";
import type { NoteId } from "@noetis/noetis";
import { useNavigate } from "react-router-dom";
import { useNote } from "../../hooks/useNote";
import styles from "./styles.module.css";

interface NotePageProps {
  noteId?: NoteId | undefined;
}

// Hosts the note editor and delegates persistence behavior to the note hook.
export function NotePage({ noteId }: NotePageProps): JSX.Element {
  const navigate = useNavigate();
  const {
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
    deleteConfirmation,
  } = useNote({
    noteId,
    onCreated: (createdNoteId) =>
      navigate(`/notes/${encodeURIComponent(createdNoteId)}`),
  });

  return (
    <section className={styles.page}>
      <div className={styles.actions}>
        <IconButton
          ariaLabel="Save note"
          iconName="save"
          onClick={() => void save()}
          type={ButtonType.Active}
        />
        <IconButton
          ariaLabel="Delete note"
          iconName="trash"
          onClick={requestDelete}
          type={ButtonType.Danger}
        />
      </div>
      <div className={styles.editor}>
        <TextField
          ariaLabel="Note title"
          controlClassName={styles.titleInput}
          onChange={setTitle}
          placeholder={isLoading ? "Loading..." : "Title"}
          value={note.title}
          variant={TextFieldVariant.Borderless}
        />
        <TextField
          ariaLabel="Note tags"
          controlClassName={styles.tagsInput}
          onChange={setTags}
          placeholder="Tags..."
          value={note.tags}
          variant={TextFieldVariant.Borderless}
        />
        {error ? <p className={styles.error}>{error.message}</p> : null}
        <TextArea
          ariaLabel="Note body"
          className={styles.bodyField}
          controlClassName={styles.bodyInput}
          onChange={setBody}
          placeholder={
            isSaving || isDeleting
              ? "Working..."
              : "What is on your mind today..."
          }
          value={note.body}
          variant={TextFieldVariant.Borderless}
        />
      </div>
      <ConfirmationModal
        cancelText="Cancel"
        confirmText="Delete"
        description="This note will be removed from storage."
        onConfirm={deleteConfirmation.onConfirm}
        onOpenChange={deleteConfirmation.onOpenChange}
        open={deleteConfirmation.open}
        title="Delete note?"
      />
    </section>
  );
}
