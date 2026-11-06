import type { ReactElement } from 'react';
import type { TextProps } from './types';
import './Text.css';

// Renders supporting copy with consistent readable spacing and color.
export function Text({ children }: TextProps): ReactElement {
  return <p className="text">{children}</p>;
}
