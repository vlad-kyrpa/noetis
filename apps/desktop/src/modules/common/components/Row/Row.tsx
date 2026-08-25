import type { ReactNode } from "react";
import { combineStyles } from "../../utils/combineClasses";
import styles from "./styles.module.css";

export enum RowAlign {
  Start = "start",
  Center = "center",
  End = "end",
  Stretch = "stretch",
}

export enum RowJustify {
  Start = "start",
  Center = "center",
  End = "end",
  Between = "between",
}

export enum RowGap {
  None = "none",
  Small = "small",
  Medium = "medium",
  Large = "large",
}

interface RowProps {
  children: ReactNode;
  className?: string;
  align?: RowAlign;
  justify?: RowJustify;
  gap?: RowGap;
  wrap?: boolean;
}

const ALIGN_CLASSES: Record<RowAlign, string> = {
  [RowAlign.Start]: styles.alignStart,
  [RowAlign.Center]: styles.alignCenter,
  [RowAlign.End]: styles.alignEnd,
  [RowAlign.Stretch]: styles.alignStretch,
} as const;

const JUSTIFY_CLASSES: Record<RowJustify, string> = {
  [RowJustify.Start]: styles.justifyStart,
  [RowJustify.Center]: styles.justifyCenter,
  [RowJustify.End]: styles.justifyEnd,
  [RowJustify.Between]: styles.justifyBetween,
} as const;

const GAP_CLASSES: Record<RowGap, string> = {
  [RowGap.None]: styles.gapNone,
  [RowGap.Small]: styles.gapSmall,
  [RowGap.Medium]: styles.gapMedium,
  [RowGap.Large]: styles.gapLarge,
} as const;

// Renders a horizontal flex container with typed layout variants and extendable styles.
export function Row({
  children,
  className,
  align = RowAlign.Stretch,
  justify = RowJustify.Start,
  gap = RowGap.Medium,
  wrap = false,
}: RowProps): JSX.Element {
  return (
    <div
      className={combineStyles(
        styles.row,
        ALIGN_CLASSES[align],
        JUSTIFY_CLASSES[justify],
        GAP_CLASSES[gap],
        wrap ? styles.wrap : undefined,
        className,
      )}
    >
      {children}
    </div>
  );
}
