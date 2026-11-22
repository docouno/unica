import { CheckGlyph } from '../control-glyphs.js';
import { useEffect, useId, useRef, useState } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { Icon, Tooltip } from '@docouno/unica';
import type { GlyphSource } from '@docouno/unica';
import { useClippedLabel } from '../use-clipped-label.js';
import './chip.css';

export type ChipSize = 's' | 'm' | 'l';
export type ChipPreviewState = 'hover' | 'active' | 'focus';

export interface ChipProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'size' | 'children' | 'type' | 'readOnly'
> {
  readonly 'data-wb-subject'?: string | undefined;
  readonly size?: ChipSize;
  readonly iconLeft?: GlyphSource | undefined;
  readonly children: ReactNode;
  /** Local design-preview mode; the library will coordinate this through its group. */
  readonly type?: 'checkbox' | 'radio';
  readonly previewState?: ChipPreviewState | undefined;
}

export function Chip({
  size = 'm',
  iconLeft,
  children,
  type = 'checkbox',
  previewState,
  className = '',
  style,
  hidden,
  id,
  'data-wb-subject': subject,
  ...props
}: ChipProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const text = typeof children === 'string' ? children : undefined;
  const [label, clipped] = useClippedLabel<HTMLSpanElement>(text);

  return (
    <span
      data-wb-subject={subject}
      className={`chip-proto ${className}`}
      data-size={size}
      data-iconless={!iconLeft || undefined}
      data-preview={previewState}
      style={style}
      hidden={hidden}
    >
      <Tooltip label={text ?? ''} disabled={!clipped} align="start">
        <input {...props} id={inputId} type={type} className="chip-native-proto" />
      </Tooltip>
      <label htmlFor={inputId} className="chip-face-proto">
        <span className="chip-leading-proto" aria-hidden="true">
          {iconLeft && (
            <Icon usage="slot" icon={iconLeft} size={size} className="chip-option-icon-proto" />
          )}
          <Icon usage="slot" icon={CheckGlyph} size={size} className="chip-check-proto" />
        </span>
        <span className="chip-label-proto" ref={label}>
          {children}
        </span>
      </label>
    </span>
  );
}

export interface ChipOption {
  readonly value: string;
  readonly label: string;
  readonly iconLeft?: GlyphSource | undefined;
  readonly disabled?: boolean;
}

interface ChipGroupBaseProps extends Omit<
  ComponentPropsWithRef<'fieldset'>,
  'onChange' | 'children' | 'defaultValue'
> {
  readonly label: string;
  readonly description?: string;
  readonly error?: string | undefined;
  readonly items: readonly ChipOption[];
  readonly size?: ChipSize;
  readonly name?: string;
}
export interface ChipGroupSingleProps extends ChipGroupBaseProps {
  readonly multiple?: false;
  readonly value?: string | null;
  readonly defaultValue?: string | null;
  readonly onValueChange?: (value: string) => void;
}
export interface ChipGroupMultipleProps extends ChipGroupBaseProps {
  readonly multiple: true;
  readonly value?: readonly string[];
  readonly defaultValue?: readonly string[];
  readonly onValueChange?: (value: readonly string[]) => void;
}
export type ChipGroupProps = ChipGroupSingleProps | ChipGroupMultipleProps;

// Native inputs and local selection make this a live design reference.
// Complete collection/form authority remains a library implementation concern.
export function ChipGroup(props: ChipGroupProps): ReactElement {
  const {
    label,
    description,
    error,
    items,
    size = 'm',
    name,
    disabled,
    multiple,
    value,
    defaultValue,
    onValueChange: _onValueChange,
    className = '',
    ...fieldsetProps
  } = props;
  void _onValueChange;
  const id = useId();
  const root = useRef<HTMLFieldSetElement>(null);
  const [local, setLocal] = useState<string | readonly string[] | null>(
    defaultValue ?? (multiple ? [] : null),
  );
  const selected = value === undefined ? local : value;
  useEffect(() => {
    const form = root.current?.form;
    const reset = (): void => setLocal(defaultValue ?? (multiple ? [] : null));
    form?.addEventListener('reset', reset);
    return () => form?.removeEventListener('reset', reset);
  }, [defaultValue, multiple]);
  return (
    <fieldset
      {...fieldsetProps}
      ref={root}
      disabled={disabled}
      className={`chip-group-proto ${className}`}
      aria-describedby={
        [description ? `${id}-description` : '', error ? `${id}-error` : '']
          .filter(Boolean)
          .join(' ') || undefined
      }
      aria-invalid={error ? true : undefined}
    >
      <legend className="chip-group-label-proto">{label}</legend>
      {description && (
        <p id={`${id}-description`} className="chip-group-description-proto">
          {description}
        </p>
      )}
      <div
        className="chip-group-options-proto"
        onKeyDown={(event) => {
          if (
            multiple ||
            !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)
          ) {
            return;
          }
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLInputElement>('input:not(:disabled)'),
          );
          const index = controls.indexOf(event.target as HTMLInputElement);
          if (index < 0 || !controls.length) {
            return;
          }
          const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
          const backwards =
            event.key === 'ArrowUp' || event.key === (rtl ? 'ArrowRight' : 'ArrowLeft');
          const next =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? controls.length - 1
                : (index + (backwards ? -1 : 1) + controls.length) % controls.length;
          event.preventDefault();
          const target = controls[next];
          if (target && target !== event.target) {
            target.click();
            target.focus();
          }
        }}
      >
        {items.map((item) => (
          <Chip
            key={item.value}
            type={multiple ? 'checkbox' : 'radio'}
            name={name ?? id}
            value={item.value}
            size={size}
            iconLeft={item.iconLeft}
            disabled={item.disabled}
            checked={
              multiple
                ? Array.isArray(selected) && selected.includes(item.value)
                : selected === item.value
            }
            onChange={(event) => {
              if (props.multiple) {
                const current: readonly string[] =
                  typeof selected === 'string' || selected === null ? [] : selected;
                const next = event.currentTarget.checked
                  ? [...current, item.value]
                  : current.filter((v) => v !== item.value);
                if (value === undefined) {
                  setLocal(next);
                }
                props.onValueChange?.(next);
              } else {
                if (value === undefined) {
                  setLocal(item.value);
                }
                props.onValueChange?.(item.value);
              }
            }}
          >
            {item.label}
          </Chip>
        ))}
      </div>
      {error && (
        <p id={`${id}-error`} className="chip-group-error-proto">
          {error}
        </p>
      )}
    </fieldset>
  );
}
