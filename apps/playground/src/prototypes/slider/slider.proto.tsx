import { useId, useRef, useState, useLayoutEffect } from 'react';
import type {
  ComponentPropsWithRef,
  CSSProperties,
  HTMLAttributes,
  KeyboardEvent,
  PointerEvent,
  ReactElement,
  ReactNode,
} from 'react';
import { WarningCircleIcon } from '@phosphor-icons/react';
import type { ControlSize } from '@docouno/unica';
import './slider.css';

export interface SliderMark {
  readonly value: number;
  readonly label?: string | undefined;
}

interface SliderDesignProps {
  readonly size?: ControlSize | undefined;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly showValue?: boolean | undefined;
  readonly formatValue?: ((value: number) => string) | undefined;
  readonly orientation?: 'horizontal' | 'vertical' | undefined;
  readonly marks?: readonly SliderMark[] | undefined;
  readonly status?: 'danger' | undefined;
  /** Pins a visual state in the specimen; not a proposed library API. */
  readonly preview?: 'hover' | 'active' | 'focus' | undefined;
  readonly previewThumb?: 0 | 1 | undefined;
}

export interface SliderProps
  extends
    SliderDesignProps,
    Omit<
      ComponentPropsWithRef<'input'>,
      'type' | 'size' | 'value' | 'defaultValue' | 'min' | 'max' | 'step'
    > {
  readonly 'data-wb-subject'?: string | undefined;
  readonly value?: number | undefined;
  readonly defaultValue?: number | undefined;
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  readonly step?: number | undefined;
  readonly onValueChange?: ((value: number) => void) | undefined;
}

export interface RangeSliderProps
  extends
    SliderDesignProps,
    Omit<HTMLAttributes<HTMLFieldSetElement>, 'defaultValue' | 'onChange'> {
  readonly value?: readonly [number, number] | undefined;
  readonly defaultValue?: readonly [number, number] | undefined;
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  readonly step?: number | undefined;
  readonly minStepsBetweenThumbs?: number | undefined;
  readonly disabled?: boolean | undefined;
  readonly readOnly?: boolean | undefined;
  readonly thumbLabels?: readonly [string, string] | undefined;
  readonly onValueChange?: ((value: readonly [number, number]) => void) | undefined;
}

function percentage(value: number, min: number, max: number): number {
  return max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
}

interface RailProps extends SliderDesignProps {
  readonly values: readonly number[];
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly minGap?: number;
  readonly disabled?: boolean | undefined;
  readonly readOnly?: boolean | undefined;
  readonly inputId: string;
  readonly labelId?: string | undefined;
  readonly descriptionId?: string | undefined;
  readonly thumbLabels?: readonly [string, string] | undefined;
  readonly inputProps?: Omit<SliderProps, keyof SliderDesignProps> | undefined;
  readonly onUpdate: (values: readonly number[]) => void;
}

