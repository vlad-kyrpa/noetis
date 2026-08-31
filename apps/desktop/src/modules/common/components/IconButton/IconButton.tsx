import { Tooltip } from "radix-ui";
import { combineStyles } from "../../utils/combineClasses";
import { Button, ButtonType } from "../Button/Button";
import { createIcon, type IconName } from "../Icon/Icon";
import styles from "./styles.module.css";

interface IconButtonProps {
  ariaLabel: string;
  iconName: IconName;
  iconAlt?: string;
  onClick: () => void;
  className?: string;
  type?: ButtonType;
}

// Renders a button constrained to the shared typed icon set.
export function IconButton({
  ariaLabel,
  iconName,
  iconAlt = ariaLabel,
  onClick,
  className,
  type = ButtonType.Transparent,
}: IconButtonProps): JSX.Element {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Button
            ariaLabel={ariaLabel}
            className={combineStyles(styles.btnIcon, className)}
            onClick={onClick}
            type={type}
          >
            {createIcon({ name: iconName, alt: iconAlt })}
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className={styles.tooltip} sideOffset={6}>
            {ariaLabel}
            <Tooltip.Arrow className={styles.tooltipArrow} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
