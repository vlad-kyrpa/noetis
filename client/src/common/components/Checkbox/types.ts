// Values double as the `checkbox-<state>` CSS class suffix.
export enum CheckboxState {
  Checked = 'checked',
  Unchecked = 'unchecked',
}

export interface CheckboxProps {
  readonly state: CheckboxState;
}
