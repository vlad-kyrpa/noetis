import type { ReactElement } from 'react';
import type { CheckboxProps } from './types';
import './Checkbox.css';

// Draws a two-state marker; the inner fill is a separate layer so textures can be applied to it
// without touching the frame. It is decorative — the owning control carries the accessible state.
export function Checkbox({ state }: CheckboxProps): ReactElement {
  return (
    <span aria-hidden="true" className={`checkbox checkbox-${state}`}>
      <span className="checkbox-fill" />
    </span>
  );
}
