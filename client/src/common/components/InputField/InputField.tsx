import type { ReactElement } from 'react';
import type { InputFieldProps } from './types';
import './InputField.css';

// Pairs an input with its visible label to keep forms accessible by default.
export function InputField({ id, label, ...inputProps }: InputFieldProps): ReactElement {
  return (
    <label className="input-field" htmlFor={id}>
      <span className="input-field-label">{label}</span>
      <input className="input-field-control" id={id} {...inputProps} />
    </label>
  );
}
