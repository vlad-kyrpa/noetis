import type { ReactElement } from 'react';
import type { HeadingProps, HeadingScale } from './types';
import './Heading.css';

const headingTags: Readonly<Record<HeadingScale, 'h1' | 'h2' | 'h3'>> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
};

// Renders a semantic heading from the supported type scale.
export function Heading({ children, id, scale }: HeadingProps): ReactElement {
  const Tag = headingTags[scale];

  return (
    <Tag className={`heading heading-${scale}`} id={id}>
      {children}
    </Tag>
  );
}
