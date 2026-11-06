import type { ReactNode } from 'react';

export type HeadingScale = 1 | 2 | 3;

export interface HeadingProps {
  children: ReactNode;
  id?: string;
  scale: HeadingScale;
}
