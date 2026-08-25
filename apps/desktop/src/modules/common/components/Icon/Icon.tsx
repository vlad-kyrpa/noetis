import { ICON_PATHS, type IconName } from "./vectors";
import styles from "./styles.module.css";
export type { IconName } from "./vectors";

const SVG_FILL = "none";
const SVG_STROKE = "currentColor";
const SVG_STROKE_LINE_CAP = "round";
const SVG_STROKE_LINE_JOIN = "round";
const SVG_STROKE_WIDTH = "1.75";
const SVG_VIEW_BOX = "0 0 24 24";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

interface IconProps {
  name: IconName;
  alt: string;
}

// Renders a typed app icon with accessible text provided by the caller.
export function Icon({ name, alt }: IconProps): JSX.Element {
  return (
    <svg
      aria-label={alt}
      className={styles.icon}
      fill={SVG_FILL}
      role="img"
      stroke={SVG_STROKE}
      strokeLinecap={SVG_STROKE_LINE_CAP}
      strokeLinejoin={SVG_STROKE_LINE_JOIN}
      strokeWidth={SVG_STROKE_WIDTH}
      viewBox={SVG_VIEW_BOX}
      xmlns={SVG_NAMESPACE}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

interface CreateIconParams {
  name: IconName;
  alt: string;
}

// Prepares a typed icon element for components that should not accept arbitrary children.
export function createIcon({ name, alt }: CreateIconParams): JSX.Element {
  return <Icon name={name} alt={alt} />;
}
