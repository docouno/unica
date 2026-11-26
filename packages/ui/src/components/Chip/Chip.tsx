import { useId, useInsertionEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ReactElement, ReactNode } from 'react';
import { afterDispatch } from '../../core/activation.js';
import { cx, dataFlag } from '../../core/cx.js';
import { getDefaultView, isInertElement, matchesSafe } from '../../core/dom.js';
import { FormInput, writeInputChecked } from '../../core/forms/carriers.js';
import type { FormInputProps } from '../../core/forms/carriers.js';
import { useFormValue } from '../../core/forms/useFormValue.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { Glyph } from '../../internal/glyphs/index.js';
import { Icon } from '../Icon/index.js';
import { Tooltip } from '../Tooltip/index.js';
import type { ChipProps } from './types.js';
import './chip.css';

interface ChipControlProps extends Omit<FormInputProps, 'children' | 'size'> {
  readonly children: ReactNode;
  readonly textValue?: string | undefined;
  readonly size: NonNullable<ChipProps['size']>;
  readonly iconLeft?: ChipProps['iconLeft'];
  readonly rootData?: Record<string, unknown> | undefined;
  readonly settleReset: () => void;
  readonly repair: () => void;
  readonly select: (input: HTMLInputElement, next: boolean) => boolean;
}

interface Activation {
  readonly click: Event;
  readonly checked: boolean;
  change?: ChangeEvent<HTMLInputElement>;
}

export function ChipControl({
  children,
  textValue,
  size,
  iconLeft,
  settleReset,
  repair,
  select,
  controlled,
  className,
  style,
  hidden,
  rootData,
  id,
  ref,
  onChange,
  ...attrs
}: ChipControlProps): ReactElement {
  const generated = useId();
  const inputId = id ?? generated;
  const input = useRef<HTMLInputElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const inputRef = useMemo(() => mergeRefs(input, ref), [ref]);
  const [clipped, setClipped] = useState(false);
  const text = typeof children === 'string' ? children : (textValue ?? '');
  const current = useRef({ controlled, settleReset, repair, select, onChange });
  const activation = useRef<Activation | undefined>(undefined);

  useInsertionEffect(() => {
    current.current = { controlled, settleReset, repair, select, onChange };
  });

  useIsoLayoutEffect(() => {
    const element = label.current;
    if (!element) {
      return;
    }
    const measure = (): void => {
      setClipped(element.clientWidth > 0 && element.scrollWidth > element.clientWidth);
    };
    const Observer = element.ownerDocument.defaultView?.ResizeObserver;
    const resize = Observer && new Observer(measure);
    const fonts = element.ownerDocument.fonts;
    resize?.observe(element);
    fonts?.addEventListener('loadingdone', measure);
    measure();
    return () => {
      resize?.disconnect();
      fonts?.removeEventListener('loadingdone', measure);
    };
  }, [children, text]);

  useIsoLayoutEffect(() => {
    const element = input.current;
    const view = element && getDefaultView(element.ownerDocument);
    const checkedDescriptor =
      view && Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'checked');
    const Mouse = view?.MouseEvent;
    if (!element || !Mouse || !checkedDescriptor?.set) {
      return;
    }
    const control = element;
    const MouseEventConstructor = Mouse;
    const blocked = (): boolean => matchesSafe(control, ':disabled') || isInertElement(control);

    function finish(pending: Activation): void {
      if (activation.current !== pending || input.current !== control) {
        return;
      }
      activation.current = undefined;
      const config = current.current;
      if (pending.click.defaultPrevented || blocked()) {
        config.repair();
        return;
      }
      const { change } = pending;
      if (config.select(control, pending.checked) && change && config.onChange) {
        // React extracts this event from click, before a bubbling handler can veto it.
        // Deliver it only after that native dispatch has finished.
        const previous = change.currentTarget;
        change.currentTarget = control;
        try {
          current.current.onChange?.(change);
        } finally {
          change.currentTarget = previous;
        }
      }
    }

    function click(event: Event): void {
      if (!(event instanceof MouseEventConstructor)) {
        return;
      }
      if (blocked()) {
        event.preventDefault();
        return;
      }
      const config = current.current;
      if (control.type === 'checkbox') {
        // Reset bypasses React's checked tracker. Undo preactivation before the reset
        // witness reads the DOM, then reapply it without changing the tracker.
        writeInputChecked(control, !control.checked, { force: true });
        config.settleReset();
      } else {
        // Radios can also uncheck a peer during preactivation. Settle the group's
        // witness and restore all trackers before reapplying the attempted selection.
        config.repair();
      }
      const pending = { click: event, checked: control.type === 'radio' || !control.checked };
      checkedDescriptor?.set?.call(control, pending.checked);
      activation.current = pending;
      afterDispatch(event, control, () => finish(pending));
    }

    function confirm(): void {
      const pending = activation.current;
      if (pending?.click.eventPhase === 0) {
        finish(pending);
      }
    }

    control.addEventListener('click', click, true);
    control.addEventListener('input', confirm, true);
    return () => {
      activation.current = undefined;
      control.removeEventListener('click', click, true);
      control.removeEventListener('input', confirm, true);
    };
  }, []);

  return (
    <span
      {...rootData}
      className={cx('unica-chip', className)}
      style={style}
      hidden={hidden}
      data-unica-chip-size={size}
      data-unica-chip-iconless={dataFlag(!iconLeft)}
    >
      <Tooltip label={text} disabled={!clipped} align="start">
        <FormInput
          {...attrs}
          ref={inputRef}
          id={inputId}
          className="unica-chip-native"
          controlled={controlled}
          aria-label={attrs['aria-label'] ?? (typeof children !== 'string' ? text : undefined)}
          onChange={(event) => {
            const pending = activation.current;
            if (pending?.click === event.nativeEvent) {
              pending.change = event;
              if (current.current.controlled) {
                current.current.repair();
              }
            }
          }}
        />
      </Tooltip>
      <label htmlFor={inputId} className="unica-chip-face">
        <span className="unica-chip-leading" aria-hidden="true">
          {iconLeft && (
            <Icon usage="slot" icon={iconLeft} size={size} className="unica-chip-option-icon" />
          )}
          <Glyph
            className="unica-chip-check"
            path="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"
          />
        </span>
        <span className="unica-chip-label" ref={label} dir="auto">
          {children}
        </span>
      </label>
    </span>
  );
}

