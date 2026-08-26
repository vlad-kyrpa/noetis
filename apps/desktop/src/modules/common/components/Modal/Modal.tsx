import { Dialog } from "radix-ui";
import type { CSSProperties, ReactNode } from "react";
import { combineStyles } from "../../utils/combineClasses";
import styles from "./styles.module.css";

// Accepts concrete sizes like "560px" or "32rem", relative sizes like "80vw" or "90%", and numbers as pixels.
export type ModalSize = CSSProperties["width"];

interface ModalStyleParams {
  /** Sets the preferred content width, for example "640px", "42rem", "80vw", or "90%". */
  width?: ModalSize;
  /** Caps content width after the preferred width is applied, for example "720px" or "calc(100vw - 32px)". */
  maxWidth?: ModalSize;
  /** Sets a fixed content height when the modal should not grow with its children. */
  height?: ModalSize;
  /** Caps content height and lets overflowing children scroll inside the modal. */
  maxHeight?: ModalSize;
}

interface ModalStyle extends CSSProperties {
  "--modal-width"?: ModalSize;
  "--modal-max-width"?: ModalSize;
  "--modal-height"?: ModalSize;
  "--modal-max-height"?: ModalSize;
}

interface ModalProps extends ModalStyleParams {
  title: string;
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  overlayClassName?: string;
}

// Carries caller-provided size limits through CSS variables owned by the modal styles.
function createModalStyle({
  width,
  maxWidth,
  height,
  maxHeight,
}: ModalStyleParams): ModalStyle {
  return {
    "--modal-width": width,
    "--modal-max-width": maxWidth,
    "--modal-height": height,
    "--modal-max-height": maxHeight,
  };
}

// Renders centered dialog content while Radix owns focus, escape, and outside-click behavior.
export function Modal({
  title,
  children,
  open,
  onOpenChange,
  className,
  overlayClassName,
  width,
  maxWidth,
  height,
  maxHeight,
}: ModalProps): JSX.Element {
  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={combineStyles(styles.overlay, overlayClassName)}
        />
        <Dialog.Content
          className={combineStyles(styles.content, className)}
          style={createModalStyle({ width, maxWidth, height, maxHeight })}
        >
          <Dialog.Title className={styles.title}>{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
