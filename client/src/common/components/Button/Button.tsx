import type { ReactElement } from 'react';
import { ButtonVariant } from './types';
import type { ButtonProps } from './types';
import './Button.css';

// Provides a reusable action control with an explicit visual priority.
export function Button({
  children,
  variant = ButtonVariant.Default,
  ...buttonProps
}: ButtonProps): ReactElement {
  return (
    <button className={`button button-${variant}`} {...buttonProps}>
      {children}
    </button>
  );
}
