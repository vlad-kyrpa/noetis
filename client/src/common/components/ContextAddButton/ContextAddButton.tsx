import { Plus } from 'lucide-react';
import type { ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createReturnToState } from '../../navigation/return-to';
import type { ContextAddButtonProps } from './types';
import './ContextAddButton.css';

// A bookmark-style "add" control pinned to the top-right corner. Its action is resolved from
// the current URL by the layout; the opened flow receives the current URL so it can prefill
// from that context and return to it.
export function ContextAddButton({ action }: ContextAddButtonProps): ReactElement | null {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  if (action === null) {
    return null;
  }

  const { label, route } = action;

  // Opens the context's create flow, or reports the intent where none exists yet.
  const runAddAction = (): void => {
    if (route === null) {
      console.info(label);
      return;
    }

    void navigate(route, { state: createReturnToState(`${pathname}${search}`) });
  };

  return (
    <button
      aria-label={label}
      className="context-add-button"
      onClick={runAddAction}
      title={label}
      type="button"
    >
      <Plus aria-hidden="true" size="var(--icon-size-2)" />
    </button>
  );
}
