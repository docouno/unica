import { useEffect, useRef } from 'react';
import type { DOMAttributes, ReactElement } from 'react';
import { useLiveMenu } from './use-live-menu.js';
import type { LiveMenuProps, MenuInvocation, TriggerProps } from './use-live-menu.js';

type ContextKind = 'pointer' | 'keyboard' | 'touch' | 'button';
interface Context {
  readonly kind: ContextKind;
  readonly source: Element;
  readonly selection: string;
  readonly native: boolean;
}

type ContextTargetProps<T extends HTMLElement> = Required<
  Pick<
    DOMAttributes<T>,
    | 'onContextMenu'
    | 'onKeyDown'
    | 'onPointerDown'
    | 'onPointerMove'
    | 'onPointerUp'
    | 'onPointerCancel'
    | 'onMouseDownCapture'
    | 'onClickCapture'
  >
> & {
  readonly 'data-context-target': true;
  readonly 'data-context-open'?: 'point' | 'anchor' | undefined;
};

interface ContextMenuProps<T extends HTMLElement> extends LiveMenuProps {
  readonly target: (
    props: ContextTargetProps<T>,
    trigger: ReactElement,
    panel: ReactElement,
  ) => ReactElement;
  readonly shouldOpen?: (context: Context) => boolean;
  readonly onInvoke?: (context: Context) => void;
  readonly longPress?: boolean;
}

interface Hold {
  readonly point: { readonly x: number; readonly y: number };
  readonly id: number;
  readonly timer: ReturnType<typeof setTimeout>;
}

const nativeSelector =
  'a[href], input, select, textarea, [data-native-context-region], audio[controls], video[controls], img';
const HOLD_DURATION = 500;
const HOLD_DRIFT = 10;

function contextFor(kind: ContextKind, source: Element, selectionScope = source): Context {
  const selection = window.getSelection();
  const selectedText =
    selection &&
    !selection.isCollapsed &&
    selection.rangeCount > 0 &&
    selection.getRangeAt(0).intersectsNode(selectionScope)
      ? selection.toString()
      : '';
  return {
    kind,
    source,
    selection: selectedText,
    native:
      Boolean(source.closest(nativeSelector)) ||
      (source instanceof HTMLElement && source.isContentEditable) ||
      Boolean(selectedText),
  };
}

function ownsTarget(source: Element, scope: HTMLElement): boolean {
  return source.closest('[data-context-target]') === scope && !source.closest('.menu-proto');
}

