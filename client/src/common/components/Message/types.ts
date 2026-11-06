import type { ReactNode } from 'react';

// Values double as the `message-<tone>` CSS class suffix.
export enum MessageTone {
  Issue = 'issue',
  Info = 'info',
}

export interface MessageProps {
  children: ReactNode;
  tone?: MessageTone;
}
