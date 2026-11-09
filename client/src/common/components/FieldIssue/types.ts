export interface FieldIssueProps {
  readonly id: string;
  // `undefined` renders nothing, so callers can pass `issues.field` directly.
  readonly issue: string | undefined;
}
