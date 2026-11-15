import {
  createContext,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { ComponentPropsWithRef, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { CheckIcon, MinusIcon } from '@phosphor-icons/react';
import type { ControlSize } from '../input/input.proto.js';
import './binary-controls.css';

export type BinaryStatus = 'neutral' | 'danger';
export type BinaryPreviewState = 'rest' | 'hover' | 'active' | 'focus';

export interface BinaryIndicatorProps {
  readonly size?: ControlSize | undefined;
  readonly checked?: boolean | undefined;
  readonly indeterminate?: boolean | undefined;
}

/** Decorative primitive. The adjacent native input owns interaction and semantics. */
export function CheckboxIndicator({
  size = 'm',
  checked,
  indeterminate,
}: BinaryIndicatorProps): ReactElement {
  return (
    <span
      className="binary-indicator"
      data-kind="checkbox"
      data-size={size}
      data-checked={checked || undefined}
      data-mixed={indeterminate || undefined}
      aria-hidden="true"
    >
      <CheckIcon className="binary-check" weight="bold" />
      <MinusIcon className="binary-dash" weight="bold" />
    </span>
  );
}

interface BinaryGroupContextValue {
  readonly disabled?: boolean | undefined;
  readonly readOnly?: boolean | undefined;
  readonly status?: BinaryStatus | undefined;
  readonly size?: ControlSize | undefined;
  readonly name?: string | undefined;
  readonly value?: readonly string[] | undefined;
  readonly onValueChange?: ((value: string[]) => void) | undefined;
}

const CheckboxContext = createContext<BinaryGroupContextValue>({});

export interface CheckboxProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'size' | 'children'
> {
  readonly size?: ControlSize | undefined;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly indeterminate?: boolean | undefined;
  readonly status?: BinaryStatus | undefined;
  readonly onCheckedChange?: ((checked: boolean) => void) | undefined;
  /** Pins appearance only. It never moves DOM focus. */
  readonly previewState?: BinaryPreviewState | undefined;
}

export function Checkbox({
  label,
  description,
  size,
  status,
  indeterminate,
  onCheckedChange,
  previewState,
  className = '',
  style,
  hidden,
  id,
  ref,
  checked,
  defaultChecked,
  disabled,
  readOnly,
  name,
  value,
  onClick,
  onChange,
  ...props
}: CheckboxProps): ReactElement {
  const group = useContext(CheckboxContext);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current!, []);
  const [localChecked, setLocalChecked] = useState(defaultChecked ?? false);
  const selected =
    group.value && typeof value === 'string'
      ? group.value.includes(value)
      : (checked ?? localChecked);
  const unavailable = disabled || group.disabled;
  const locked = readOnly || group.readOnly;
  const effectiveSize = size ?? group.size ?? 'm';
  const effectiveStatus = unavailable ? 'neutral' : (status ?? group.status ?? 'neutral');
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate, selected]);
  return (
    <label
      className={`binary-control ${className}`}
      data-size={effectiveSize}
      data-status={effectiveStatus}
      data-readonly={locked || undefined}
      data-preview={previewState}
      data-standalone={(!label && !description) || undefined}
      style={style}
      hidden={hidden}
    >
      <span className="binary-target">
        <input
          {...props}
          ref={inputRef}
          id={inputId}
          type="checkbox"
          className="binary-native"
          name={name ?? group.name}
          value={value}
          checked={selected}
          disabled={unavailable}
          aria-readonly={locked || undefined}
          aria-invalid={effectiveStatus === 'danger' || props['aria-invalid']}
          aria-labelledby={
            props['aria-labelledby'] ??
            (label && !props['aria-label'] ? `${inputId}-label` : undefined)
          }
          aria-describedby={
            [props['aria-describedby'], description ? `${inputId}-description` : '']
              .filter(Boolean)
              .join(' ') || undefined
          }
          onClick={(event) => {
            onClick?.(event);
            if (locked) {
              event.preventDefault();
            }
          }}
          onChange={(event) => {
            if (locked) {
              return;
            }
            const next = event.currentTarget.checked;
            setLocalChecked(next);
            if (group.value && typeof value === 'string') {
              group.onValueChange?.(
                next ? [...group.value, value] : group.value.filter((item) => item !== value),
              );
            }
            onCheckedChange?.(next);
            onChange?.(event);
          }}
        />
        <CheckboxIndicator size={effectiveSize} indeterminate={indeterminate} />
      </span>
      {(label || description) && (
        <span className="binary-copy">
          {label && (
            <span className="binary-label" id={`${inputId}-label`}>
              {label}
            </span>
          )}
          {description && (
            <span className="binary-description" id={`${inputId}-description`}>
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
}

export interface CheckboxGroupProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue'>, BinaryGroupContextValue {
  readonly defaultValue?: readonly string[] | undefined;
  readonly orientation?: 'vertical' | 'horizontal' | undefined;
}

export function CheckboxGroup({
  value,
  defaultValue = [],
  onValueChange,
  name,
  size,
  status,
  disabled,
  readOnly,
  orientation = 'vertical',
  className = '',
  children,
  ...props
}: CheckboxGroupProps): ReactElement {
  const [localValue, setLocalValue] = useState<readonly string[]>(defaultValue);
  return (
    <CheckboxContext
      value={{
        value: value ?? localValue,
        name,
        size,
        status,
        disabled,
        readOnly,
        onValueChange: (next) => {
          setLocalValue(next);
          onValueChange?.(next);
        },
      }}
    >
      <div
        {...props}
        role="group"
        aria-disabled={disabled || undefined}
        className={`binary-group ${className}`}
        data-orientation={orientation}
      >
        {children}
      </div>
    </CheckboxContext>
  );
}

export function RadioIndicator({
  size = 'm',
  checked,
}: Omit<BinaryIndicatorProps, 'indeterminate'>): ReactElement {
  return (
    <span
      className="binary-indicator"
      data-kind="radio"
      data-size={size}
      data-checked={checked || undefined}
      aria-hidden="true"
    >
      <span className="binary-dot" />
    </span>
  );
}

interface RadioContextValue {
  readonly value: string | null;
  readonly name: string;
  readonly size?: ControlSize | undefined;
  readonly status?: BinaryStatus | undefined;
  readonly readOnly?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly onValueChange: (value: string) => void;
}
const RadioContext = createContext<RadioContextValue | null>(null);

export type RadioProps = Omit<CheckboxProps, 'readOnly' | 'indeterminate' | 'onCheckedChange'>;

export function Radio({
  label,
  description,
  size,
  status,
  previewState,
  className = '',
  style,
  hidden,
  id,
  ref,
  checked,
  defaultChecked,
  disabled,
  name,
  value,
  onClick,
  onChange,
  onKeyDown,
  ...props
}: RadioProps): ReactElement {
  const group = useContext(RadioContext);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const unavailable = disabled || group?.disabled;
  const locked = group?.readOnly;
  const effectiveSize = size ?? group?.size ?? 'm';
  const effectiveStatus = unavailable ? 'neutral' : (status ?? group?.status ?? 'neutral');
  return (
    <label
      className={`binary-control ${className}`}
      data-size={effectiveSize}
      data-status={effectiveStatus}
      data-readonly={locked || undefined}
      data-preview={previewState}
      data-standalone={(!label && !description) || undefined}
      style={style}
      hidden={hidden}
    >
      <span className="binary-target">
        <input
          {...props}
          ref={ref}
          id={inputId}
          type="radio"
          className="binary-native"
          name={name ?? group?.name}
          value={value}
          checked={group ? group.value === value : checked}
          defaultChecked={group ? undefined : defaultChecked}
          disabled={unavailable}
          aria-invalid={effectiveStatus === 'danger' || props['aria-invalid']}
          aria-labelledby={
            props['aria-labelledby'] ??
            (label && !props['aria-label'] ? `${inputId}-label` : undefined)
          }
          aria-describedby={
            [props['aria-describedby'], description ? `${inputId}-description` : '']
              .filter(Boolean)
              .join(' ') || undefined
          }
          onClick={(event) => {
            onClick?.(event);
            if (locked) {
              event.preventDefault();
            }
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (
              locked &&
              [' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(
                event.key,
              )
            ) {
              event.preventDefault();
            }
          }}
          onChange={(event) => {
            if (locked) {
              return;
            }
            group?.onValueChange(event.currentTarget.value);
            onChange?.(event);
          }}
        />
        <RadioIndicator size={effectiveSize} />
      </span>
      {(label || description) && (
        <span className="binary-copy">
          {label && (
            <span className="binary-label" id={`${inputId}-label`}>
              {label}
            </span>
          )}
          {description && (
            <span className="binary-description" id={`${inputId}-description`}>
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
}

export interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
  readonly value?: string | null | undefined;
  readonly defaultValue?: string | null | undefined;
  readonly onValueChange?: ((value: string) => void) | undefined;
  readonly name?: string | undefined;
  readonly size?: ControlSize | undefined;
  readonly status?: BinaryStatus | undefined;
  readonly readOnly?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly orientation?: 'vertical' | 'horizontal' | undefined;
}

export function RadioGroup({
  value,
  defaultValue = null,
  onValueChange,
  name,
  size,
  status,
  disabled,
  readOnly,
  orientation = 'vertical',
  className = '',
  children,
  onKeyDown,
  ...props
}: RadioGroupProps): ReactElement {
  const generatedName = useId();
  const [localValue, setLocalValue] = useState<string | null>(defaultValue);
  return (
    <RadioContext
      value={{
        value: value === undefined ? localValue : value,
        name: name ?? generatedName,
        size,
        status,
        disabled,
        readOnly,
        onValueChange: (next) => {
          setLocalValue(next);
          onValueChange?.(next);
        },
      }}
    >
      <div
        {...props}
        role="radiogroup"
        aria-orientation={orientation}
        aria-readonly={readOnly || undefined}
        aria-disabled={disabled || undefined}
        aria-invalid={status === 'danger' || undefined}
        className={`binary-group ${className}`}
        data-orientation={orientation}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (
            event.defaultPrevented ||
            readOnly ||
            disabled ||
            !['Home', 'End'].includes(event.key)
          ) {
            return;
          }
          const options = [
            ...event.currentTarget.querySelectorAll<HTMLInputElement>(
              'input[type="radio"]:enabled',
            ),
          ];
          const option = event.key === 'Home' ? options[0] : options.at(-1);
          event.preventDefault();
          option?.focus();
          option?.click();
        }}
      >
        {children}
      </div>
    </RadioContext>
  );
}
