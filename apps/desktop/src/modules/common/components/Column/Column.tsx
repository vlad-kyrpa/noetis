import type { ReactNode } from "react";
import { combineStyles } from "../../utils/combineClasses";
import styles from "./styles.module.css";

export enum ColumnAlign {
  Start = "start",
  Center = "center",
  End = "end",
  Stretch = "stretch",
}

export enum ColumnJustify {
  Start = "start",
  Center = "center",
  End = "end",
  Between = "between",
}

export enum ColumnGap {
  None = "none",
  Small = "small",
  Medium = "medium",
  Large = "large",
}

interface ColumnProps {
  children: ReactNode;
  className?: string;
  align?: ColumnAlign;
  justify?: ColumnJustify;
  gap?: ColumnGap;
}

const ALIGN_CLASSES: Record<ColumnAlign, string> = {
  [ColumnAlign.Start]: styles.alignStart,
  [ColumnAlign.Center]: styles.alignCenter,
  [ColumnAlign.End]: styles.alignEnd,
  [ColumnAlign.Stretch]: styles.alignStretch,
} as const;

const JUSTIFY_CLASSES: Record<ColumnJustify, string> = {
  [ColumnJustify.Start]: styles.justifyStart,
  [ColumnJustify.Center]: styles.justifyCenter,
  [ColumnJustify.End]: styles.justifyEnd,
  [ColumnJustify.Between]: styles.justifyBetween,
} as const;

const GAP_CLASSES: Record<ColumnGap, string> = {
  [ColumnGap.None]: styles.gapNone,
  [ColumnGap.Small]: styles.gapSmall,
  [ColumnGap.Medium]: styles.gapMedium,
  [ColumnGap.Large]: styles.gapLarge,
} as const;

// Renders a vertical flex container with typed layout variants and extendable styles.
export function Column({
  children,
  className,
  align = ColumnAlign.Stretch,
  justify = ColumnJustify.Start,
  gap = ColumnGap.Medium,
}: ColumnProps): JSX.Element {
  return (
    <div
      className={combineStyles(
        styles.column,
        ALIGN_CLASSES[align],
        JUSTIFY_CLASSES[justify],
        GAP_CLASSES[gap],
        className,
      )}
    >
      {children}
    </div>
  );
}
