import type { ReactNode } from 'react';

export type MessageTone = 'issue' | 'info';

export interface MessageProps {
  children: ReactNode;
  tone?: MessageTone;
}
