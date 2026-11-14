import { useId } from 'react';
import type { ComponentPropsWithRef, HTMLAttributes, ReactElement, ReactNode } from 'react';
import {
  CheckCircleIcon,
  CircleNotchIcon,
  InfoIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { Icon } from '../icon/icon.proto.js';
import type { GlyphComponent } from '../icon/icon.proto.js';
import './input.css';

export type ControlSize = 's' | 'm' | 'l';
export type FieldStatus = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type FieldVariant = 'default' | 'ghost';

const statusIcons: Record<Exclude<FieldStatus, 'neutral'>, GlyphComponent> = {
  info: InfoIcon,
  success: CheckCircleIcon,
  warning: WarningCircleIcon,
  danger: WarningCircleIcon,
};

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly message?: ReactNode;
  readonly status?: FieldStatus | undefined;
  readonly required?: boolean | undefined;
  readonly htmlFor?: string | undefined;
}

export function FormField({
  label,
  description,
  message,
  status = 'neutral',
  required,
  htmlFor,
  className = '',
  children,
  ...props
}: FormFieldProps): ReactElement {
  const StatusGlyph = status === 'neutral' ? null : statusIcons[status];
  return (
    <div {...props} className={`form-field-proto ${className}`} data-status={status}>
      {label && (
        <label className="form-field-label-proto" htmlFor={htmlFor}>
          {label}
          {required && (
            <span className="form-field-required-proto" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {description && (
        <div
          id={htmlFor ? `${htmlFor}-description` : undefined}
          className="form-field-description-proto"
        >
          {description}
        </div>
      )}
      {message && (
        <div id={htmlFor ? `${htmlFor}-message` : undefined} className="form-field-message-proto">
          {StatusGlyph && <StatusGlyph size="1em" aria-hidden="true" />}
          {message}
        </div>
      )}
    </div>
  );
}

export interface InputProps extends Omit<ComponentPropsWithRef<'input'>, 'size' | 'prefix'> {
  readonly size?: ControlSize | undefined;
  readonly variant?: FieldVariant | undefined;
  readonly status?: FieldStatus | undefined;
  readonly iconLeft?: GlyphComponent | undefined;
  readonly iconRight?: GlyphComponent | undefined;
  readonly prefix?: ReactNode;
  readonly suffix?: ReactNode;
  readonly loading?: boolean | undefined;
  readonly width?: 'auto' | 'full' | undefined;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly message?: ReactNode;
}

// A native input with visual slots. Full library form coordination belongs to Wave 2.
export function Input({
  size = 'm',
  variant = 'default',
  status = 'neutral',
  iconLeft,
  iconRight,
  prefix,
  suffix,
  loading,
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
  ...props
}: InputProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const StatusGlyph = status === 'neutral' ? null : statusIcons[status];
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
      className={`input-shell-proto ${className}`}
      data-size={size}
      data-variant={variant}
      data-status={status}
      data-width={width}
      aria-busy={loading || undefined}
      style={style}
      hidden={hidden}
    >
      {iconLeft && <Icon icon={iconLeft} size={size} />}
      {prefix && <span className="input-affix-proto">{prefix}</span>}
      <input
        {...props}
        id={inputId}
        className="input-native-proto"
        disabled={disabled}
        readOnly={readOnly || loading}
        required={required}
        aria-invalid={status === 'danger' || props['aria-invalid'] || undefined}
        aria-describedby={describedBy}
      />
      {suffix && <span className="input-affix-proto">{suffix}</span>}
      {loading ? (
        <CircleNotchIcon className="control-spinner-proto" size="1em" aria-hidden="true" />
      ) : StatusGlyph ? (
        <StatusGlyph className="input-status-proto" size="1em" aria-hidden="true" />
      ) : (
        iconRight && <Icon icon={iconRight} size={size} />
      )}
    </span>
  );
  return label || description || message ? (
    <FormField
      label={label}
      description={description}
      message={message}
      status={status}
      required={required}
      htmlFor={inputId}
      hidden={hidden}
    >
      {control}
    </FormField>
  ) : (
    control
  );
}
