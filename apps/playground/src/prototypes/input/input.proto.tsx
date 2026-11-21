import { BusyGlyph, CloseGlyph, fieldStatusGlyphs } from '../control-glyphs.js';
import { useId, useRef } from 'react';
import type { ComponentPropsWithRef, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { Icon } from '@docouno/unica';
import type { GlyphSource } from '@docouno/unica';
import { useInputFocus } from './input-focus.proto.js';
import './input.css';

export type ControlSize = 's' | 'm' | 'l';
export type FieldStatus = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type FieldVariant = 'default' | 'ghost';

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly message?: ReactNode;
  readonly status?: FieldStatus | undefined;
  readonly required?: boolean | undefined;
  readonly htmlFor?: string | undefined;
  /** Input already carries the status glyph inside its shell. */
  readonly messageIcon?: boolean | undefined;
}

export function FormField({
  label,
  description,
  message,
  status = 'neutral',
  required,
  htmlFor,
  messageIcon = true,
  className = '',
  children,
  ...props
}: FormFieldProps): ReactElement {
  const StatusIcon = status === 'neutral' ? null : fieldStatusGlyphs[status].source;
  return (
    <div {...props} className={`form-field-proto ${className}`} data-status={status}>
      {label && (
        <label className="form-field-label-proto" htmlFor={htmlFor}>
          <span>{label}</span>
          {required && (
            <span className="form-field-required-proto" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {(description || message) && (
        <div className="form-field-support-proto">
          {description && (
            <div
              id={htmlFor ? `${htmlFor}-description` : undefined}
              className="form-field-description-proto"
            >
              {description}
            </div>
          )}
          {message && (
            <div
              id={htmlFor ? `${htmlFor}-message` : undefined}
              className="form-field-message-proto"
            >
              {messageIcon && StatusIcon && <StatusIcon size="1em" aria-hidden="true" />}
              <span>{message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export interface InputProps extends Omit<ComponentPropsWithRef<'input'>, 'size' | 'prefix'> {
  readonly 'data-wb-subject'?: string | undefined;
  readonly size?: ControlSize | undefined;
  readonly variant?: FieldVariant | undefined;
  readonly status?: FieldStatus | undefined;
  readonly iconLeft?: GlyphSource | undefined;
  readonly iconRight?: GlyphSource | undefined;
  readonly prefix?: ReactNode;
  readonly suffix?: ReactNode;
  readonly loading?: boolean | undefined;
  readonly clearable?: boolean | undefined;
  readonly clearLabel?: string | undefined;
  readonly onClear?: (() => void) | undefined;
  readonly width?: 'auto' | 'full' | undefined;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly message?: ReactNode;
  /** Pins appearance for specimen comparison; does not move DOM focus. */
  readonly previewState?:
    'rest' | 'hover' | 'pointer-focus' | 'keyboard-focus' | 'clear-focus' | undefined;
  readonly previewClearState?: 'hover' | 'active' | undefined;
}

// Native behavior makes the design inspectable. These props and DOM are not the library API.
export function Input({
  size = 'm',
  variant = 'default',
  status = 'neutral',
  iconLeft,
  iconRight,
  prefix,
  suffix,
  loading,
  clearable,
  clearLabel = 'Clear value',
  onClear,
  width = 'full',
  label,
  description,
  message,
  className = '',
  style,
  id,
  disabled,
  readOnly,
  required,
  hidden,
  placeholder = '',
  previewState,
  previewClearState,
  onCompositionStart,
  'data-wb-subject': subject,
  onCompositionEnd,
  ...props
}: InputProps): ReactElement {
  const generatedId = useId();
  const focusScope = useInputFocus();
  const composing = useRef(false);
  const inputId = id ?? generatedId;
  const effectiveStatus = disabled ? 'neutral' : status;
  const StatusGlyph = effectiveStatus === 'neutral' ? null : fieldStatusGlyphs[effectiveStatus];
  const busy = loading && !disabled;
  const describedBy =
    [
      props['aria-describedby'],
      description ? `${inputId}-description` : undefined,
      message ? `${inputId}-message` : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;
  const control = (
    <span
      ref={focusScope}
      data-input-focus-scope=""
      data-wb-subject={subject}
      className={`input-shell-proto ${className}`}
      data-size={size}
      data-variant={variant}
      data-status={effectiveStatus}
      data-width={width}
      dir={props.dir}
      data-preview={previewState}
      data-clear-preview={previewClearState}
      data-loading={busy || undefined}
      style={style}
      hidden={hidden}
      onClick={(event) => {
        const target = event.target as Element;
        if (!target.closest('input, button')) {
          event.currentTarget.querySelector<HTMLInputElement>('input')?.focus();
        }
      }}
    >
      {iconLeft && (
        <Icon
          className="input-leading-glyph"
          usage="slot"
          icon={iconLeft}
          size={size}
          color="secondary"
        />
      )}
      {prefix && (
        <span className="input-affix-proto" dir="auto">
          {prefix}
        </span>
      )}
      <input
        {...props}
        id={inputId}
        className="input-native-proto"
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        aria-busy={busy || undefined}
        aria-invalid={
          effectiveStatus === 'danger' || (!disabled && props['aria-invalid']) || undefined
        }
        aria-describedby={describedBy}
        onCompositionStart={(event) => {
          composing.current = true;
          onCompositionStart?.(event);
        }}
        onCompositionEnd={(event) => {
          composing.current = false;
          onCompositionEnd?.(event);
        }}
      />
      {suffix && (
        <span className="input-affix-proto" dir="auto">
          {suffix}
        </span>
      )}
      {clearable && (
        <button
          type="button"
          className="input-clear-proto"
          aria-label={clearLabel}
          aria-controls={inputId}
          aria-disabled={busy || undefined}
          disabled={disabled || readOnly}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            const input = event.currentTarget.parentElement?.querySelector('input');
            if (!input || input.matches(':disabled') || readOnly || busy || composing.current) {
              return;
            }
            // A native input event keeps the live controlled examples honest.
            const nativeValue = Object.getOwnPropertyDescriptor(
              HTMLInputElement.prototype,
              'value',
            );
            nativeValue?.set?.call(input, '');
            input.dispatchEvent(new Event('input', { bubbles: true }));
            onClear?.();
            input.focus();
          }}
        >
          <Icon className="input-clear-glyph" usage="slot" icon={CloseGlyph} size={size} />
        </button>
      )}
      {StatusGlyph && (
        <span className="input-status-proto">
          <Icon usage="slot" icon={StatusGlyph} size={size} />
        </span>
      )}
      {busy && (
        <Icon
          usage="slot"
          icon={BusyGlyph}
          size={size}
          color="muted"
          className="control-spinner-proto"
        />
      )}
      {!StatusGlyph && !busy && iconRight && (
        <Icon
          usage="slot"
          icon={iconRight}
          size={size}
          color="secondary"
          className="input-trailing-proto"
        />
      )}
    </span>
  );
  return label || description || message ? (
    <FormField
      label={label}
      description={description}
      message={message}
      messageIcon={false}
      status={effectiveStatus}
      required={required}
      htmlFor={inputId}
      hidden={hidden}
      data-width={width}
    >
      {control}
    </FormField>
  ) : (
    control
  );
}
