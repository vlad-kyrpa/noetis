import type { ReactElement } from 'react';
import type { FieldIssueProps } from './types';
import './FieldIssue.css';

// Shows one form field's validation issue under it; point the input's `aria-describedby` at `id`.
export function FieldIssue({ id, issue }: FieldIssueProps): ReactElement | null {
  return issue === undefined ? null : (
    <p className="field-issue" id={id}>
      {issue}
    </p>
  );
}
