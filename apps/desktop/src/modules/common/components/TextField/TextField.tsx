import { combineStyles } from "../../utils/combineClasses";
import styles from "./styles.module.css";

export enum TextFieldVariant {
  Regular = "regular",
  Borderless = "borderless",
}

interface TextFieldProps {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  controlClassName?: string;
  label?: string;
  placeholder?: string;
  type?: "text" | "search";
  variant?: TextFieldVariant;
}

interface TextAreaProps {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  allowResize?: boolean;
  className?: string;
  controlClassName?: string;
  label?: string;
  placeholder?: string;
  variant?: TextFieldVariant;
}

const VARIANT_CLASSES: Record<TextFieldVariant, string> = {
  [TextFieldVariant.Regular]: styles.regular,
  [TextFieldVariant.Borderless]: styles.borderless,
} as const;

// Renders optional field labels without coupling callers to input markup.
function createLabel(label: string | undefined): JSX.Element | null {
  return label ? <span className={styles.label}>{label}</span> : null;
}

// Renders a reusable controlled single-line text field.
export function TextField({
  ariaLabel,
  value,
  onChange,
  className,
  controlClassName,
  label,
  placeholder,
  type = "text",
  variant = TextFieldVariant.Regular,
}: TextFieldProps): JSX.Element {
  return (
    <label className={combineStyles(styles.field, className)}>
      {createLabel(label)}
      <input
        aria-label={ariaLabel}
        className={combineStyles(
          styles.control,
          VARIANT_CLASSES[variant],
          controlClassName,
        )}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

// Renders a reusable controlled multi-line text field.
export function TextArea({
  ariaLabel,
  value,
  onChange,
  allowResize = false,
  className,
  controlClassName,
  label,
  placeholder,
  variant = TextFieldVariant.Regular,
}: TextAreaProps): JSX.Element {
  return (
    <label className={combineStyles(styles.field, className)}>
      {createLabel(label)}
      <textarea
        aria-label={ariaLabel}
        className={combineStyles(
          styles.control,
          styles.textArea,
          allowResize ? styles.resizable : styles.fixedSize,
          VARIANT_CLASSES[variant],
          controlClassName,
        )}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}
