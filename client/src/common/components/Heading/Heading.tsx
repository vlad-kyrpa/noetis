import type { ReactElement } from 'react';
import { HeadingScale } from './types';
import type { HeadingProps } from './types';
import './Heading.css';

const headingTags: Readonly<Record<HeadingScale, 'h1' | 'h2' | 'h3'>> = {
  [HeadingScale.Page]: 'h1',
  [HeadingScale.Section]: 'h2',
  [HeadingScale.Subsection]: 'h3',
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
