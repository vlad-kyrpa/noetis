import { Ellipsis } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactElement } from 'react';
import { FIRST_MENU_ITEM, MENU_KEY_TO_FOCUS_TARGET, focusMenuItem } from './menu-focus';
import type { ContextMenuButtonProps, ContextMenuItemProps } from './types';
import './ContextMenuButton.css';

const ESCAPE_KEY = 'Escape';
const TAB_KEY = 'Tab';

// One menu entry. Disabled entries stay focusable and announce themselves, but do nothing.
function ContextMenuItem({ action, onClose }: ContextMenuItemProps): ReactElement {
  const Icon = action.icon;
  const isActionable = !action.disabled && action.onSelect !== undefined;

  // Runs the action and closes the menu; a disabled or unwired action is ignored.
  const selectAction = (): void => {
    if (!isActionable) {
      return;
    }

    onClose();
    action.onSelect?.();
  };

  return (
    <li role="none">
      <button
        aria-disabled={!isActionable}
        className="context-menu-item"
        onClick={selectAction}
        role="menuitem"
        tabIndex={-1}
        type="button"
      >
        <Icon aria-hidden="true" size="var(--icon-size-1)" />
        <span className="context-menu-item-label">{action.label}</span>
        {action.hint !== undefined && <span className="context-menu-item-hint">{action.hint}</span>}
      </button>
    </li>
  );
}

// A ⋯ button that opens an accessible menu of actions: focus moves to the first item on open,
// arrows/Home/End move between items, Escape closes and returns focus, outside clicks close.
export function ContextMenuButton({ actions, label }: ContextMenuButtonProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const menuId = useId();

  const closeMenu = useCallback((): void => setIsOpen(false), []);

  const closeMenuAndRestoreFocus = useCallback((): void => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  // While open, focus the first item and close when a pointer goes down outside the menu.
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    focusMenuItem({ menu: menuRef.current, resolveIndex: FIRST_MENU_ITEM });

    const closeOnOutsidePointer = (event: PointerEvent): void => {
      const isInside = event.target instanceof Node && containerRef.current?.contains(event.target);

      if (isInside !== true) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);

    return (): void => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [isOpen]);

  // Routes menu keys: Escape closes back to the trigger, Tab closes, arrows move focus.
  const handleMenuKeyDown = (event: KeyboardEvent<HTMLUListElement>): void => {
    if (event.key === ESCAPE_KEY) {
      event.preventDefault();
      closeMenuAndRestoreFocus();
      return;
    }

    if (event.key === TAB_KEY) {
      closeMenu();
      return;
    }

    const resolveIndex = MENU_KEY_TO_FOCUS_TARGET[event.key];

    if (resolveIndex !== undefined) {
      event.preventDefault();
      focusMenuItem({ menu: menuRef.current, resolveIndex });
    }
  };

  return (
    <div className="context-menu" ref={containerRef}>
      <button
        aria-controls={isOpen ? menuId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={label}
        className="context-menu-trigger"
        onClick={() => setIsOpen((wasOpen) => !wasOpen)}
        ref={triggerRef}
        title={label}
        type="button"
      >
        <Ellipsis aria-hidden="true" size="var(--icon-size-2)" />
      </button>
      {isOpen && (
        <ul
          aria-label={label}
          className="context-menu-list"
          id={menuId}
          onKeyDown={handleMenuKeyDown}
          ref={menuRef}
          role="menu"
        >
          {actions.map((action) => (
            <ContextMenuItem action={action} key={action.id} onClose={closeMenu} />
          ))}
        </ul>
      )}
    </div>
  );
}
