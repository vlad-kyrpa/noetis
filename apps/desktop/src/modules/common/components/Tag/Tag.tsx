import { Slot } from "radix-ui";
import type { ReactNode } from "react";
import { combineStyles } from "../../utils/combineClasses";
import styles from "./styles.module.css";

interface TagProps {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
}

// Renders a compact shared label chip for tags and similar metadata.
export function Tag({
  children,
  className,
  asChild = false,
}: TagProps): JSX.Element {
  const combinedClassName = combineStyles(styles.tag, className);

  if (asChild) {
    return (
      <Slot.Root className={combinedClassName}>
        {children}
      </Slot.Root>
    );
  }

  return <li className={combinedClassName}>{children}</li>;
}
