import { BusyGlyph, MinusGlyph, PlusGlyph, fieldStatusGlyphs } from '../control-glyphs.js';
import { useEffect, useId, useRef, useState } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { Icon } from '@docouno/unica';
import { FormField } from '../input/input.proto.js';
import type { ControlSize, FieldStatus, FieldVariant } from '../input/input.proto.js';
import { useInputFocus } from '../input/input-focus.proto.js';
import './number-input.css';

export interface NumberInputProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'size' | 'prefix' | 'value' | 'defaultValue' | 'min' | 'max' | 'step' | 'width'
> {
  readonly 'data-wb-subject'?: string | undefined;
  readonly value?: number | '' | undefined;
  readonly defaultValue?: number | '' | undefined;
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  readonly step?: number | 'any' | undefined;
  readonly size?: ControlSize | undefined;
  readonly variant?: FieldVariant | undefined;
  readonly status?: FieldStatus | undefined;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly message?: ReactNode;
  readonly prefix?: string | undefined;
  readonly suffix?: string | undefined;
  readonly loading?: boolean | undefined;
  readonly width?: 'auto' | 'full' | undefined;
  readonly decrementLabel?: string | undefined;
  readonly incrementLabel?: string | undefined;
  readonly onValueChange?: ((value: number | '') => void) | undefined;
  /** Specimen pins only; never move real DOM focus. */
  readonly previewState?: 'hover' | 'pointer-focus' | 'keyboard-focus' | undefined;
  readonly previewAction?:
    'decrement-hover' | 'decrement-active' | 'increment-hover' | 'increment-active' | undefined;
}

// A small illustrative decimal stepper, not the library's arithmetic engine.
function nextStep(
  current: number,
  direction: number,
  min: number,
  max: number,
  step: number | 'any',
): number {
  const unit = step === 'any' ? 1 : step;
  const base = Number.isFinite(min) ? min : 0;
  const first = Number.isFinite(min) ? min : -Infinity;
  const last =
    Number.isFinite(max) && step !== 'any'
      ? Number((base + Math.floor((max - base) / unit + 1e-9) * unit).toFixed(10))
      : max;
  if (!Number.isFinite(current)) {
    if (first > 0) {
      return first;
    }
    if (last < 0) {
      return last;
    }
    return nextStep(0, direction, min, max, step);
  }
  if (current < first) {
    return direction > 0 ? first : current;
  }
  if (current > last) {
    return direction < 0 ? last : current;
  }
  const next =
    step === 'any'
      ? current + direction
      : base +
        (direction > 0
          ? Math.floor((current - base) / unit + 1e-9) + 1
          : Math.ceil((current - base) / unit - 1e-9) - 1) *
          unit;
  return Number(Math.min(last, Math.max(first, next)).toFixed(10));
}

