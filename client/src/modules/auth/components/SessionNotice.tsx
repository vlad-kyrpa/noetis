import { MessageTone } from '../../../common/components/Message/types';
import type { ReactElement } from 'react';
import { Button } from '../../../common/components/Button/Button';
import { Message } from '../../../common/components/Message/Message';

interface SessionUnavailableProps {
  onRetry: () => void;
}

// Tells the user their stored session is being verified so guarded routes do not flash.
export function SessionPending(): ReactElement {
  return (
    <div aria-live="polite">
      <Message tone={MessageTone.Info}>checking session…</Message>
    </div>
  );
}

// Explains that the server could not confirm the session, without logging the user out.
export function SessionUnavailable({ onRetry }: SessionUnavailableProps): ReactElement {
  return (
    <div aria-live="polite">
      <Message tone={MessageTone.Issue}>
        Unable to reach the server. Your session is still saved.
      </Message>
      <Button onClick={onRetry} type="button">
        retry
      </Button>
    </div>
  );
}
