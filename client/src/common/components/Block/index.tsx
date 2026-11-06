import type { ReactElement, ReactNode } from 'react';
import { BlockType } from './types';
import './Block.css';

interface BlockProps {
  children: ReactNode;
  type?: BlockType;
}

// Groups related content within one consistently styled surface.
export function Block({ children, type = BlockType.Surface }: BlockProps): ReactElement {
  return <section className={`block block-${type}`}>{children}</section>;
}
