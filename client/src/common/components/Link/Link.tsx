import type { ReactElement } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import type { LinkProps } from './types';
import './Link.css';

// Provides route navigation with the shared inline-link treatment.
export function Link({ children, ...linkProps }: LinkProps): ReactElement {
  return (
    <RouterLink className="link" {...linkProps}>
      {children}
    </RouterLink>
  );
}
