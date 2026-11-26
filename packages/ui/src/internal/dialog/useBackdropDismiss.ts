import { useRef } from 'react';
import type { HTMLAttributes, MouseEvent } from 'react';

type PointerHandlers = Pick<
  HTMLAttributes<HTMLDialogElement>,
  'onClick' | 'onPointerDown' | 'onPointerUp' | 'onPointerCancel'
>;

function outsideSurface(
  event: MouseEvent<HTMLDialogElement>,
  surface: HTMLDivElement | null,
): boolean {
  if (event.target !== event.currentTarget || !surface) {
    return false;
  }
  const { left, right, top, bottom } = surface.getBoundingClientRect();
  return (
    event.clientX < left || event.clientX >= right || event.clientY < top || event.clientY >= bottom
  );
}

export function useBackdropDismiss(
  surface: HTMLDivElement | null,
  canDismiss: boolean,
  dismiss: () => void,
  handlers: PointerHandlers,
): PointerHandlers {
  const press = useRef<number | undefined>(undefined);
  const released = useRef(false);
  return {
    onPointerDown(event) {
      handlers.onPointerDown?.(event);
      if (!event.isPrimary) {
        return;
      }
      press.current = undefined;
      released.current = false;
      if (!event.defaultPrevented && event.button === 0 && outsideSurface(event, surface)) {
        // The backdrop has no focus target. Keep the current editor selection.
        event.preventDefault();
        if (canDismiss) {
          press.current = event.pointerId;
        }
      }
    },
    onPointerUp(event) {
      handlers.onPointerUp?.(event);
      if (press.current === event.pointerId) {
        press.current = undefined;
        released.current =
          !event.defaultPrevented && event.button === 0 && outsideSurface(event, surface);
      }
    },
    onPointerCancel(event) {
      handlers.onPointerCancel?.(event);
      if (press.current === event.pointerId) {
        press.current = undefined;
        released.current = false;
      }
    },
    onClick(event) {
      handlers.onClick?.(event);
      if (!released.current) {
        return;
      }
      released.current = false;
      if (
        !event.defaultPrevented &&
        event.detail > 0 &&
        canDismiss &&
        outsideSurface(event, surface)
      ) {
        event.preventDefault();
        dismiss();
      }
    },
  };
}
