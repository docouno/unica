import { useId, useState } from 'react';
import type {
  ComponentPropsWithRef,
  CSSProperties,
  HTMLAttributes,
  ReactElement,
  ReactNode,
} from 'react';
import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react';
import { Input } from '../input/input.proto.js';
import type { ControlSize, FieldVariant } from '../input/input.proto.js';
import './slider.css';

export interface SliderProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'size' | 'value' | 'defaultValue'
> {
  readonly value?: number | undefined;
  readonly defaultValue?: number | undefined;
  readonly size?: ControlSize | undefined;
  readonly label?: ReactNode;
  readonly showValue?: boolean | undefined;
  readonly formatValue?: ((value: number) => string) | undefined;
  readonly onValueChange?: ((value: number) => void) | undefined;
}

function percentage(value: number, min: number, max: number): number {
  return max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;
}

export function Slider({
  value,
  defaultValue = 65,
  min = 0,
  max = 100,
  size = 'm',
  label,
  showValue = true,
  formatValue,
  onValueChange,
  onChange,
  readOnly,
  className = '',
  style,
  id,
  hidden,
  ...props
}: SliderProps): ReactElement {
  const [localValue, setLocalValue] = useState(defaultValue);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const current = value ?? localValue;
  const sliderStyle: CSSProperties = {
    '--slider-fill': `${percentage(current, Number(min), Number(max))}%`,
    ...style,
  } as CSSProperties;
  return (
    <div
      className={`slider-proto ${className}`}
      data-size={size}
      style={sliderStyle}
      hidden={hidden}
    >
      {(label || showValue) && (
        <div className="slider-heading-proto">
          <label htmlFor={inputId}>{label}</label>
          {showValue && (
            <output htmlFor={inputId}>{formatValue ? formatValue(current) : current}</output>
          )}
        </div>
      )}
      <input
        {...props}
        id={inputId}
        type="range"
        className="slider-native-proto"
        min={min}
        max={max}
        value={current}
        readOnly={readOnly}
        aria-label={label ? undefined : (props['aria-label'] ?? 'Value')}
        onChange={(event) => {
          if (readOnly) {
            return;
          }
          const next = event.currentTarget.valueAsNumber;
          setLocalValue(next);
          onValueChange?.(next);
          onChange?.(event);
        }}
      />
    </div>
  );
}

export interface RangeSliderProps extends Omit<
  HTMLAttributes<HTMLFieldSetElement>,
  'defaultValue' | 'onChange'
> {
  readonly value?: readonly [number, number] | undefined;
  readonly defaultValue?: readonly [number, number] | undefined;
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  readonly step?: number | undefined;
  readonly label?: ReactNode;
  readonly disabled?: boolean | undefined;
  readonly formatValue?: ((value: number) => string) | undefined;
  readonly onValueChange?: ((value: readonly [number, number]) => void) | undefined;
}

export function RangeSlider({
  value,
  defaultValue = [30, 80],
  min = 0,
  max = 100,
  step = 1,
  label,
  disabled,
  formatValue,
  onValueChange,
  className = '',
  style,
  ...props
}: RangeSliderProps): ReactElement {
  const [localValue, setLocalValue] = useState<readonly [number, number]>(defaultValue);
  const current = value ?? localValue;
  const display = (next: number): string => (formatValue ? formatValue(next) : String(next));
  const update = (thumb: number, next: number): void => {
    const result: readonly [number, number] =
      thumb === 0
        ? [Math.min(next, current[1]), current[1]]
        : [current[0], Math.max(next, current[0])];
    setLocalValue(result);
    onValueChange?.(result);
  };
  const sliderStyle: CSSProperties = {
    '--slider-start': `${percentage(current[0], min, max)}%`,
    '--slider-end': `${percentage(current[1], min, max)}%`,
    ...style,
  } as CSSProperties;
  return (
    <fieldset
      {...props}
      className={`range-slider-proto ${className}`}
      disabled={disabled}
      style={sliderStyle}
    >
      {label && <legend>{label}</legend>}
      <div className="range-slider-heading-proto">
        <span>{display(current[0])}</span>
        <span>{display(current[1])}</span>
      </div>
      <div className="range-slider-track-proto">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current[0]}
          aria-label="Range start"
          onChange={(event) => update(0, event.currentTarget.valueAsNumber)}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current[1]}
          aria-label="Range end"
          onChange={(event) => update(1, event.currentTarget.valueAsNumber)}
        />
      </div>
    </fieldset>
  );
}

export interface NumberInputProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'size' | 'value' | 'defaultValue' | 'min' | 'max' | 'step' | 'width'
> {
  readonly value?: number | undefined;
  readonly defaultValue?: number | undefined;
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  readonly step?: number | undefined;
  readonly size?: ControlSize | undefined;
  readonly variant?: FieldVariant | undefined;
  readonly label?: ReactNode;
  readonly onValueChange?: ((value: number) => void) | undefined;
}

export function NumberInput({
  value,
  defaultValue = 0,
  min,
  max,
  step = 1,
  size = 'm',
  variant = 'default',
  label,
  onValueChange,
  onChange,
  disabled,
  readOnly,
  className = '',
  ...props
}: NumberInputProps): ReactElement {
  const [localValue, setLocalValue] = useState(String(defaultValue));
  const current = value === undefined ? localValue : String(value);
  const increment = (direction: number): void => {
    const next = Math.min(
      max ?? Infinity,
      Math.max(min ?? -Infinity, Number(current || 0) + direction * step),
    );
    const rounded = Number(next.toFixed(10));
    setLocalValue(String(rounded));
    onValueChange?.(rounded);
  };
  return (
    <Input
      {...props}
      type="number"
      size={size}
      variant={variant}
      label={label}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      readOnly={readOnly}
      value={current}
      className={`number-input-proto ${className}`}
      onChange={(event) => {
        setLocalValue(event.currentTarget.value);
        if (
          event.currentTarget.value !== '' &&
          Number.isFinite(event.currentTarget.valueAsNumber)
        ) {
          onValueChange?.(event.currentTarget.valueAsNumber);
        }
        onChange?.(event);
      }}
      suffix={
        <span className="number-input-actions-proto">
          <button
            type="button"
            aria-label="Increase value"
            disabled={disabled || readOnly || (max !== undefined && Number(current) >= max)}
            onClick={() => increment(1)}
          >
            <CaretUpIcon size="1em" />
          </button>
          <button
            type="button"
            aria-label="Decrease value"
            disabled={disabled || readOnly || (min !== undefined && Number(current) <= min)}
            onClick={() => increment(-1)}
          >
            <CaretDownIcon size="1em" />
          </button>
        </span>
      }
    />
  );
}
