import { useEffect, useState } from "react";
import { Button, ButtonType, Modal, TextField } from "@common/components";
import type { StoredQueryId } from "@noetis/noetis";
import styles from "./styles.module.css";

export type CategoryModalValue = {
  id: StoredQueryId;
  name: string;
};

interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryModalValue | undefined;
  isSaving: boolean;
  onCreate: (name: string) => Promise<boolean>;
  onUpdate: (params: CategoryModalValue) => Promise<boolean>;
}

const MODAL_WIDTH = "min(420px, 92vw)";

// Renders the category create/edit form while the menu owns persistence.
export function CategoryModal({
  open,
  onOpenChange,
  category,
  isSaving,
  onCreate,
  onUpdate,
}: CategoryModalProps): JSX.Element {
  const [name, setName] = useState<string>("");
  const isEditing = category !== undefined;

  useEffect(() => {
    setName(category?.name ?? "");
  }, [category, open]);

  const save = async (): Promise<void> => {
    const result = isEditing
      ? await onUpdate({ id: category.id, name })
      : await onCreate(name);

    if (result) {
      onOpenChange(false);
    }
  };

  return (
    <Modal
      className={styles.content}
      onOpenChange={onOpenChange}
      open={open}
      title={isEditing ? "Rename category" : "Add category"}
      width={MODAL_WIDTH}
    >
      <div className={styles.body}>
        <h2 className={styles.title}>
          {isEditing ? "Rename category" : "Add category"}
        </h2>
        <TextField
          ariaLabel="Category name"
          label="Name"
          onChange={setName}
          placeholder="Category name"
          value={name}
        />
        <div className={styles.actions}>
          <Button
            onClick={() => onOpenChange(false)}
            text="Cancel"
            type={ButtonType.Regular}
          />
          <Button
            onClick={() => void save()}
            text={isSaving ? "Saving..." : "Save"}
            type={ButtonType.Active}
          />
        </div>
      </div>
    </Modal>
  );
}
