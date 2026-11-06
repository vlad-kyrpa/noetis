import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'active' | 'default';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
}