// Native editing plus local stepping makes the design inspectable. This is not the shipped API.
export function NumberInput({
  value,
  defaultValue = '',
  min = -Infinity,
  max = Infinity,
  step = 1,
  size = 'm',
  variant = 'default',
  status = 'neutral',
  label,
  description,
  message,
  prefix,
  suffix,
  loading,
  width = 'full',
  decrementLabel = 'Decrease value',
  incrementLabel = 'Increase value',
  onValueChange,
  onChange,
  onKeyDown,
  disabled,
  readOnly,
  required,
  id,
  className = '',
  style,
  previewState,
  previewAction,
  ref,
  'data-wb-subject': subject,
  ...props
}: NumberInputProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const scope = useInputFocus();
  const editor = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState(String(value ?? defaultValue));
  const repeat = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  const pointerKind = useRef('');
  const stepNow = useRef<(direction: number) => void>(() => {});
  const effectiveStatus = disabled ? 'neutral' : status;
  const StatusGlyph = effectiveStatus === 'neutral' ? null : fieldStatusGlyphs[effectiveStatus];
  const busy = loading && !disabled;
  const current = draft === '' ? NaN : Number(draft);
  const lower = nextStep(current, -1, min, max, step);
  const upper = nextStep(current, 1, min, max, step);
  const locked = disabled || readOnly;
  const decreaseDisabled = locked || (Number.isFinite(current) && lower >= current);
  const increaseDisabled = locked || (Number.isFinite(current) && upper <= current);
  const stopRepeat = (): void => {
    if (repeat.current !== null) {
      clearTimeout(repeat.current);
    }
    repeat.current = null;
  };
  useEffect(() => {
    const doc = editor.current?.ownerDocument;
    const cancel = (): void => {
      if (repeat.current !== null) {
        clearTimeout(repeat.current);
      }
      repeat.current = null;
    };
    doc?.addEventListener('pointerup', cancel, true);
    doc?.addEventListener('pointercancel', cancel, true);
    doc?.defaultView?.addEventListener('blur', cancel);
    return () => {
      cancel();
      doc?.removeEventListener('pointerup', cancel, true);
      doc?.removeEventListener('pointercancel', cancel, true);
      doc?.defaultView?.removeEventListener('blur', cancel);
    };
  }, []);
  useEffect(() => {
    if ((disabled || readOnly) && repeat.current !== null) {
      clearTimeout(repeat.current);
      repeat.current = null;
    }
  }, [disabled, readOnly]);
  // Preserve the browser's in-progress notation when the numeric value already agrees.
  useEffect(() => {
    const input = editor.current;
    if (value === undefined || !input) {
      return;
    }
    if ((value === '' && input.value !== '') || (value !== '' && input.valueAsNumber !== value)) {
      input.value = String(value);
      setDraft(input.value);
    }
  }, [value]);
  const changeBy = (direction: number): void => {
    const input = editor.current;
    if (!input || input.matches(':disabled') || input.readOnly) {
      return;
    }
    const next = nextStep(input.valueAsNumber, direction, min, max, step);
    if (!Number.isFinite(next) || next === input.valueAsNumber) {
      return;
    }
    input.value = String(next);
    setDraft(input.value);
    onValueChange?.(next);
  };
  useEffect(() => {
    stepNow.current = changeBy;
  });
  const action = (direction: -1 | 1): ReactElement => {
    const isDecrease = direction < 0;
    return (
      <button
        type="button"
        className="number-input-action-proto"
        data-action={isDecrease ? 'decrement' : 'increment'}
        tabIndex={-1}
        aria-label={isDecrease ? decrementLabel : incrementLabel}
        aria-controls={inputId}
        disabled={isDecrease ? decreaseDisabled : increaseDisabled}
        onPointerDown={(event) => {
          if (event.button !== 0) {
            return;
          }
          pointerKind.current = event.pointerType;
          held.current = false;
          if (event.pointerType === 'mouse') {
            event.preventDefault();
            editor.current?.focus({ preventScroll: true });
          }
          event.currentTarget.setPointerCapture(event.pointerId);
          const tick = (): void => {
            held.current = true;
            stepNow.current(direction);
            repeat.current = setTimeout(tick, 100);
          };
          repeat.current = setTimeout(tick, 450);
        }}
        onPointerUp={stopRepeat}
        onPointerCancel={stopRepeat}
        onLostPointerCapture={stopRepeat}
        onClick={() => {
          if (!held.current) {
            changeBy(direction);
          }
          held.current = false;
          if (pointerKind.current === 'mouse') {
            editor.current?.focus({ preventScroll: true });
          }
          pointerKind.current = '';
        }}
      >
        <Icon usage="slot" icon={isDecrease ? MinusGlyph : PlusGlyph} size={size} />
      </button>
    );
  };
  const control = (
    <span
      ref={scope}
      data-input-focus-scope=""
      data-wb-subject={subject}
      className={`input-shell-proto number-input-proto ${className}`}
      data-size={size}
      data-width={width}
      data-variant={variant}
      data-status={effectiveStatus}
      data-preview={previewState}
      data-action-preview={previewAction}
      dir={props.dir}
      style={style}
      onClick={(event) => {
        if (!(event.target as Element).closest('input, button')) {
          editor.current?.focus();
        }
      }}
    >
      {action(-1)}
      <span className="number-input-body-proto">
        <span className="number-input-value-proto">
          {prefix && (
            <span className="input-affix-proto number-affix-proto" dir="auto" title={prefix}>
              {prefix}
            </span>
          )}
          <input
            {...props}
            ref={(node) => {
              editor.current = node;
              if (typeof ref === 'function') {
                return ref(node);
              }
              if (ref) {
                ref.current = node;
              }
            }}
            id={inputId}
            className="input-native-proto"
            style={{ inlineSize: `${Math.max(3, (draft || props.placeholder || '').length)}ch` }}
            type="number"
            inputMode="decimal"
            dir="ltr"
            defaultValue={value ?? defaultValue}
            min={Number.isFinite(min) ? min : undefined}
            max={Number.isFinite(max) ? max : undefined}
            step={step}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            aria-busy={busy || undefined}
            aria-invalid={effectiveStatus === 'danger' || undefined}
            aria-describedby={
              [
                props['aria-describedby'],
                description ? `${inputId}-description` : '',
                message ? `${inputId}-message` : '',
              ]
                .filter(Boolean)
                .join(' ') || undefined
            }
            onChange={(event) => {
              setDraft(event.currentTarget.value);
              onValueChange?.(
                event.currentTarget.value === '' ? '' : event.currentTarget.valueAsNumber,
              );
              onChange?.(event);
            }}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              if (
                !event.defaultPrevented &&
                !event.nativeEvent.isComposing &&
                !event.altKey &&
                !event.ctrlKey &&
                !event.metaKey &&
                ['ArrowUp', 'ArrowDown'].includes(event.key)
              ) {
                event.preventDefault();
                changeBy(event.key === 'ArrowUp' ? 1 : -1);
              }
            }}
          />
          {suffix && (
            <span className="input-affix-proto number-affix-proto" dir="auto" title={suffix}>
              {suffix}
            </span>
          )}
        </span>
        {(StatusGlyph || busy) && (
          <span className="number-feedback-proto">
            {StatusGlyph && (
              <span className="input-status-proto">
                <Icon usage="slot" icon={StatusGlyph} size={size} />
              </span>
            )}
            {busy && (
              <Icon usage="slot" icon={BusyGlyph} size={size} className="control-spinner-proto" />
            )}
          </span>
        )}
      </span>
      {action(1)}
    </span>
  );
  return label || description || message ? (
    <FormField
      label={label}
      description={description}
      message={message}
      status={effectiveStatus}
      required={required}
      htmlFor={inputId}
      messageIcon={false}
      data-size={size}
      data-width={width}
      className="number-field-proto"
    >
      {control}
    </FormField>
  ) : (
    control
  );
}
