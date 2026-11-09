import type { ReactElement } from 'react';
import { Text } from '../../../common/components/Text/Text';
import './TaskPanel.css';

// Fills the right column of the split layout until a view or a search is opened.
export function NoViewSelected(): ReactElement {
  return (
    <section aria-label="no view selected" className="task-panel task-panel-empty">
      <Text>pick a view on the left, or search above</Text>
    </section>
  );
}
