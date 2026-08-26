import { Slot } from "radix-ui";
import type { CSSProperties, ReactNode } from "react";
import { combineStyles } from "../../utils/combineClasses";

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

export interface RowProps {
  children: ReactNode;
  className?: string;
  align?: RowAlign;
  justify?: RowJustify;
  gap?: RowGap;
  wrap?: boolean;
  asChild?: boolean;
  style?: CSSProperties;
}

const ALIGN_STYLES: Record<RowAlign, CSSProperties["alignItems"]> = {
  [RowAlign.Start]: "flex-start",
  [RowAlign.Center]: "center",
  [RowAlign.End]: "flex-end",
  [RowAlign.Stretch]: "stretch",
} as const;

const JUSTIFY_STYLES: Record<RowJustify, CSSProperties["justifyContent"]> = {
  [RowJustify.Start]: "flex-start",
  [RowJustify.Center]: "center",
  [RowJustify.End]: "flex-end",
  [RowJustify.Between]: "space-between",
} as const;

const GAP_STYLES: Record<RowGap, CSSProperties["gap"]> = {
  [RowGap.None]: "var(--space-0)",
  [RowGap.Small]: "var(--space-4)",
  [RowGap.Medium]: "var(--space-8)",
  [RowGap.Large]: "var(--space-10)",
} as const;

interface CreateRowStyleParams {
  align: RowAlign;
  justify: RowJustify;
  gap: RowGap;
  wrap: boolean;
  style: CSSProperties | undefined;
}

// Converts typed layout props into flex styles while preserving caller overrides.
function createRowStyle({
  align,
  justify,
  gap,
  wrap,
  style,
}: CreateRowStyleParams): CSSProperties {
  return {
    display: "flex",
    flexDirection: "row",
    alignItems: ALIGN_STYLES[align],
    justifyContent: JUSTIFY_STYLES[justify],
    gap: GAP_STYLES[gap],
    flexWrap: wrap ? "wrap" : undefined,
    ...style,
  };
}

// Renders a horizontal Radix-composable flex container with typed layout variants.
export function Row({
  children,
  className,
  align = RowAlign.Stretch,
  justify = RowJustify.Start,
  gap = RowGap.Medium,
  wrap = false,
  asChild = false,
  style,
}: RowProps): JSX.Element {
  const rowStyle = createRowStyle({ align, justify, gap, wrap, style });
  const combinedClassName = combineStyles(className);

  if (asChild) {
    return (
      <Slot.Root className={combinedClassName} style={rowStyle}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <div className={combinedClassName} style={rowStyle}>
      {children}
    </div>
  );
}
