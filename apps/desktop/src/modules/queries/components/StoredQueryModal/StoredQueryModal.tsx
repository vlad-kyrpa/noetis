import {
  Button,
  ButtonType,
  ConfirmationModal,
  Modal,
  TextField,
} from "@common/components";
import type { StoredQueryId } from "@noetis/noetis";
import { useStoredQueries } from "../../hooks/useStoredQueries";
import styles from "./styles.module.css";

interface StoredQueryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  containerId?: StoredQueryId | undefined;
  storedQueryId?: StoredQueryId | undefined;
}

const MODAL_WIDTH = "min(460px, 92vw)";

// Renders the stored-query create/edit form and delegates persistence to the hook.
export function StoredQueryModal({
  open,
  onOpenChange,
  containerId,
  storedQueryId,
}: StoredQueryModalProps): JSX.Element {
  const {
    storedQuery,
    error,
    isLoading,
    isSaving,
    isDeleting,
    setName,
    setTags,
    save,
    requestDelete,
    deleteConfirmation,
  } = useStoredQueries({
    containerId,
    storedQueryId,
    onRemoved: () => onOpenChange(false),
    onSaved: () => onOpenChange(false),
  });
  const isEditing = storedQueryId !== undefined;

  return (
    <>
      <Modal
        className={styles.content}
        onOpenChange={onOpenChange}
        open={open}
        title={isEditing ? "Edit stored query" : "Create stored query"}
        width={MODAL_WIDTH}
      >
        <div className={styles.body}>
          <h2 className={styles.title}>
            {isEditing ? "Edit stored query" : "Create stored query"}
          </h2>
          <div className={styles.fields}>
            <TextField
              ariaLabel="Stored query name"
              label="Name"
              onChange={setName}
              placeholder={isLoading ? "Loading..." : "Name"}
              value={storedQuery.name}
            />
            <TextField
              ariaLabel="Stored query tags"
              label="Tags"
              onChange={setTags}
              placeholder="tag-a, tag-b"
              value={storedQuery.tags}
            />
          </div>
          {error ? <p className={styles.error}>{error.message}</p> : null}
          <div className={styles.actions}>
            {isEditing ? (
              <Button
                onClick={requestDelete}
                text={isDeleting ? "Removing..." : "Remove"}
                type={ButtonType.Danger}
              />
            ) : null}
            <Button
              onClick={() => void save()}
              text={isSaving ? "Saving..." : "Save"}
              type={ButtonType.Active}
            />
          </div>
        </div>
      </Modal>
      <ConfirmationModal
        cancelText="Cancel"
        confirmText="Remove"
        description="This stored query will be removed from its container."
        onConfirm={deleteConfirmation.onConfirm}
        onOpenChange={deleteConfirmation.onOpenChange}
        open={deleteConfirmation.open}
        title="Remove stored query?"
      />
    </>
  );
}
