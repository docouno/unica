import { useRef } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import {
  composedContains,
  getDeepActiveElement,
  isContentEditableSafe,
  isElementNode,
} from '../../core/dom.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import type { MenuContextValue } from './menu-context.js';
import type { MenuOrigin } from './menu-controller.js';
import { available, isFocusOrigin } from './menu-controller.js';
import type { ContextMenuInvocation } from './types.js';

const routed = new WeakSet<Event>();
const menuBoundary = '[data-unica-menu-level], [data-unica-menu-carrier]';
const nativeContext =
  'a[href], area[href], input, textarea, select, img, audio[controls], video[controls], [data-native-context-region]';

interface ContextRoute {
  readonly targetPath: readonly Element[];
  readonly composedPath: readonly Element[];
}

function route(event: Event, host: HTMLElement): ContextRoute | undefined {
  if (event.defaultPrevented || routed.has(event)) {
    return undefined;
  }
  const path = event.composedPath();
  const boundary = path.indexOf(host);
  if (boundary < 0) {
    return undefined;
  }
  const targetPath = path.slice(0, boundary + 1).filter(isElementNode);
  if (targetPath.some((element) => element.matches(menuBoundary))) {
    return undefined;
  }
  routed.add(event);
  return { targetPath, composedPath: path.filter(isElementNode) };
}

function hasNativeContext(element: Element): boolean {
  return element.matches(nativeContext) || isContentEditableSafe(element);
}

function activeOrigin(host: HTMLElement): Element | null {
  const active = getDeepActiveElement(host.ownerDocument);
  return active && composedContains(host, active) && available(active) ? active : null;
}

function pointerOrigin(host: HTMLElement, path: readonly Element[]): Element | null {
  const active = activeOrigin(host);
  return active && path.includes(active) ? active : (path.find(isFocusOrigin) ?? null);
}

export function contextSelection(host: HTMLElement): string {
  const root = host.getRootNode() as
    Document | (ShadowRoot & { getSelection?: () => Selection | null });
  const selection = root.getSelection?.() ?? host.ownerDocument.getSelection();
  if (!selection?.rangeCount || selection.isCollapsed) {
    return '';
  }
  for (let index = 0; index < selection.rangeCount; index++) {
    if (selection.getRangeAt(index).intersectsNode(host)) {
      return selection.toString();
    }
  }
  return '';
}

function invocation(
  kind: ContextMenuInvocation['kind'],
  host: HTMLElement,
  { targetPath, composedPath }: ContextRoute,
): ContextMenuInvocation {
  const selection = contextSelection(host);
  return {
    kind,
    source: targetPath[0] ?? host,
    selection,
    native: Boolean(selection || composedPath.some(hasNativeContext)),
  };
}

interface Contact {
  readonly id: number;
  readonly host: HTMLElement;
  readonly x: number;
  readonly y: number;
  readonly touch: boolean;
  readonly stop: () => void;
  guard?: ((panel: HTMLElement) => () => void) | undefined;
}

function captureContact(contact: Contact, panel: HTMLElement): void {
  try {
    panel.setPointerCapture(contact.id);
  } catch {
    // Some browsers dispatch contextmenu after the pointer has already been released.
  }
}