function useContextMenu<T extends HTMLElement>({
  shouldOpen,
  onInvoke,
  longPress = false,
  ...props
}: Omit<ContextMenuProps<T>, 'target' | 'trigger'>): {
  readonly bindings: ContextTargetProps<T>;
  readonly button: TriggerProps;
  readonly panel: ReactElement;
} {
  const menu = useLiveMenu(props);
  const hold = useRef<Hold | null>(null);
  const release = useRef<AbortController | null>(null);
  const suppressTap = useRef(false);
  const buttonSelection = useRef<string | null>(null);

  useEffect(() => {
    const cancel = (): void => {
      clearTimeout(hold.current?.timer);
      hold.current = null;
    };
    window.addEventListener('scroll', cancel, true);
    return () => {
      window.removeEventListener('scroll', cancel, true);
      cancel();
      release.current?.abort();
    };
  }, []);

  const restoreTarget = (scope: HTMLElement): HTMLElement => {
    const active = document.activeElement;
    const usable =
      active instanceof HTMLElement &&
      active !== document.body &&
      scope.contains(active) &&
      !active.closest('.menu-proto');
    return usable ? active : (menu.triggerElement() ?? scope);
  };

  const invoke = (context: Context, invocation: MenuInvocation): void => {
    if (invocation.anchor.isConnected) {
      onInvoke?.(context);
      menu.open(invocation);
    }
  };

  const triggerProps = menu.triggerProps;
  const buttonContext = (button: HTMLButtonElement): Context =>
    contextFor('button', button, button.closest('[data-context-target]') ?? button);

  return {
    panel: menu.panel,
    button: {
      ...triggerProps,
      onPointerDown: (event) => {
        buttonSelection.current = buttonContext(event.currentTarget).selection;
      },
      onClick: (event) => {
        if (!menu.invocation || menu.invocation.position) {
          const context = buttonContext(event.currentTarget);
          onInvoke?.({ ...context, selection: buttonSelection.current ?? context.selection });
        }
        buttonSelection.current = null;
        triggerProps.onClick?.(event);
      },
      onKeyDown: (event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          onInvoke?.(buttonContext(event.currentTarget));
        }
        triggerProps.onKeyDown?.(event);
      },
    },
    bindings: {
      'data-context-target': true,
      'data-context-open': menu.invocation
        ? menu.invocation.position
          ? 'point'
          : 'anchor'
        : undefined,
      onContextMenu: (event) => {
        const source = event.target;
        if (
          !(source instanceof Element) ||
          !ownsTarget(source, event.currentTarget) ||
          event.defaultPrevented ||
          event.shiftKey
        ) {
          return;
        }
        const isTouch =
          event.nativeEvent instanceof PointerEvent && event.nativeEvent.pointerType === 'touch';
        if (isTouch) {
          if (hold.current || suppressTap.current) {
            event.preventDefault();
          }
          return;
        }
        const context = contextFor('pointer', source);
        if (!(shouldOpen?.(context) ?? !context.native)) {
          return;
        }
        event.preventDefault();
        const scope = event.currentTarget;
        const origin = restoreTarget(scope);
        const position = { x: event.clientX, y: event.clientY };
        release.current?.abort();
        const pending = new AbortController();
        release.current = pending;
        const show = (): void => {
          requestAnimationFrame(() => {
            if (!pending.signal.aborted) {
              invoke(context, { anchor: scope, restore: origin, position, focus: 'panel' });
              pending.abort();
            }
          });
        };
        // Some platforms dispatch contextmenu before the secondary button is released.
        if (event.buttons & 2) {
          window.addEventListener(
            'pointerup',
            (up) => {
              if (up.button === 2) {
                show();
              }
            },
            { signal: pending.signal },
          );
          window.addEventListener('pointercancel', () => pending.abort(), {
            once: true,
            signal: pending.signal,
          });
        } else {
          show();
        }
      },
      onKeyDown: (event) => {
        const source = event.target;
        if (
          !(source instanceof HTMLElement) ||
          !ownsTarget(source, event.currentTarget) ||
          event.defaultPrevented ||
          (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10'))
        ) {
          return;
        }
        const context = contextFor('keyboard', source);
        if (!(shouldOpen?.(context) ?? !context.native)) {
          return;
        }
        event.preventDefault();
        invoke(context, { anchor: source, restore: source, align: 'start', focus: 'first' });
      },
      onPointerDown: (event) => {
        suppressTap.current = false;
        const source = event.target;
        if (
          !longPress ||
          event.pointerType !== 'touch' ||
          !event.isPrimary ||
          !(source instanceof Element) ||
          !ownsTarget(source, event.currentTarget) ||
          source.closest('button')
        ) {
          return;
        }
        const context = contextFor('touch', source);
        if (!(shouldOpen?.(context) ?? !context.native)) {
          return;
        }
        const scope = event.currentTarget;
        const position = { x: event.clientX, y: event.clientY };
        const id = event.pointerId;
        clearTimeout(hold.current?.timer);
        hold.current = {
          point: position,
          id,
          timer: setTimeout(() => {
            const current = contextFor('touch', source);
            hold.current = null;
            if (!(shouldOpen?.(current) ?? !current.native)) {
              return;
            }
            suppressTap.current = true;
            invoke(current, {
              anchor: scope,
              restore: restoreTarget(scope),
              position,
              focus: 'panel',
              capturePointerId: id,
            });
          }, HOLD_DURATION),
        };
      },
      onPointerMove: (event) => {
        const press = hold.current;
        if (
          press?.id === event.pointerId &&
          Math.hypot(event.clientX - press.point.x, event.clientY - press.point.y) > HOLD_DRIFT
        ) {
          clearTimeout(press.timer);
          hold.current = null;
        }
      },
      onPointerUp: (event) => {
        if (hold.current?.id === event.pointerId) {
          clearTimeout(hold.current.timer);
          hold.current = null;
        }
      },
      onPointerCancel: (event) => {
        if (hold.current?.id === event.pointerId) {
          clearTimeout(hold.current.timer);
          hold.current = null;
        }
      },
      onMouseDownCapture: (event) => {
        // A completed touch hold can synthesize a mouse press that refocuses the tile.
        if (suppressTap.current && event.button === 0) {
          event.preventDefault();
        }
      },
      onClickCapture: (event) => {
        if (suppressTap.current && event.detail > 0) {
          event.preventDefault();
          event.stopPropagation();
          suppressTap.current = false;
        }
      },
    },
  };
}

// The markup and invocation bindings are local to this visual reference.
export function ContextMenu<T extends HTMLElement>({
  target,
  trigger,
  ...props
}: ContextMenuProps<T>): ReactElement {
  const menu = useContextMenu<T>(props);
  return target(menu.bindings, trigger(menu.button), menu.panel);
}
