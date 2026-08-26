import { Button, ButtonType } from "../Button/Button";
import { Modal } from "../Modal/Modal";
import styles from "./styles.module.css";

interface ConfirmationModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

const CONFIRMATION_MODAL_WIDTH = "min(420px, 92vw)";

// Presents a focused yes/no decision while Radix handles dialog accessibility.
export function ConfirmationModal({
  open,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onOpenChange,
}: ConfirmationModalProps): JSX.Element {
  return (
    <Modal
      className={styles.content}
      onOpenChange={onOpenChange}
      open={open}
      title={title}
      width={CONFIRMATION_MODAL_WIDTH}
    >
      <div className={styles.body}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
        <div className={styles.actions}>
          <Button
            onClick={() => onOpenChange(false)}
            text={cancelText}
            type={ButtonType.Regular}
          />
          <Button
            onClick={onConfirm}
            text={confirmText}
            type={ButtonType.Danger}
          />
        </div>
      </div>
    </Modal>
  );
}