/** Native inputs carry focus; local pointer geometry makes the design inspectable. */
function SliderRail({
  values,
  min,
  max,
  step,
  minGap = 0,
  disabled,
  readOnly,
  inputId,
  labelId,
  descriptionId,
  thumbLabels,
  inputProps,
  size = 'm',
  orientation = 'horizontal',
  marks = [],
  status,
  formatValue,
  preview,
  previewThumb = 0,
  onUpdate,
}: RailProps): ReactElement {
  const rail = useRef<HTMLDivElement>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [length, setLength] = useState(300);
  const [active, setActive] = useState<number | null>(null);
  const [pointerFocus, setPointerFocus] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const gesture = useRef<{
    index: number | null;
    initial: readonly number[];
    coordinate: number;
    offset: number;
    rtl: boolean;
  } | null>(null);
  const vertical = orientation === 'vertical';
  const short = size === 's' ? 4 : size === 'l' ? 6 : 5;
  const positions = values.map((value) => percentage(value, min, max));
  const start = positions.length === 1 ? 0 : (positions[0] ?? 0);
  const end = positions.at(-1) ?? 0;
  const close = values.length === 2 && (end - start) * (length - short) < short + 6;

  useLayoutEffect(() => {
    const element = rail.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(() => {
      setLength(vertical ? element.clientHeight : element.clientWidth);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [vertical]);

  const update = (index: number, raw: number): void => {
    if (disabled || readOnly) {
      return;
    }
    const lower = index === 1 ? (values[0] ?? min) + minGap : min;
    const upper = values.length === 2 && index === 0 ? (values[1] ?? max) - minGap : max;
    const snapped = Number((min + Math.round((raw - min) / step) * step).toFixed(8));
    const next = Math.min(upper, Math.max(lower, snapped));
    onUpdate(values.map((value, i) => (i === index ? next : value)));
  };
  const coordinate = (event: PointerEvent<HTMLDivElement>, rtl: boolean): number => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (vertical) {
      return rect.bottom - event.clientY;
    }
    return rtl ? rect.right - event.clientX : event.clientX - rect.left;
  };
  const rawValue = (pixel: number): number =>
    min + ((pixel - short / 2) / (length - short)) * (max - min);
  const pixelValue = (index: number): number =>
    short / 2 + (positions[index] ?? 0) * (length - short);
  const nearest = (pixel: number): number =>
    values.length === 1 || pixel < (pixelValue(0) + pixelValue(1)) / 2 ? 0 : 1;
  const finish = (event: PointerEvent<HTMLDivElement>, cancel = false): void => {
    if (cancel && gesture.current) {
      onUpdate(gesture.current.initial);
    }
    gesture.current = null;
    setActive(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const keyDown = (event: KeyboardEvent<HTMLInputElement>, index: number): void => {
    setPointerFocus(false);
    if (event.key === 'Escape' && gesture.current) {
      onUpdate(gesture.current.initial);
      gesture.current = null;
      setActive(null);
      return;
    }
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const current = values[index] ?? min;
    const coarse = Math.max(step, Math.round((max - min) / step / 10) * step);
    const next: Record<string, number> = {
      ArrowRight: current + (rtl && !vertical ? -step : step),
      ArrowLeft: current + (rtl && !vertical ? step : -step),
      ArrowUp: current + step,
      ArrowDown: current - step,
      Home: min,
      End: max,
      PageUp: current + coarse,
      PageDown: current - coarse,
    };
    if (event.key in next) {
      event.preventDefault();
      update(index, next[event.key] ?? current);
    }
    inputProps?.onKeyDown?.(event);
  };
  return (
    <div className="slider-scale-proto" data-orientation={orientation}>
      <div
        ref={rail}
        className="slider-hit-proto"
        data-close={close || undefined}
        data-dragging={active !== null || undefined}
        data-pointer-focus={pointerFocus || undefined}
        data-preview={preview}
        style={{ '--slider-start': start, '--slider-end': end } as CSSProperties}
        onPointerDown={(event) => {
          if (disabled || readOnly || event.button !== 0) {
            return;
          }
          setPointerFocus(true);
          const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
          const pixel = coordinate(event, rtl);
          const target = event.target as HTMLElement;
          const directThumb = target.closest<HTMLElement>('[data-thumb-index]');
          let index: number | null = directThumb
            ? Number(directThumb.dataset.thumbIndex)
            : nearest(pixel);
          if (
            !directThumb &&
            values.length === 2 &&
            values[0] === values[1] &&
            Math.abs(pixel - pixelValue(0)) < 12
          ) {
            index = null;
          }
          gesture.current = {
            index,
            initial: [...values],
            coordinate: pixel,
            offset: directThumb && index !== null ? pixel - pixelValue(index) : 0,
            rtl,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
          event.preventDefault();
          if (index !== null) {
            inputs.current[index]?.focus({ preventScroll: true });
            setActive(index);
            if (!directThumb) {
              update(index, rawValue(pixel));
            }
          }
        }}
        onPointerMove={(event) => {
          const drag = gesture.current;
          const rtl = drag?.rtl ?? getComputedStyle(event.currentTarget).direction === 'rtl';
          const pixel = coordinate(event, rtl);
          if (!drag) {
            const cap = (event.target as HTMLElement).closest<HTMLElement>('[data-thumb-index]');
            setHovered(cap ? Number(cap.dataset.thumbIndex) : nearest(pixel));
            return;
          }
          if (drag.index === null) {
            if (Math.abs(pixel - drag.coordinate) < 2) {
              return;
            }
            drag.index = pixel < drag.coordinate ? 0 : 1;
            inputs.current[drag.index]?.focus({ preventScroll: true });
            setActive(drag.index);
          }
          update(drag.index, rawValue(pixel - drag.offset));
        }}
        onPointerLeave={() => setHovered(null)}
        onPointerUp={(event) => finish(event)}
        onPointerCancel={(event) => finish(event, true)}
      >
        <span className="slider-rail-proto" aria-hidden="true" />
        <span className="slider-fill-proto" aria-hidden="true" />
        {values.map((value, index) => (
          <span
            className="slider-thumb-wrap-proto"
            key={index}
            data-thumb-index={index}
            data-active={
              active === index || (preview === 'active' && previewThumb === index) || undefined
            }
            data-hover={
              (hovered === index && !disabled && !readOnly) ||
              (preview === 'hover' && previewThumb === index) ||
              undefined
            }
            data-focus={(preview === 'focus' && previewThumb === index) || undefined}
            style={{ '--slider-position': positions[index] } as CSSProperties}
          >
            <input
              {...inputProps}
              ref={(element) => {
                inputs.current[index] = element;
                const inputRef = inputProps?.ref;
                if (typeof inputRef === 'function') {
                  inputRef(element);
                } else if (inputRef) {
                  inputRef.current = element;
                }
              }}
              id={`${inputId}${index ? '-end' : ''}`}
              className="slider-native-proto"
              type="range"
              min={index === 1 ? (values[0] ?? min) + minGap : min}
              max={values.length === 2 && index === 0 ? (values[1] ?? max) - minGap : max}
              step={step}
              value={value}
              disabled={disabled}
              readOnly={readOnly}
              aria-readonly={readOnly || undefined}
              aria-invalid={status === 'danger' || undefined}
              aria-orientation={orientation}
              aria-label={
                thumbLabels?.[index] ??
                inputProps?.['aria-label'] ??
                (labelId ? undefined : 'Value')
              }
              aria-labelledby={
                thumbLabels ? undefined : (inputProps?.['aria-labelledby'] ?? labelId)
              }
              aria-describedby={
                [descriptionId, inputProps?.['aria-describedby']].filter(Boolean).join(' ') ||
                undefined
              }
              aria-valuetext={formatValue?.(value)}
              onBlur={(event) => {
                if (!gesture.current) {
                  setPointerFocus(false);
                }
                inputProps?.onBlur?.(event);
              }}
              onKeyDown={(event) => keyDown(event, index)}
              onChange={(event) => {
                update(index, event.currentTarget.valueAsNumber);
                if (!readOnly) {
                  inputProps?.onChange?.(event);
                }
              }}
            />
            <span className="slider-thumb-proto" aria-hidden="true" />
          </span>
        ))}
      </div>
      {marks.length > 0 && (
        <div className="slider-marks-proto" aria-hidden="true">
          {marks.map((mark, index) => (
            <span
              className="slider-mark-proto"
              key={mark.value}
              data-edge={mark.value === min ? 'start' : mark.value === max ? 'end' : undefined}
              data-secondary={
                (index > 0 && index < marks.length - 1 && index % 2 !== 0) || undefined
              }
              style={{ '--slider-position': percentage(mark.value, min, max) } as CSSProperties}
            >
              <span className="slider-tick-proto" />
              {mark.label && (
                <span className="slider-mark-label-proto" dir="auto">
                  {mark.label}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function Slider({
  value,
  defaultValue = 65,
  min = 0,
  max = 100,
  step = 1,
  size = 'm',
  label,
  description,
  showValue = true,
  formatValue,
  orientation = 'horizontal',
  marks,
  status,
  preview,
  onValueChange,
  disabled,
  readOnly,
  className = '',
  style,
  id,
  hidden,
  'data-wb-subject': subject,
  ...inputProps
}: SliderProps): ReactElement {
  const [localValue, setLocalValue] = useState(defaultValue);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const current = value ?? localValue;
  return (
    <div
      data-wb-subject={subject}
      className={`slider-proto ${className}`}
      data-size={size}
      data-orientation={orientation}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-status={status}
      style={style}
      hidden={hidden}
    >
      {(label || showValue) && (
        <div className="slider-heading-proto">
          {label && (
            <label id={`${inputId}-label`} htmlFor={inputId}>
              {label}
            </label>
          )}
          {showValue && (
            <span className="slider-value-proto">
              <bdi>{formatValue ? formatValue(current) : current}</bdi>
            </span>
          )}
        </div>
      )}
      <SliderRail
        values={[current]}
        min={min}
        max={max}
        step={step}
        size={size}
        orientation={orientation}
        disabled={disabled}
        readOnly={readOnly}
        inputId={inputId}
        labelId={label ? `${inputId}-label` : undefined}
        descriptionId={description ? `${inputId}-description` : undefined}
        inputProps={inputProps}
        marks={marks}
        status={status}
        formatValue={formatValue}
        preview={preview}
        onUpdate={(next) => {
          const nextValue = next[0] ?? min;
          setLocalValue(nextValue);
          onValueChange?.(nextValue);
        }}
      />
      {description && (
        <div id={`${inputId}-description`} className="slider-description-proto">
          {status === 'danger' && <WarningCircleIcon aria-hidden="true" />}
          {description}
        </div>
      )}
    </div>
  );
}

export function RangeSlider({
  value,
  defaultValue = [30, 80],
  min = 0,
  max = 100,
  step = 1,
  minStepsBetweenThumbs = 0,
  size = 'm',
  label,
  description,
  showValue = true,
  disabled,
  readOnly,
  formatValue,
  orientation = 'horizontal',
  marks,
  status,
  preview,
  previewThumb,
  thumbLabels = ['Lower bound', 'Upper bound'],
  onValueChange,
  className = '',
  style,
  ...props
}: RangeSliderProps): ReactElement {
  const [localValue, setLocalValue] = useState<readonly [number, number]>(defaultValue);
  const inputId = useId();
  const current = value ?? localValue;
  const display = (next: number): string => (formatValue ? formatValue(next) : String(next));
  return (
    <fieldset
      {...props}
      className={`slider-proto range-slider-proto ${className}`}
      disabled={disabled}
      data-size={size}
      data-orientation={orientation}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-status={status}
      style={style}
      aria-labelledby={label ? `${inputId}-label` : props['aria-labelledby']}
    >
      {(label || showValue) && (
        <div className="slider-heading-proto range-slider-heading-proto">
          {label && <span id={`${inputId}-label`}>{label}</span>}
          {showValue && (
            <span className="slider-value-proto">
              <span className="slider-value-range-proto" dir="ltr">
                <bdi>{display(current[0])}</bdi>
                <span aria-hidden="true"> — </span>
                <bdi>{display(current[1])}</bdi>
              </span>
            </span>
          )}
        </div>
      )}
      <SliderRail
        values={current}
        min={min}
        max={max}
        step={step}
        minGap={minStepsBetweenThumbs * step}
        size={size}
        orientation={orientation}
        disabled={disabled}
        readOnly={readOnly}
        inputId={inputId}
        descriptionId={description ? `${inputId}-description` : undefined}
        thumbLabels={thumbLabels}
        marks={marks}
        status={status}
        formatValue={formatValue}
        preview={preview}
        previewThumb={previewThumb}
        onUpdate={(next) => {
          const pair: readonly [number, number] = [next[0] ?? min, next[1] ?? max];
          setLocalValue(pair);
          onValueChange?.(pair);
        }}
      />
      {description && (
        <div id={`${inputId}-description`} className="slider-description-proto">
          {status === 'danger' && <WarningCircleIcon aria-hidden="true" />}
          {description}
        </div>
      )}
    </fieldset>
  );
}
