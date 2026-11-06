import type { HudAction } from '../Layout/types';
import './Hud.css';

interface HudProps<TActionId extends string> {
  actions: readonly HudAction<TActionId>[];
  activeAction?: TActionId;
}

// Renders supplied primary navigation actions for the application shell.
export const Hud = <TActionId extends string>({ actions, activeAction }: HudProps<TActionId>) => (
  <nav aria-label="Primary navigation" className="hud">
    {actions.map((action) => (
      <HudButton action={action} activeAction={activeAction} key={action.id} />
    ))}
  </nav>
);

interface HudButtonProps<TActionId extends string> {
  action: HudAction<TActionId>;
  activeAction?: TActionId;
}

// Renders an icon-only navigation control while preserving a readable name for assistive technology.
const HudButton = <TActionId extends string>({
  action,
  activeAction,
}: HudButtonProps<TActionId>) => {
  const Icon = action.icon;

  return (
    <button
      aria-current={activeAction === action.id ? 'page' : undefined}
      aria-label={action.label}
      className="hud-button"
      data-active={activeAction === action.id}
      onClick={action.onClick}
      type="button"
    >
      <Icon aria-hidden="true" size="var(--icon-size-2)" />
    </button>
  );
};
