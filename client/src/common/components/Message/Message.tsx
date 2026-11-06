import type { ReactElement } from 'react';
import type { MessageProps } from './types';
import './Message.css';

// Shows contextual feedback with semantics appropriate to its urgency.
export function Message({ children, tone = 'info' }: MessageProps): ReactElement {
  return (
    <p className={`message message-${tone}`} role={tone === 'issue' ? 'alert' : 'status'}>
      {children}
    </p>
  );
}
