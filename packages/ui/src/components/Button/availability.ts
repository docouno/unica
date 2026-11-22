import type { DOMAttributes, EventHandler, KeyboardEvent, MouseEvent, SyntheticEvent } from 'react';

const clicks = [
  'onClick',
  'onClickCapture',
  'onAuxClick',
  'onAuxClickCapture',
  'onDoubleClick',
  'onDoubleClickCapture',
] as const;

const pointerHandlers = [
  'onMouseDown',
  'onMouseDownCapture',
  'onMouseUp',
  'onMouseUpCapture',
  'onPointerDown',
  'onPointerDownCapture',
  'onPointerUp',
  'onPointerUpCapture',
  'onTouchStart',
  'onTouchStartCapture',
  'onTouchEnd',
  'onTouchEndCapture',
  'onContextMenu',
  'onContextMenuCapture',
] as const;

const keyboardHandlers = [
  'onKeyDown',
  'onKeyDownCapture',
  'onKeyUp',
  'onKeyUpCapture',
  'onKeyPress',
  'onKeyPressCapture',
] as const;

type ActivationHandler =
  (typeof clicks)[number] | (typeof pointerHandlers)[number] | (typeof keyboardHandlers)[number];

export function guardActivation<T extends HTMLElement>(
  props: Pick<DOMAttributes<T>, ActivationHandler>,
  unavailable: (host: T) => boolean,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const name of clicks) {
    const handler = props[name];
    if (handler || name.endsWith('Capture')) {
      result[name] = (event: MouseEvent<T>) => {
        if (unavailable(event.currentTarget)) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        handler?.(event);
      };
    }
  }

  for (const name of pointerHandlers) {
    const handler: EventHandler<SyntheticEvent<T>> | undefined = props[name];
    if (handler) {
      result[name] = (event: SyntheticEvent<T>) => {
        if (!unavailable(event.currentTarget)) {
          handler(event);
        }
      };
    }
  }

  for (const name of keyboardHandlers) {
    const handler = props[name];
    if (handler || name === 'onKeyDownCapture') {
      result[name] = (event: KeyboardEvent<T>) => {
        const { key } = event;
        if (!unavailable(event.currentTarget) || key === 'Tab' || key === 'Escape') {
          handler?.(event);
        } else if (key === 'Enter' || key === ' ') {
          event.preventDefault();
        }
      };
    }
  }

  return result;
}