type ChipInputAttrs = Omit<
  FormInputProps,
  'children' | 'controlled' | 'type' | 'readOnly' | 'role' | 'aria-checked' | 'aria-readonly'
>;

const reserved = new Set([
  'type',
  'readOnly',
  'role',
  'aria-checked',
  'aria-readonly',
  'dangerouslySetInnerHTML',
]);

/** Render a compact, independently selectable checkbox with a visible label. */
export function Chip({
  ref,
  size = 'm',
  children,
  textValue,
  iconLeft,
  checked,
  defaultChecked = false,
  onCheckedChange,
  ...props
}: ChipProps): ReactElement {
  const input = useRef<HTMLInputElement>(null);
  const inputRef = useMemo(() => mergeRefs(input, ref), [ref]);
  const state = useFormValue<boolean>({
    value: checked,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
    getControl: () => input.current,
    write(next, context) {
      if (input.current) {
        writeInputChecked(input.current, next, {
          force: context.force,
          syncDefault: context.controlled,
        });
      }
    },
  });
  const attrs: ChipInputAttrs = {};
  const rootData: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(props)) {
    if (name === 'data-preview' || reserved.has(name)) {
      continue;
    }
    Reflect.set(name.startsWith('data-') ? rootData : attrs, name, value);
  }
  return (
    <ChipControl
      {...attrs}
      rootData={rootData}
      ref={inputRef}
      type="checkbox"
      size={size}
      textValue={textValue}
      iconLeft={iconLeft}
      controlled={state.controlled}
      defaultChecked={state.controlled ? state.value : state.defaultValue}
      settleReset={state.settleReset}
      repair={state.repair}
      select={(element, next) => {
        if (state.read() === next) {
          state.repair();
          return false;
        }
        state.propose(next, element);
        return true;
      }}
    >
      {children}
    </ChipControl>
  );
}
