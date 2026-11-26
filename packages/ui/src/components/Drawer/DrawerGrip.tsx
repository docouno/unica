import { useRef } from 'react';
import type { PointerEvent, ReactElement } from 'react';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';

interface GripProps {
  readonly dialog: HTMLDialogElement | null;
  readonly surface: HTMLDivElement | null;
  readonly onDismiss: () => void;
}

interface Drag {
  readonly id: number;
  readonly start: number;
  readonly time: number;
  readonly scale: number;
  readonly height: number;
  readonly grip: HTMLDivElement;
  readonly dialog: HTMLDialogElement;
}

function clearDrag(drag: Drag): void {
  const { dialog, grip, id } = drag;
  dialog.removeAttribute('data-unica-dialog-dragging');
  dialog.style.removeProperty('--_dialog-drag-distance');
  dialog.style.removeProperty('--_dialog-drag-opacity');
  if (grip.hasPointerCapture(id)) {
    grip.releasePointerCapture(id);
  }
}

function travel(drag: Drag, clientY: number): number {
  return Math.max(0, (clientY - drag.start) / drag.scale);
}

/** Pointer-only grab region. The dialog's visible Close supplies the keyboard action. */
export function DrawerGrip({ dialog, surface, onDismiss }: GripProps): ReactElement {
  const gesture = useRef<Drag | null>(null);

  useIsoLayoutEffect(
    () => () => {
      if (gesture.current) {
        const drag = gesture.current;
        gesture.current = null;
        clearDrag(drag);
      }
    },
    [dialog, surface],
  );

  const stop = (event: PointerEvent<HTMLDivElement>): Drag | null => {
    const drag = gesture.current;
    if (!drag || drag.id !== event.pointerId) {
      return null;
    }
    gesture.current = null;
    clearDrag(drag);
    return drag;
  };

  return (
    <div
      className="unica-drawer-grip"
      aria-hidden="true"
      onPointerDown={(event) => {
        if (
          !event.isPrimary ||
          event.button !== 0 ||
          gesture.current ||
          !dialog ||
          !surface ||
          event.defaultPrevented
        ) {
          return;
        }
        const { currentTarget: grip, pointerId: id } = event;
        const height = surface.offsetHeight;
        if (height === 0) {
          return;
        }
        try {
          grip.setPointerCapture(id);
        } catch {
          // There is no active native pointer to track.
          return;
        }
        event.preventDefault();
        gesture.current = {
          id,
          start: event.clientY,
          time: event.timeStamp,
          scale: surface.getBoundingClientRect().height / height || 1,
          height,
          grip,
          dialog,
        };
        dialog.setAttribute('data-unica-dialog-dragging', '');
      }}
      onPointerMove={(event) => {
        const drag = gesture.current;
        if (!drag || drag.id !== event.pointerId) {
          return;
        }
        const distance = travel(drag, event.clientY);
        const opacity = Math.max(0.45, 1 - distance / drag.height);
        drag.dialog.style.setProperty('--_dialog-drag-distance', `${distance}px`);
        drag.dialog.style.setProperty('--_dialog-drag-opacity', String(opacity));
      }}
      onPointerUp={(event) => {
        const drag = stop(event);
        if (!drag) {
          return;
        }
        const distance = travel(drag, event.clientY);
        const threshold = Math.min(120, drag.height * 0.3);
        const speed = distance / Math.max(1, event.timeStamp - drag.time);
        if (distance >= threshold || (distance >= 32 && speed >= 0.55)) {
          onDismiss();
        }
      }}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
    >
      <span />
    </div>
  );
}
