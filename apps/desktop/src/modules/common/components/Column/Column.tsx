import { Slot } from "radix-ui";
import type { CSSProperties, ReactNode } from "react";
import { combineStyles } from "../../utils/combineClasses";

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

export interface ColumnProps {
  children: ReactNode;
  className?: string;
  align?: ColumnAlign;
  justify?: ColumnJustify;
  gap?: ColumnGap;
  asChild?: boolean;
  style?: CSSProperties;
}

const ALIGN_STYLES: Record<ColumnAlign, CSSProperties["alignItems"]> = {
  [ColumnAlign.Start]: "flex-start",
  [ColumnAlign.Center]: "center",
  [ColumnAlign.End]: "flex-end",
  [ColumnAlign.Stretch]: "stretch",
} as const;

const JUSTIFY_STYLES: Record<ColumnJustify, CSSProperties["justifyContent"]> = {
  [ColumnJustify.Start]: "flex-start",
  [ColumnJustify.Center]: "center",
  [ColumnJustify.End]: "flex-end",
  [ColumnJustify.Between]: "space-between",
} as const;

const GAP_STYLES: Record<ColumnGap, CSSProperties["gap"]> = {
  [ColumnGap.None]: "var(--space-0)",
  [ColumnGap.Small]: "var(--space-4)",
  [ColumnGap.Medium]: "var(--space-8)",
  [ColumnGap.Large]: "var(--space-10)",
} as const;

interface CreateColumnStyleParams {
  align: ColumnAlign;
  justify: ColumnJustify;
  gap: ColumnGap;
  style: CSSProperties | undefined;
}

// Converts typed layout props into flex styles while preserving caller overrides.
function createColumnStyle({
  align,
  justify,
  gap,
  style,
}: CreateColumnStyleParams): CSSProperties {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: ALIGN_STYLES[align],
    justifyContent: JUSTIFY_STYLES[justify],
    gap: GAP_STYLES[gap],
    ...style,
  };
}

// Renders a vertical Radix-composable flex container with typed layout variants.
export function Column({
  children,
  className,
  align = ColumnAlign.Stretch,
  justify = ColumnJustify.Start,
  gap = ColumnGap.Medium,
  asChild = false,
  style,
}: ColumnProps): JSX.Element {
  const columnStyle = createColumnStyle({ align, justify, gap, style });
  const combinedClassName = combineStyles(className);

  if (asChild) {
    return (
      <Slot.Root className={combinedClassName} style={columnStyle}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <div className={combinedClassName} style={columnStyle}>
      {children}
    </div>
  );
}
