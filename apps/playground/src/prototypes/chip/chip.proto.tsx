import { useEffect, useId, useRef, useState } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { CheckIcon } from '@phosphor-icons/react';
import { Icon } from '../icon/icon.proto.js';
import type { GlyphComponent } from '../icon/icon.proto.js';
import { Tooltip } from '../menu/menu.proto.js';
import './chip.css';

export type ChipSize = 's' | 'm' | 'l';
export type ChipPreviewState = 'hover' | 'active' | 'focus';

export interface ChipProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'size' | 'children' | 'type' | 'readOnly'
> {
  readonly size?: ChipSize;
  readonly iconLeft?: GlyphComponent | undefined;
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
  onFocus,
  onBlur,
  onKeyDown,
  ...props
}: ChipProps): ReactElement {
  const label = useRef<HTMLSpanElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const hide = (): void => {
    clearTimeout(timer.current);
    tooltip.current?.hidePopover();
  };
  const reveal = (): void => {
    clearTimeout(timer.current);
    if (
      !label.current ||
      label.current.scrollWidth <= label.current.clientWidth + 1 ||
      !tooltip.current
    ) {
      return;
    }
    tooltip.current.showPopover();
    const anchor = label.current.getBoundingClientRect();
    const bounds = tooltip.current.getBoundingClientRect();
    tooltip.current.style.left = `${Math.max(12, Math.min(anchor.left, window.innerWidth - bounds.width - 12))}px`;
    tooltip.current.style.top = `${anchor.top > bounds.height + 12 ? anchor.top - bounds.height - 8 : anchor.bottom + 8}px`;
  };
  return (
    <label
      className={`chip-proto ${className}`}
      data-size={size}
      data-iconless={!iconLeft || undefined}
      data-preview={previewState}
      style={style}
      hidden={hidden}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch') {
          reveal();
        }
      }}
      onPointerLeave={(event) => {
        if (!event.currentTarget.querySelector(':focus-visible')) {
          timer.current = setTimeout(hide, 160);
        }
      }}
    >
      <input
        {...props}
        type={type}
        className="chip-native-proto"
        onFocus={(event) => {
          if (event.currentTarget.matches(':focus-visible')) {
            reveal();
          }
          onFocus?.(event);
        }}
        onBlur={(event) => {
          hide();
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && tooltip.current?.matches(':popover-open')) {
            hide();
            event.preventDefault();
            event.stopPropagation();
          }
          onKeyDown?.(event);
        }}
      />
      <span className="chip-face-proto">
        <span className="chip-leading-proto" aria-hidden="true">
          {iconLeft && <Icon icon={iconLeft} size={size} className="chip-option-icon-proto" />}
          <Icon icon={CheckIcon} size={size} className="chip-check-proto" />
        </span>
        <span className="chip-label-proto" ref={label}>
          {children}
        </span>
      </span>
      {typeof children === 'string' && (
        <Tooltip
          ref={tooltip}
          popover="manual"
          className="chip-full-label-proto"
          aria-hidden="true"
          onPointerEnter={() => clearTimeout(timer.current)}
          onPointerLeave={() => {
            timer.current = setTimeout(hide, 160);
          }}
          onClick={(event) => event.preventDefault()}
        >
          {children}
        </Tooltip>
      )}
    </label>
  );
}

export interface ChipOption {
  readonly value: string;
  readonly label: string;
  readonly iconLeft?: GlyphComponent | undefined;
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
          controls[next]?.focus();
          controls[next]?.click();
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
