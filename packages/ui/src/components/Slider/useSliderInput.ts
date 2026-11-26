import { useInsertionEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, RefObject } from 'react';
import { flushSync } from 'react-dom';
import { getComposedParentElement, isInertElement } from '../../core/dom.js';
import { observeControlPath } from '../../core/forms/observeControlPath.js';
import type { FormValueState } from '../../core/forms/useFormValue.js';
import { subscribeFocusOrigin } from '../../core/focus-origin.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { equalValues, moveThumb, thumbBounds } from './scale.js';
import type { SliderScale, SliderValues } from './scale.js';
import type { SliderOrientation } from './types.js';
import type { SliderInputs, Thumb } from './useSliderForm.js';

interface SliderInputOptions {
  readonly inputs: SliderInputs;
  readonly root: RefObject<HTMLDivElement | null>;
  readonly rail: RefObject<HTMLDivElement | null>;
  readonly orientation: SliderOrientation;
  readonly scale: SliderScale;
  readonly form: FormValueState<SliderValues>;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly onCommit: ((value: SliderValues) => void) | undefined;
}

interface SliderInputState {
  readonly disabled: boolean;
  readonly onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  readonly onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  readonly onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  readonly onPointerLeave: (event: PointerEvent<HTMLDivElement>) => void;
  readonly onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  readonly onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
  readonly onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => void;
}

interface Movement {
  readonly input: HTMLInputElement;
  readonly formOwner: HTMLFormElement | null;
  readonly scale: SliderScale;
  readonly orientation: SliderOrientation;
  readonly direction: string;
  readonly initial: SliderValues;
  accepted: SliderValues;
  candidate?: SliderValues;
  finishRequested?: boolean;
}

type Session = Movement &
  (
    | { readonly kind: 'keyboard' | 'native' }
    | {
        readonly kind: 'pointer';
        readonly id: number;
        readonly rail: HTMLDivElement;
        readonly anchor: number;
        readonly offset: number;
        thumb: Thumb | undefined;
        focused: HTMLInputElement;
        stopWatching?: () => void;
      }
  );

interface RailGeometry {
  readonly coordinate: number;
  readonly length: number;
  readonly inset: number;
  readonly pixel: number;
}

function elementStyle(element: HTMLElement): CSSStyleDeclaration | undefined {
  return element.ownerDocument.defaultView?.getComputedStyle(element);
}

function directionOf(element: HTMLElement): string {
  return elementStyle(element)?.direction || 'ltr';
}

function measureRail(
  element: HTMLDivElement,
  vertical: boolean,
  event: PointerEvent<HTMLDivElement>,
): RailGeometry | undefined {
  const rect = element.getBoundingClientRect();
  const style = elementStyle(element);
  const length = Number.parseFloat(vertical ? (style?.height ?? '') : (style?.width ?? ''));
  const short = Number.parseFloat(style?.getPropertyValue('--_slider-short') ?? '');
  const visibleLength = vertical ? rect.height : rect.width;
  if (!visibleLength || !(length > short)) {
    return undefined;
  }

  let position = event.clientX - rect.left;
  if (vertical) {
    position = rect.bottom - event.clientY;
  } else if (style?.direction === 'rtl') {
    position = rect.right - event.clientX;
  }
  const pixel = length / visibleLength;
  return { coordinate: position * pixel, length, inset: short / 2, pixel };
}

function station(geometry: RailGeometry, index: number, count: number): number {
  const { inset, length } = geometry;
  return inset + (count === 0 ? 0 : index / count) * (length - 2 * inset);
}

function keyboardIndex(
  key: string,
  index: number,
  bounds: readonly [number, number],
  count: number,
  reverse: boolean,
): number | undefined {
  const page = Math.max(1, Math.round(count / 10));
  switch (key) {
    case 'ArrowUp':
      return index + 1;
    case 'ArrowDown':
      return index - 1;
    case 'ArrowLeft':
      return index + (reverse ? 1 : -1);
    case 'ArrowRight':
      return index + (reverse ? -1 : 1);
    case 'Home':
      return bounds[0];
    case 'End':
      return bounds[1];
    case 'PageUp':
      return index + page;
    case 'PageDown':
      return index - page;
    default:
      return undefined;
  }
}