export function useContextInvocation({ controller, context }: MenuContextValue): {
  onContextMenu: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
} {
  const contact = useRef<Contact | null>(null);
  const stopGuard = useRef<(() => void) | null>(null);
  const guardedContact = useRef<Contact | null>(null);
  const keyboard = useRef<{ source: Element; until: number; accepted: boolean } | null>(null);
  const policy = useRef(context);
  useIsoLayoutEffect(() => {
    policy.current = context;
  }, [context]);

  const cancel = (): void => {
    contact.current?.stop();
    stopGuard.current?.();
    keyboard.current = null;
  };
  useIsoLayoutEffect(
    () => () => {
      contact.current?.stop();
      stopGuard.current?.();
    },
    [],
  );

  const invoke = (snapshot: ContextMenuInvocation, origin: MenuOrigin): void => {
    policy.current?.onInvoke?.(snapshot);
    controller.request(origin);
  };

  function allows(snapshot: ContextMenuInvocation): boolean {
    return policy.current?.shouldOpen?.(snapshot) ?? !snapshot.native;
  }

  function guardRelease(current: Contact): void {
    const { host, id, touch } = current;
    const { ownerDocument: document } = host;
    const view = document.defaultView;
    if (!view) {
      return;
    }
    stopGuard.current?.();
    let captured: HTMLElement | undefined;
    let released = false;
    let timeout: number | undefined;
    const clear = (): void => {
      if (timeout !== undefined) {
        view.clearTimeout(timeout);
      }
      document.removeEventListener('pointerup', onRelease, true);
      document.removeEventListener('pointercancel', onCancel, true);
      document.removeEventListener('pointerdown', onNextPress, true);
      document.removeEventListener('mousedown', swallow, true);
      document.removeEventListener('click', swallow, true);
      document.removeEventListener('auxclick', swallow, true);
      if (captured?.hasPointerCapture(id)) {
        captured.releasePointerCapture(id);
      }
      if (stopGuard.current === clear) {
        guardedContact.current = null;
        stopGuard.current = null;
      }
    };
    const onRelease = (event: globalThis.PointerEvent): void => {
      if (event.pointerId === id) {
        released = true;
        event.stopPropagation();
        event.preventDefault();
        current.stop();
        // Wait for the compatibility mouse events only after the invoking contact ends.
        timeout = view.setTimeout(clear, touch ? 800 : 0);
      }
    };
    const onCancel = (event: globalThis.PointerEvent): void => {
      if (event.pointerId === id) {
        clear();
      }
    };
    const onNextPress = (event: globalThis.PointerEvent): void => {
      if (released || event.pointerId === id) {
        clear();
      }
    };
    const swallow = (event: globalThis.MouseEvent): void => {
      if (!released || (touch ? event.button !== 0 : event.button !== 2)) {
        return;
      }
      if (
        'pointerId' in event &&
        typeof event.pointerId === 'number' &&
        event.pointerId > 0 &&
        event.pointerId !== id
      ) {
        return;
      }
      const target = event.composedPath();
      if (
        event.detail === 0 ||
        (!target.includes(host) &&
          !target.includes(captured ?? host) &&
          Math.hypot(event.clientX - current.x, event.clientY - current.y) > 12)
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (event.type !== 'mousedown') {
        clear();
      }
    };
    document.addEventListener('pointerup', onRelease, true);
    document.addEventListener('pointercancel', onCancel, true);
    document.addEventListener('pointerdown', onNextPress, true);
    if (touch) {
      document.addEventListener('mousedown', swallow, true);
    }
    document.addEventListener('click', swallow, true);
    document.addEventListener('auxclick', swallow, true);
    guardedContact.current = current;
    stopGuard.current = clear;
    current.guard = (panel) => {
      captured = panel;
      captureContact(current, panel);
      return clear;
    };
  }

  return {
    onContextMenu(event) {
      const host = event.currentTarget;
      const native = event.nativeEvent;
      const path = route(native, host);
      if (!path) {
        return;
      }
      const pointerType = 'pointerType' in native ? native.pointerType : undefined;
      const paired = keyboard.current;
      if (
        (event.button === -1 || (event.button === 0 && !pointerType)) &&
        event.buttons === 0 &&
        event.detail === 0 &&
        paired &&
        event.timeStamp <= paired.until &&
        path.targetPath.includes(paired.source)
      ) {
        if (paired.accepted) {
          event.preventDefault();
        }
        keyboard.current = null;
        return;
      }
      if (event.shiftKey) {
        return;
      }
      const current = contact.current;
      if (current?.touch || pointerType === 'touch') {
        const held = guardedContact.current;
        const pointerId = 'pointerId' in native ? native.pointerId : undefined;
        const matchesContact =
          typeof pointerId === 'number' && pointerId >= 0
            ? pointerId === held?.id
            : current === held;
        if (held?.touch && matchesContact) {
          event.preventDefault();
        }
        return;
      }
      if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) {
        return;
      }
      const snapshot = invocation('pointer', host, path);
      if (!allows(snapshot)) {
        return;
      }
      event.preventDefault();
      if (current) {
        guardRelease(current);
      }
      invoke(snapshot, {
        owner: host,
        restore: pointerOrigin(host, path.targetPath),

        focus: 'panel',
        point: { x: event.clientX, y: event.clientY },
        capture: current?.guard,
      });
    },
    onKeyDown(event) {
      if (
        event.nativeEvent.isComposing ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        !(event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))
      ) {
        return;
      }
      const host = event.currentTarget;
      const path = route(event.nativeEvent, host);
      if (!path) {
        return;
      }
      const active = activeOrigin(host);
      const source = active ?? host;
      const snapshot = invocation('keyboard', host, path);
      const accepted = allows(snapshot);
      keyboard.current = { source, until: event.timeStamp + 500, accepted };
      if (!accepted) {
        return;
      }
      event.preventDefault();
      if (!event.repeat) {
        invoke(snapshot, { owner: source, restore: active, focus: 'first' });
      }
    },
    onPointerDown(event) {
      if (event.button !== 2 && event.pointerType !== 'touch') {
        return;
      }
      const host = event.currentTarget;
      const path = route(event.nativeEvent, host);
      const { ownerDocument: document } = host;
      const view = document.defaultView;
      const touch = event.pointerType === 'touch';
      if (
        !path ||
        !view ||
        (touch &&
          (!event.isPrimary ||
            !policy.current?.longPress ||
            path.targetPath.some((element) => element.matches('button, [role="button"]')) ||
            path.composedPath.some(hasNativeContext)))
      ) {
        return;
      }
      cancel();
      const { clientX: x, clientY: y, pointerId: id } = event;
      let timer: number | undefined;
      const onMove = (move: globalThis.PointerEvent): void => {
        if (touch && move.pointerId === id && Math.hypot(move.clientX - x, move.clientY - y) > 10) {
          current.stop();
        }
      };
      const onEnd = (end: globalThis.PointerEvent): void => {
        if (end.pointerId === id) {
          current.stop();
        }
      };
      const current: Contact = {
        id,
        host,
        x,
        y,
        touch,
        stop: () => {
          document.removeEventListener('pointermove', onMove, true);
          document.removeEventListener('pointerup', onEnd, true);
          document.removeEventListener('pointercancel', onEnd, true);
          view.removeEventListener('scroll', current.stop, true);
          if (timer !== undefined) {
            view.clearTimeout(timer);
          }
          if (contact.current === current) {
            contact.current = null;
          }
        },
      };
      document.addEventListener('pointermove', onMove, true);
      document.addEventListener('pointerup', onEnd, true);
      document.addEventListener('pointercancel', onEnd, true);
      view.addEventListener('scroll', current.stop, true);
      contact.current = current;
      if (touch) {
        timer = view.setTimeout(() => {
          const source = path.targetPath[0];
          if (
            contact.current !== current ||
            !source ||
            !available(source) ||
            !composedContains(host, source) ||
            !available(host) ||
            !policy.current?.longPress
          ) {
            current.stop();
            return;
          }
          const snapshot = invocation('touch', host, path);
          if (!allows(snapshot)) {
            current.stop();
            return;
          }
          guardRelease(current);
          invoke(snapshot, {
            owner: host,
            restore: pointerOrigin(host, path.targetPath),

            focus: 'panel',
            point: { x, y },
            capture: current.guard,
          });
        }, 500);
      }
    },
  };
}
