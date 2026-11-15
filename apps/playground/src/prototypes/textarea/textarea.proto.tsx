import { useId } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { FormField } from '../input/input.proto.js';
import type { ControlSize, FieldStatus, FieldVariant } from '../input/input.proto.js';
import './textarea.css';
import '../scrollbar/scrollbar.css';

export interface TextareaProps extends ComponentPropsWithRef<'textarea'> {
  readonly size?: ControlSize | undefined;
  readonly variant?: FieldVariant | undefined;
  readonly status?: FieldStatus | undefined;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly message?: ReactNode;
}

export function Textarea({
  size = 'm',
  variant = 'default',
  status = 'neutral',
  label,
  description,
  message,
  id,
  className = '',
  required,
  hidden,
  rows = 3,
  ...props
}: TextareaProps): ReactElement {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const describedBy =
    [
      props['aria-describedby'],
      description ? `${textareaId}-description` : undefined,
      message ? `${textareaId}-message` : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;
  const control = (
    <textarea
      {...props}
      rows={rows}
      id={textareaId}
      required={required}
      hidden={hidden}
      className={`textarea-proto scrollbar-proto ${className}`}
      data-size={size}
      data-variant={variant}
      data-status={status}
      aria-invalid={status === 'danger' || props['aria-invalid'] || undefined}
      aria-describedby={describedBy}
    />
  );
  return label || description || message ? (
    <FormField
      label={label}
      description={description}
      message={message}
      status={status}
      required={required}
      htmlFor={textareaId}
      hidden={hidden}
    >
      {control}
    </FormField>
  ) : (
    control
  );
}
