import type { ReactNode } from 'react';

// Values are the heading level, used for both the `h<n>` tag and the `heading-<n>` CSS class.
export enum HeadingScale {
  Page = 1,
  Section = 2,
  Subsection = 3,
}

export interface HeadingProps {
  children: ReactNode;
  id?: string;
  scale: HeadingScale;
}
