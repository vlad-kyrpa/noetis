import type { ReactElement } from 'react';
import type { TextAreaFieldProps } from './types';
import './TextAreaField.css';

// Multi-line twin of `InputField`: a textarea with its visible label, for longer free text.
export function TextAreaField({ id, label, ...textAreaProps }: TextAreaFieldProps): ReactElement {
  return (
    <label className="text-area-field" htmlFor={id}>
      <span className="text-area-field-label">{label}</span>
      <textarea className="text-area-field-control" id={id} {...textAreaProps} />
    </label>
  );
}
