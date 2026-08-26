import type { ReactNode } from "react";
import { combineStyles } from "../../utils/combineClasses";
import styles from "./styles.module.css";

interface ListProps {
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
  listClassName?: string;
}

interface ListItemProps {
  children: ReactNode;
  className?: string;
}

// Renders a reusable scrollable list with consistent dark-theme scrollbar styling.
export function List({
  children,
  ariaLabel,
  className,
  listClassName,
}: ListProps): JSX.Element {
  return (
    <div className={combineStyles(styles.scrollArea, className)}>
      <ul
        aria-label={ariaLabel}
        className={combineStyles(styles.list, listClassName)}
      >
        {children}
      </ul>
    </div>
  );
}

// Frames arbitrary list content with the shared result/item surface treatment.
export function ListItem({ children, className }: ListItemProps): JSX.Element {
  return (
    <li className={combineStyles(styles.item, className)}>
      {children}
    </li>
  );
}
