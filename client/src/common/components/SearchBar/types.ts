export interface SearchBarProps {
  readonly failureMessage: string | null;
  readonly id: string;
  // Visually hidden but announced, e.g. "search tasks".
  readonly label: string;
  readonly onChange: (input: string) => void;
  readonly onSubmit: () => void;
  readonly placeholder: string;
  readonly value: string;
}
