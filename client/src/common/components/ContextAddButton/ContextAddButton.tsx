import { Plus } from 'lucide-react';
import type { ReactElement } from 'react';
import { AppArea } from '../../navigation/types';
import type { ContextAddButtonProps } from './types';
import './ContextAddButton.css';

// What "add" means in each area; null hides the bookmark where there is nothing to create.
const ADD_ACTION_LABELS: Readonly<Record<AppArea, string | null>> = {
  [AppArea.Home]: 'quick add',
  [AppArea.Tasks]: 'create task',
  [AppArea.Notes]: 'create note',
  [AppArea.Expenses]: 'add expense',
  [AppArea.Menu]: null,
};

// A bookmark-style "add" control pinned to the top-right corner whose meaning follows the
// current area. Creation flows don't exist yet, so it only reports what it would do.
export function ContextAddButton({ area }: ContextAddButtonProps): ReactElement | null {
  const label = area === undefined ? null : ADD_ACTION_LABELS[area];

  if (label === null) {
    return null;
  }

  return (
    <button
      aria-label={label}
      className="context-add-button"
      onClick={() => console.info(label)}
      title={label}
      type="button"
    >
      <Plus aria-hidden="true" size="var(--icon-size-2)" />
    </button>
  );
}
