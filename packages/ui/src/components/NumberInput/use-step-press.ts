import { useCallback, useRef } from 'react';
import type { MouseEvent, PointerEvent, RefObject } from 'react';
import { getDeepActiveElement, getDefaultView } from '../../core/dom.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import type { Direction } from './step.js';
import { canEditNumber } from './use-number-value.js';

interface StepPress {
  readonly button: HTMLButtonElement;
  readonly pointerId: number;
  readonly pointerType: string;
  readonly canContinue: () => boolean;
  cancelTimer: () => void;
  detach: () => void;
  canceled: boolean;
  repeated: boolean;
}

interface StepPressOptions {
  readonly input: RefObject<HTMLInputElement | null>;
  readonly settleReset: () => void;
  readonly step: (direction: Direction) => boolean;
  readonly canStep: (direction: Direction) => boolean;
}

interface StepPressControls {
  readonly cancel: () => void;
  readonly start: (event: PointerEvent<HTMLButtonElement>, direction: Direction) => void;
  readonly loseCapture: (event: PointerEvent<HTMLButtonElement>) => void;
  readonly click: (event: MouseEvent<HTMLButtonElement>, direction: Direction) => void;
}

export function useStepPress(options: RefObject<StepPressOptions | null>): StepPressControls {
  const contact = useRef<StepPress | null>(null);
  const released = useRef<StepPress | null>(null);
  const cancel = useCallback(() => {
    const press = contact.current ?? released.current;
    if (press) {
      press.canceled = true;
      press.cancelTimer();
    }
  }, []);
  useIsoLayoutEffect(
    () => () => {
      contact.current?.detach();
      contact.current = null;
      released.current = null;
    },
    [],
  );

  function stepFromAction(direction: Direction, mouse: boolean): boolean {
    const config = options.current;
    const node = config?.input.current;
    if (!config || !node) {
      return false;
    }
    const doc = node.ownerDocument;
    const focused = mouse ? getDeepActiveElement(doc) : null;
    const owner = node.form;
    const stepped = config.step(direction);
    if (stepped && mouse) {
      // An observer can move focus, disable the field, or replace the editor.
      // Wait for its discrete React update before restoring pointer focus.
      queueMicrotask(() => {
        if (
          options.current?.input.current === node &&
          node.form === owner &&
          node.ownerDocument === doc &&
          canEditNumber(node) &&
          getDeepActiveElement(doc) === focused
        ) {
          node.focus({ preventScroll: true });
        }
      });
    }
    return stepped;
  }

  return {
    cancel,
    start(event, direction) {
      const button = event.currentTarget;
      const config = options.current;
      const node = config?.input.current;
      const view = getDefaultView(button.ownerDocument);
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }
      event.preventDefault();
      if (!event.isPrimary || !config || !node || !view || !canEditNumber(node)) {
        return;
      }
      const previous = contact.current;
      if (previous) {
        // An interrupted window can miss pointerup. A fresh primary down
        // of that pointer type supersedes the canceled contact.
        if (!previous.canceled || previous.pointerType !== event.pointerType) {
          return;
        }
        previous.detach();
        contact.current = null;
      }
      released.current = null;
      config.settleReset();
      const owner = node.form;
      const domain = [node.min, node.max, node.step];
      const { pointerId, pointerType } = event;
      const canContinue = (): boolean =>
        config.input.current === node &&
        node.form === owner &&
        domain[0] === node.min &&
        domain[1] === node.max &&
        domain[2] === node.step &&
        !button.matches(':disabled') &&
        canEditNumber(node);
      let timer: number | undefined;
      const press: StepPress = {
        button,
        pointerId,
        pointerType,
        canContinue,
        canceled: false,
        repeated: false,
        cancelTimer() {
          view.clearTimeout(timer);
          timer = undefined;
        },
        detach() {
          press.cancelTimer();
          view.removeEventListener('pointerup', finish, true);
          view.removeEventListener('pointermove', finish, true);
          view.removeEventListener('pointercancel', finish, true);
          view.removeEventListener('blur', blur);
          view.removeEventListener('contextmenu', cancel, true);
        },
      };

      function endContact(): void {
        press.detach();
        contact.current = null;
        released.current = press;
      }

      function blur(): void {
        cancel();
        endContact();
      }

      function finish(event: globalThis.PointerEvent): void {
        if (
          contact.current !== press ||
          event.pointerId !== pointerId ||
          (event.type === 'pointermove' && (event.buttons & 1) !== 0)
        ) {
          return;
        }
        config?.settleReset();
        press.canceled ||= event.type === 'pointercancel' || !canContinue();
        endContact();
      }

      function repeat(): void {
        options.current?.settleReset();
        if (timer === undefined || contact.current !== press || !canContinue()) {
          cancel();
          return;
        }
        // Arm before the step, so callbacks that cancel the contact also clear
        // the release click. Each tick starts from the latest committed DOM.
        timer = view!.setTimeout(repeat, 100);
        press.repeated = true;
        if (!stepFromAction(direction, pointerType === 'mouse')) {
          cancel();
          return;
        }
        // Wait for the native edit and its React owner's decision before
        // testing the edge. A refused proposal leaves the previous step available.
        queueMicrotask(() => {
          if (contact.current === press && !options.current?.canStep(direction)) {
            cancel();
          }
        });
      }

      contact.current = press;
      view.addEventListener('pointerup', finish, true);
      // Chorded mouse buttons can release the primary bit in pointermove
      // while the pointer itself stays active until the last button goes up.
      view.addEventListener('pointermove', finish, true);
      view.addEventListener('pointercancel', finish, true);
      view.addEventListener('blur', blur);
      view.addEventListener('contextmenu', cancel, true);
      if (event.nativeEvent.isTrusted) {
        button.setPointerCapture(pointerId);
      }
      timer = view.setTimeout(repeat, 450);
    },
    loseCapture(event) {
      if (contact.current?.pointerId === event.pointerId) {
        cancel();
      }
    },
    click(event, direction) {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }
      const { nativeEvent } = event;
      const pointerId = 'pointerId' in nativeEvent ? nativeEvent.pointerId : undefined;
      const isPointerClick = event.detail > 0 || (typeof pointerId === 'number' && pointerId >= 0);
      if (isPointerClick) {
        options.current?.settleReset();
        const press = released.current;
        if (contact.current) {
          return;
        }
        if (
          !press ||
          press.button !== event.currentTarget ||
          (pointerId !== undefined && pointerId !== press.pointerId)
        ) {
          return;
        }
        released.current = null;
        if (!press.canceled && !press.repeated && press.canContinue()) {
          stepFromAction(direction, press.pointerType === 'mouse');
        }
      } else {
        stepFromAction(direction, false);
      }
    },
  };
}

export type { StepPressOptions };