function closestThumb(coordinate: number, lower: number, upper: number): Thumb {
  return Math.abs(coordinate - lower) < Math.abs(coordinate - upper) ? 0 : 1;
}

function directThumb(inputs: SliderInputs, target: EventTarget): Thumb | undefined {
  if (inputs[0].current?.parentElement?.contains(target as Node)) {
    return 0;
  }
  if (inputs[1].current?.parentElement?.contains(target as Node)) {
    return 1;
  }
  return undefined;
}

function available(options: SliderInputOptions, input: HTMLInputElement): boolean {
  return (
    input.isConnected &&
    !options.disabled &&
    !options.readOnly &&
    !input.matches(':disabled') &&
    !options.root.current?.hasAttribute('hidden') &&
    !isInertElement(input)
  );
}

export function useSliderInput(
  options: SliderInputOptions,
  resetRef: RefObject<(() => void) | null>,
): SliderInputState {
  const config = useRef(options);
  const session = useRef<Session | null>(null);
  const delivery = useRef<Session | null>(null);
  const [nativeDisabled, setNativeDisabled] = useState(false);
  const { inputs, root, rail } = options;

  useInsertionEffect(() => {
    config.current = options;
  });

  function clear(current: Session): void {
    if (session.current !== current) {
      return;
    }
    session.current = null;
    if (current.kind === 'pointer') {
      current.stopWatching?.();
      current.rail.removeAttribute('data-unica-slider-dragging');
      for (const node of inputs) {
        node.current?.parentElement?.removeAttribute('data-unica-slider-active');
      }
      if (current.rail.hasPointerCapture(current.id)) {
        current.rail.releasePointerCapture(current.id);
      }
    }
  }

  function abort(): void {
    if (session.current) {
      clear(session.current);
    }
  }

  function reconcile(current: Session): boolean {
    if (session.current !== current) {
      return false;
    }
    const { scale, orientation, form } = config.current;
    const value = form.read();
    const live = current.kind === 'pointer' ? current.focused : current.input;
    if (
      !available(config.current, live) ||
      current.scale !== scale ||
      current.orientation !== orientation ||
      current.formOwner !== live.form ||
      current.direction !== directionOf(live) ||
      (current.kind === 'pointer' &&
        (!current.rail.getClientRects().length ||
          elementStyle(current.rail)?.visibility === 'hidden'))
    ) {
      clear(current);
      return false;
    }
    if (delivery.current !== current && !equalValues(value, current.accepted)) {
      clear(current);
      return false;
    }
    return true;
  }

  function movement(input: HTMLInputElement): Movement {
    const { form, scale, orientation } = config.current;
    const initial = form.read();
    return {
      input,
      formOwner: input.form,
      scale,
      orientation,
      direction: directionOf(input),
      initial,
      accepted: initial,
    };
  }

  function propose(current: Session, next: SliderValues, source: HTMLInputElement): void {
    if (!reconcile(current)) {
      return;
    }
    const { form, onCommit } = config.current;
    if (
      equalValues(next, form.read()) ||
      (current.candidate && equalValues(next, current.candidate))
    ) {
      return;
    }
    current.candidate = next;
    const previous = current.accepted;
    const outer = delivery.current;
    delivery.current = current;
    try {
      // Drag history also drives Escape rollback when no commit callback is supplied.
      if (form.controlled && (onCommit || current.kind === 'pointer')) {
        flushSync(() => form.propose(next, source));
      } else {
        form.propose(next, source);
      }
    } finally {
      delivery.current = outer;
    }
    config.current.form.settleReset();
    if (session.current !== current) {
      return;
    }
    const accepted = config.current.form.read();
    if (equalValues(accepted, next)) {
      current.accepted = accepted;
    } else if (!equalValues(accepted, previous)) {
      clear(current);
    }
    if (current.finishRequested) {
      finish(current);
    }
  }

  function finish(current: Session): void {
    config.current.form.settleReset();
    if (!reconcile(current)) {
      return;
    }
    if (delivery.current === current) {
      // Native blur or change can arrive synchronously from onValueChange.
      current.finishRequested = true;
      return;
    }
    clear(current);
    const { onCommit } = config.current;
    if (onCommit && !equalValues(current.initial, current.accepted)) {
      onCommit(current.accepted);
      config.current.form.settleReset();
    }
  }

  function cancel(current: Session): void {
    config.current.form.settleReset();
    if (!reconcile(current)) {
      return;
    }
    clear(current);
    const { form } = config.current;
    if (!equalValues(form.read(), current.initial)) {
      form.propose(current.initial, current.input);
    }
  }

  function pointerSession(
    event: PointerEvent<HTMLDivElement>,
  ): Extract<Session, { kind: 'pointer' }> | undefined {
    const current = session.current;
    return current?.kind === 'pointer' && current.id === event.pointerId ? current : undefined;
  }

  function focusThumb(
    current: Extract<Session, { kind: 'pointer' }>,
    thumb: Thumb,
    active: boolean,
  ): void {
    const input = inputs[thumb].current;
    if (!input) {
      return;
    }
    current.focused = input;
    if (active) {
      input.parentElement?.setAttribute('data-unica-slider-active', '');
    }
    input.focus({ preventScroll: true });
    config.current.form.settleReset();
  }

  function watchPointer(current: Extract<Session, { kind: 'pointer' }>): () => void {
    const view = current.rail.ownerDocument.defaultView;
    const check = (): void => {
      reconcile(current);
    };
    const observer = view ? new view.MutationObserver(check) : undefined;
    observer?.observe(current.rail.getRootNode(), {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['disabled', 'inert', 'hidden', 'dir', 'form', 'id', 'open'],
    });
    for (
      let ancestor = getComposedParentElement(current.rail);
      ancestor;
      ancestor = getComposedParentElement(ancestor)
    ) {
      observer?.observe(ancestor, {
        attributes: true,
        attributeFilter: ['class', 'style', 'dir', 'hidden', 'inert'],
      });
    }
    // Losing window focus can leave the document active element in place.
    view?.addEventListener('blur', abort);
    return () => {
      observer?.disconnect();
      view?.removeEventListener('blur', abort);
    };
  }

  function movePointer(
    current: Extract<Session, { kind: 'pointer' }>,
    geometry: RailGeometry,
  ): void {
    if (!reconcile(current)) {
      return;
    }
    if (current.thumb === undefined) {
      if (geometry.coordinate === current.anchor) {
        return;
      }
      current.thumb = geometry.coordinate < current.anchor ? 0 : 1;
      focusThumb(current, current.thumb, true);
      if (!reconcile(current)) {
        return;
      }
    }
    const { inset, length, coordinate } = geometry;
    const scale = current.scale;
    const index = scale.indexAtFraction(
      (coordinate - inset - current.offset) / (length - 2 * inset),
    );
    propose(
      current,
      moveThumb(scale, config.current.form.read(), current.thumb, index),
      current.focused,
    );
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>): void {
    config.current.form.settleReset();
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      !event.isPrimary ||
      session.current?.kind === 'pointer'
    ) {
      return;
    }
    const hit = event.currentTarget;
    const first = inputs[0].current;
    if (!first || !available(config.current, first)) {
      return;
    }

    if (session.current) {
      finish(session.current);
    }
    if (session.current || !available(config.current, first)) {
      return;
    }
    const { form, scale, orientation } = config.current;
    const geometry = measureRail(hit, orientation === 'vertical', event);
    if (!geometry) {
      return;
    }
    const value = form.read();
    const lower = station(geometry, scale.indexOf(value[0]), scale.count);
    const upper =
      value[1] === undefined ? lower : station(geometry, scale.indexOf(value[1]), scale.count);
    const grabbed = directThumb(inputs, event.target);
    const onCap = grabbed !== undefined;
    const coordinate = geometry.coordinate;
    let thumb: Thumb | undefined = 0;
    if (value[1] !== undefined) {
      if (onCap) {
        thumb = grabbed;
      } else if (lower === upper) {
        // A shared center can land between reported pointer coordinates.
        thumb =
          Math.abs(coordinate - lower) < geometry.pixel ? undefined : coordinate < lower ? 0 : 1;
      } else {
        thumb = closestThumb(coordinate, lower, upper);
      }
    }
    const focus = thumb ?? (value[0] === scale.maximum ? 0 : 1);
    const input = inputs[focus].current ?? first;
    if (!available(config.current, input)) {
      return;
    }

    try {
      hit.setPointerCapture(event.pointerId);
    } catch {
      // The pointer can already be gone, including script-dispatched events.
      return;
    }
    event.preventDefault();
    const current: Extract<Session, { kind: 'pointer' }> = {
      ...movement(input),
      kind: 'pointer',
      thumb,
      focused: input,
      rail: hit,
      id: event.pointerId,
      anchor: coordinate,
      offset: onCap
        ? coordinate - (thumb === 0 ? lower : upper)
        : thumb === undefined
          ? coordinate - lower
          : 0,
    };
    session.current = current;
    hit.setAttribute('data-unica-slider-dragging', '');
    current.stopWatching = watchPointer(current);
    focusThumb(current, focus, thumb !== undefined);
    if (!onCap && thumb !== undefined) {
      movePointer(current, geometry);
    }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>): void {
    config.current.form.settleReset();
    const current = pointerSession(event);
    const { scale, orientation, form } = config.current;
    const hit = event.currentTarget;
    if (current) {
      const geometry = measureRail(hit, orientation === 'vertical', event);
      if (geometry) {
        movePointer(current, geometry);
      }
      return;
    }
    if (session.current?.kind === 'pointer' || event.pointerType !== 'mouse') {
      return;
    }
    const value = form.read();
    const geometry =
      value[1] === undefined ? undefined : measureRail(hit, orientation === 'vertical', event);
    const thumb =
      directThumb(inputs, event.target) ??
      (geometry && value[1] !== undefined
        ? closestThumb(
            geometry.coordinate,
            station(geometry, scale.indexOf(value[0]), scale.count),
            station(geometry, scale.indexOf(value[1]), scale.count),
          )
        : 0);
    const hovered = String(thumb);
    if (hit.getAttribute('data-unica-slider-hover') !== hovered) {
      hit.setAttribute('data-unica-slider-hover', hovered);
    }
  }

  function onPointerLeave(event: PointerEvent<HTMLDivElement>): void {
    event.currentTarget.removeAttribute('data-unica-slider-hover');
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>): void {
    const current = pointerSession(event);
    if (current && event.button === 0) {
      finish(current);
    }
  }

  function onPointerCancel(event: PointerEvent<HTMLDivElement>): void {
    const current = pointerSession(event);
    if (current) {
      cancel(current);
    }
  }

  function keyboardTarget(
    control: HTMLInputElement,
    thumb: Thumb,
    key: string,
  ): number | undefined {
    const { scale, form, orientation } = config.current;
    const value = form.read();
    return keyboardIndex(
      key,
      scale.indexOf(value[thumb]!),
      thumbBounds(scale, value, thumb),
      scale.count,
      orientation === 'horizontal' && directionOf(control) === 'rtl',
    );
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>): void {
    const input = event.target;
    const thumb = input === inputs[0].current ? 0 : input === inputs[1].current ? 1 : undefined;
    if (thumb === undefined || event.defaultPrevented || event.nativeEvent.isComposing) {
      return;
    }
    config.current.form.settleReset();
    const control = inputs[thumb].current;
    if (!control) {
      return;
    }
    const current = session.current;
    if (event.key === 'Escape' && current?.kind === 'pointer') {
      if (reconcile(current)) {
        event.preventDefault();
        event.stopPropagation();
        cancel(current);
      }
      return;
    }

    let index = keyboardTarget(control, thumb, event.key);
    if (index === undefined) {
      return;
    }
    event.preventDefault();
    if (
      (current?.kind === 'pointer' && reconcile(current)) ||
      !available(config.current, control)
    ) {
      return;
    }
    if (current?.kind === 'native') {
      finish(current);
      // Completing the native edit can synchronously replace the grid.
      index = keyboardTarget(control, thumb, event.key);
    }
    if (index === undefined || !available(config.current, control)) {
      return;
    }
    const next: Session = { ...movement(control), kind: 'keyboard' };
    session.current = next;
    try {
      propose(
        next,
        moveThumb(config.current.scale, config.current.form.read(), thumb, index),
        control,
      );
      finish(next);
    } finally {
      clear(next);
    }
  }

  function nativeEdit(input: HTMLInputElement, thumb: Thumb, event: Event): void {
    const beforeReset = session.current;
    const candidate = input.valueAsNumber;
    config.current.form.settleReset();
    const { form, scale } = config.current;
    const current = session.current;
    if (
      current?.kind === 'pointer' ||
      (event.type === 'change' && beforeReset?.input === input && beforeReset !== current) ||
      !available(config.current, input) ||
      !Number.isFinite(candidate)
    ) {
      form.repair();
      if (current) {
        reconcile(current);
      }
      return;
    }

    if (current?.kind === 'native' && current.input === input && reconcile(current)) {
      form.repair();
      if (event.type === 'change') {
        finish(current);
      } else {
        propose(current, moveThumb(scale, form.read(), thumb, scale.indexOf(candidate)), input);
      }
      return;
    }

    if (current) {
      clear(current);
    }
    const next: Session = { ...movement(input), kind: 'native' };
    session.current = next;
    form.repair();
    propose(next, moveThumb(scale, form.read(), thumb, scale.indexOf(candidate)), input);
    if (event.type === 'change') {
      finish(next);
    }
  }

  useIsoLayoutEffect(() => {
    const first = inputs[0].current;
    const node = root.current;
    if (!first || !node) {
      return;
    }
    const updateDisabled = (): void => {
      setNativeDisabled(first.matches(':disabled'));
    };
    function onClick(event: MouseEvent): void {
      // A native label focuses the range. Its forwarded click must not move it.
      event.preventDefault();
      if (!first!.matches(':disabled') && !isInertElement(first!)) {
        first!.focus({ preventScroll: true });
      }
    }
    const stopObserving = observeControlPath(first, updateDisabled);
    const detachInputs = ([0, 1] as const).map((thumb) => {
      const input = inputs[thumb].current;
      if (!input) {
        return undefined;
      }
      const onEdit = (event: Event): void => nativeEdit(input, thumb, event);
      const onBlur = (): void => {
        const current = session.current;
        if (current?.kind === 'pointer' && current.focused === input) {
          clear(current);
        } else if (current?.kind === 'native' && current.input === input) {
          finish(current);
        }
      };
      input.addEventListener('input', onEdit);
      input.addEventListener('change', onEdit);
      input.addEventListener('blur', onBlur);
      const detachFocus = subscribeFocusOrigin(input, (origin) => {
        input.parentElement?.toggleAttribute(
          'data-unica-slider-focus',
          origin !== null && origin !== 'pointer',
        );
      });
      return () => {
        input.removeEventListener('input', onEdit);
        input.removeEventListener('change', onEdit);
        input.removeEventListener('blur', onBlur);
        detachFocus();
      };
    });
    // Label activation has no pointerdown on the carrier.
    if (!inputs[1].current) {
      first.addEventListener('click', onClick);
    }
    resetRef.current = abort;
    return () => {
      abort();
      stopObserving();
      first.removeEventListener('click', onClick);
      for (const detach of detachInputs) {
        detach?.();
      }
      resetRef.current = null;
    };
  }, [inputs, rail, resetRef, root]);

  useIsoLayoutEffect(() => {
    const first = inputs[0].current;
    if (first) {
      setNativeDisabled(first.matches(':disabled'));
    }
  }, [inputs, options.disabled]);

  useIsoLayoutEffect(() => {
    if (session.current) {
      reconcile(session.current);
    }
  });

  return {
    disabled: options.disabled || nativeDisabled,
    onKeyDown,
    onPointerDown,
    onPointerMove,
    onPointerLeave,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture: onPointerCancel,
  };
}
