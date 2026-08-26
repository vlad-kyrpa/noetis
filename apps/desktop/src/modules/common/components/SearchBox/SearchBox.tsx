import { combineStyles } from "../../utils/combineClasses";
import { Icon } from "../Icon/Icon";
import { IconButton } from "../IconButton/IconButton";
import styles from "./styles.module.css";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
  className?: string;
}

// Renders a reusable full-width search field with typed icons and an optional clear action.
export function SearchBox({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
}: SearchBoxProps): JSX.Element {
  const hasValue = value.length > 0;

  return (
    <div className={combineStyles(styles.searchBox, className)}>
      <span className={styles.searchIcon}>
        <Icon alt="Search" name="search" />
      </span>
      <input
        aria-label={ariaLabel}
        className={styles.searchInput}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
      {hasValue ? (
        <IconButton
          ariaLabel="Clear search"
          className={styles.clearButton}
          iconName="close"
          onClick={() => onChange("")}
        />
      ) : null}
    </div>
  );
}
