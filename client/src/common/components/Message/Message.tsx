import type { AriaRole, ReactElement } from 'react';
import { MessageTone } from './types';
import type { MessageProps } from './types';
import './Message.css';

// Issues interrupt assistive technology; informational messages are announced politely.
const MESSAGE_ROLES: Readonly<Record<MessageTone, AriaRole>> = {
  [MessageTone.Issue]: 'alert',
  [MessageTone.Info]: 'status',
};

// Shows contextual feedback with semantics appropriate to its urgency.
export function Message({ children, tone = MessageTone.Info }: MessageProps): ReactElement {
  return (
    <p className={`message message-${tone}`} role={MESSAGE_ROLES[tone]}>
      {children}
    </p>
  );
}
