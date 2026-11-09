import type { FocusMenuItemParams, MenuFocusPosition } from './types';

const MENU_ITEM_SELECTOR = '[role="menuitem"]';
const NOT_FOCUSED = -1;

// Wraps an index into the item range, so stepping past either end loops around.
const wrapIndex = ({ count, index }: MenuFocusPosition): number => (index + count) % count;

export const FIRST_MENU_ITEM = (): number => 0;

export const LAST_MENU_ITEM = ({ count }: MenuFocusPosition): number => count - 1;

// Keys that move focus inside an open menu and the item each one lands on.
export const MENU_KEY_TO_FOCUS_TARGET: Readonly<
  Record<string, (position: MenuFocusPosition) => number>
> = {
  ArrowDown: ({ count, index }) => wrapIndex({ count, index: index + 1 }),
  ArrowUp: ({ count, index }) =>
    index === NOT_FOCUSED ? count - 1 : wrapIndex({ count, index: index - 1 }),
  End: LAST_MENU_ITEM,
  Home: FIRST_MENU_ITEM,
};

// Moves DOM focus to the menu item chosen by `resolveIndex`. Disabled items stay focusable
// (`aria-disabled`), so keyboard users still discover them.
export const focusMenuItem = ({ menu, resolveIndex }: FocusMenuItemParams): void => {
  const items = [...(menu?.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR) ?? [])];

  if (items.length === 0) {
    return;
  }

  const focusedIndex = items.findIndex((item) => item === document.activeElement);
  items[resolveIndex({ count: items.length, index: focusedIndex })]?.focus();
};
