import { Slot } from "radix-ui";
import type { ReactNode } from "react";
import { combineStyles } from "../../utils/combineClasses";
import styles from "./styles.module.css";

export enum ButtonType {
  Regular = "regular",
  Active = "active",
  Danger = "danger",
  Transparent = "transparent",
}

interface ButtonProps {
  text?: string;
  children?: ReactNode;
  onClick: () => void;
  className?: string;
  type?: ButtonType;
  ariaLabel?: string;
  asChild?: boolean;
}

const STYLES_CLASSES: Record<ButtonType, string> = {
  [ButtonType.Regular]: styles.btnRegular,
  [ButtonType.Active]: styles.btnActive,
  [ButtonType.Danger]: styles.btnDanger,
  [ButtonType.Transparent]: styles.btnTransparent,
} as const;

const BASE_STYLE_CLASSES: string = styles.btn;

export function Button({
  text,
  children,
  onClick,
  className,
  type = ButtonType.Regular,
  ariaLabel,
  asChild = false,
}: ButtonProps): JSX.Element {
  const combinedStyles = combineStyles(
    BASE_STYLE_CLASSES,
    STYLES_CLASSES[type],
    className,
  );

  if (asChild) {
    return (
      <Slot.Root
        aria-label={ariaLabel}
        className={combinedStyles}
        onClick={onClick}
      >
        {children ?? text}
      </Slot.Root>
    );
  }

  return (
    <button
      aria-label={ariaLabel}
      className={combinedStyles}
      onClick={onClick}
      type="button"
    >
      {children ?? text}
    </button>
  );
}
