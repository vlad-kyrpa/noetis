import { Search } from 'lucide-react';
import type { FormEvent, ReactElement } from 'react';
import { Button } from '../Button/Button';
import type { SearchBarProps } from './types';
import './SearchBar.css';

// Presentational search form: Enter or the button submits, typing only reports the text. The
// parse failure sits under the input and is linked to it for assistive technology.
export function SearchBar({
  failureMessage,
  id,
  label,
  onChange,
  onSubmit,
  placeholder,
  value,
}: SearchBarProps): ReactElement {
  const failureId = `${id}-failure`;
  const hasFailure = failureMessage !== null;

  // Keeps the browser from navigating; the owner decides what a submit does.
  const submitSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="search-bar" noValidate onSubmit={submitSearch} role="search">
      <div className="search-bar-row">
        <label className="visually-hidden" htmlFor={id}>
          {label}
        </label>
        <input
          aria-describedby={hasFailure ? failureId : undefined}
          aria-invalid={hasFailure}
          autoComplete="off"
          className="search-bar-input"
          enterKeyHint="search"
          id={id}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="search"
          value={value}
        />
        <Button type="submit">
          <Search aria-hidden="true" size="var(--icon-size-1)" />
          <span className="search-bar-button-label">search</span>
        </Button>
      </div>
      {hasFailure && (
        <p className="search-bar-failure" id={failureId}>
          {failureMessage}
        </p>
      )}
    </form>
  );
}
