import type { ButtonHTMLAttributes, ReactNode } from 'react';

// Values double as the `button-<variant>` CSS class suffix.
export enum ButtonVariant {
  Active = 'active',
  Default = 'default',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
}
