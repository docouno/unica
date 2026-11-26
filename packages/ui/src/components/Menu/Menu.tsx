import { useCallback, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent, ReactElement } from 'react';
import { composeEventHandlers } from '../../core/composeEventHandlers.js';
import { cx } from '../../core/cx.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { requireSlotChild, Slot } from '../../core/Slot.js';
import { useStateAuthority } from '../../core/useControllableState.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { contextSelection, useContextInvocation } from './context-invocation.js';
import { MenuContext, useMenu } from './menu-context.js';
import type { MenuContextValue } from './menu-context.js';
import { available, MenuController } from './menu-controller.js';
import { ownedInvocationAttributes } from './row.js';
import type { MenuOrigin } from './menu-controller.js';
import type {
  ContextMenuProps,
  ContextMenuTriggerProps,
  MenuProps,
  MenuTriggerProps,
} from './types.js';
import './menu.css';

function MenuRoot({
  children,
  ref,
  size = 'm',
  open,
  defaultOpen = false,
  onOpenChange,
  context,
}: MenuProps & { readonly context?: MenuContextValue['context'] }): ReactElement {
  const [requested, { read, propose }] = useStateAuthority({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const [controller] = useState(() => new MenuController(read, propose));
  const revision = useSyncExternalStore(controller.subscribe, controller.snapshot, () => 0);
  useIsoLayoutEffect(() => controller.start(), [controller]);
  useIsoLayoutEffect(() => controller.sync(), [controller, requested, revision]);
  return <MenuContext value={{ controller, size, rootRef: ref, context }}>{children}</MenuContext>;
}

/** Coordinates one command menu opened from a visible button. */
export function Menu(props: MenuProps): ReactElement {
  return <MenuRoot {...props} />;
}

/** Shares one command menu between a visible button and an object's context gestures. */
export function ContextMenu({
  longPress,
  shouldOpen,
  onInvoke,
  ...props
}: ContextMenuProps): ReactElement {
  const context = useMemo(
    () => ({ longPress, shouldOpen, onInvoke }),
    [longPress, shouldOpen, onInvoke],
  );
  return <MenuRoot {...props} context={context} />;
}

/** Supplies context gestures to one existing element while preserving its native semantics. */
export function ContextMenuTrigger<T extends HTMLElement = HTMLElement>({
  children,
  ref,
  onContextMenu,
  onKeyDown,
  onPointerDown,
  ...props
}: ContextMenuTriggerProps<T>): ReactElement {
  const value = useMenu();
  const interaction = useContextInvocation(value);
  const { controller } = value;
  const anchor = controller.visible ? (controller.origin?.point ? 'point' : 'element') : undefined;
  return (
    <Slot<T>
      {...props}
      ref={ref}
      onContextMenu={composeEventHandlers(onContextMenu, interaction.onContextMenu)}
      onKeyDown={composeEventHandlers(onKeyDown, interaction.onKeyDown)}
      onPointerDown={composeEventHandlers(onPointerDown, interaction.onPointerDown)}
      slotOwned={{
        'data-unica-context-menu-target': '',
        'data-unica-context-menu-anchor': anchor,
      }}
    >
      {children}
    </Slot>
  );
}

/** Opens the menu from a button, including a composed Button or IconButton. */
export function MenuTrigger({
  asChild,
  children,
  ref,
  id,
  className,
  onClick,
  onKeyDown,
  onPointerDown,
  ...props
}: MenuTriggerProps): ReactElement {
  const { controller, rootRef, context } = useMenu();
  const fallbackId = useId();
  const mergedRef = useMemo(
    () => mergeRefs(controller.setTrigger, rootRef, ref),
    [controller, rootRef, ref],
  );
  const selection = useRef<string>(undefined);
  const getSelection = useCallback((button: HTMLButtonElement): string => {
    const target = button.closest<HTMLElement>('[data-unica-context-menu-target]');
    return target ? contextSelection(target) : '';
  }, []);

  const activate = (button: HTMLButtonElement, focus: MenuOrigin['focus'], text?: string): void => {
    if (!available(button)) {
      return;
    }
    if (controller.visible && controller.origin?.button) {
      controller.requestClose();
      return;
    }
    context?.onInvoke?.({
      kind: 'button',
      source: button,
      selection: text ?? getSelection(button),
      native: false,
    });
    controller.request({ owner: button, restore: button, focus, button: true });
  };
  const click = (event: MouseEvent<HTMLButtonElement>): void => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    const text = event.detail ? selection.current : undefined;
    selection.current = undefined;
    activate(event.currentTarget, event.detail === 0 ? 'first' : 'panel', text);
  };
  const keydown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (
      event.nativeEvent.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')
    ) {
      return;
    }
    event.preventDefault();
    if (!controller.visible || !controller.origin?.button) {
      activate(event.currentTarget, event.key === 'ArrowUp' ? 'last' : 'first');
    } else {
      controller.focusEntry(event.key === 'ArrowUp' ? 'last' : 'first');
    }
  };
  const pointerDown = (event: PointerEvent<HTMLButtonElement>): void => {
    if (context && event.button === 0) {
      selection.current = getSelection(event.currentTarget);
    }
  };
  const owned = {
    ...ownedInvocationAttributes(),
    type: 'button' as const,
    tabIndex: undefined,
    'aria-checked': undefined,
    role: undefined,
    'aria-haspopup': 'menu' as const,
    'aria-expanded': controller.visible,
    'aria-controls': controller.root.host?.id || undefined,
    'data-unica-menu-trigger': '',
  };
  const events = {
    onClick: (event: MouseEvent<HTMLButtonElement>) => composeEventHandlers(onClick, click)(event),
    onKeyDown: composeEventHandlers(onKeyDown, keydown),
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) =>
      composeEventHandlers(onPointerDown, pointerDown)(event),
  };
  if (asChild) {
    const child = requireSlotChild<HTMLButtonElement>(children, 'MenuTrigger');
    if (typeof child.type === 'string' && child.type !== 'button') {
      throw new Error('MenuTrigger asChild requires a native button.');
    }
    return (
      <Slot
        {...props}
        {...events}
        className={cx('unica-menu-trigger', className)}
        ref={mergedRef}
        id={id}
        slotDefaults={{ id: fallbackId }}
        slotOwned={{
          ...owned,
          ...(typeof child.type !== 'string' && { commandFor: undefined }),
        }}
      >
        {child}
      </Slot>
    );
  }
  return (
    <button
      {...props}
      {...events}
      {...owned}
      className={cx('unica-menu-trigger', className)}
      ref={mergedRef}
      id={id ?? fallbackId}
    >
      {children}
    </button>
  );
}
