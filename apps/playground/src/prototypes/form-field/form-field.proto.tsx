import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { CheckCircleIcon, InfoIcon, WarningCircleIcon, WarningIcon } from '@phosphor-icons/react';
import type { ControlSize, FieldStatus } from '@docouno/unica';
import './form-field.css';

const feedbackIcons = {
  info: InfoIcon,
  success: CheckCircleIcon,
  warning: WarningIcon,
  danger: WarningCircleIcon,
};

const feedbackLabels = {
  info: 'Information',
  success: 'Valid',
  warning: 'Review this value',
  danger: 'Needs attention',
};

export interface FormFieldLabelProps extends HTMLAttributes<HTMLElement> {
  readonly target?: 'control' | 'group' | undefined;
  readonly htmlFor?: string | undefined;
  readonly required?: boolean | undefined;
  readonly optional?: ReactNode;
}

export function FormFieldLabel({
  target = 'control',
  htmlFor,
  required,
  optional,
  className = '',
  children,
  ...props
}: FormFieldLabelProps): ReactElement {
  const content = (
    <>
      {children}
      {required && (
        <span className="ff-required" aria-hidden="true">
          {'\u00a0*'}
        </span>
      )}
      {!required && optional && <span className="ff-optional"> {optional}</span>}
    </>
  );
  return target === 'group' ? (
    <span {...props} className={`ff-label ${className}`}>
      {content}
    </span>
  ) : (
    <label {...props} htmlFor={htmlFor} className={`ff-label ${className}`}>
      {content}
    </label>
  );
}

export function FormFieldDescription({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>): ReactElement {
  return <div {...props} className={`ff-description ${className}`} />;
}

export interface FormFieldFeedbackProps extends HTMLAttributes<HTMLDivElement> {
  readonly status?: FieldStatus | undefined;
  readonly statusLabel?: ReactNode;
  /** Suppress when the control already presents the same status glyph. */
  readonly icon?: boolean | undefined;
}

export function FormFieldFeedback({
  status = 'neutral',
  statusLabel,
  icon = true,
  children,
  className = '',
  ...props
}: FormFieldFeedbackProps): ReactElement | null {
  const content =
    children ?? (status === 'neutral' ? null : (statusLabel ?? feedbackLabels[status]));
  if (content === null || content === undefined || content === '') {
    return null;
  }
  const Glyph = status === 'neutral' ? null : feedbackIcons[status];
  return (
    <div {...props} className={`ff-feedback ${className}`} data-status={status}>
      {icon && Glyph && <Glyph className="ff-feedback-icon" size="1em" aria-hidden="true" />}
      <div>{content}</div>
    </div>
  );
}

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  readonly size?: ControlSize | undefined;
  readonly orientation?: 'vertical' | 'horizontal' | undefined;
  readonly target?: 'control' | 'group' | undefined;
  readonly label?: ReactNode;
  readonly htmlFor?: string | undefined;
  readonly labelId?: string | undefined;
  readonly descriptionId?: string | undefined;
  readonly messageId?: string | undefined;
  readonly description?: ReactNode;
  readonly message?: ReactNode;
  readonly status?: FieldStatus | undefined;
  readonly statusLabel?: ReactNode;
  readonly required?: boolean | undefined;
  readonly optional?: ReactNode;
  readonly labelAction?: ReactNode;
  readonly labelAlign?: 'control' | 'start' | 'text' | undefined;
  readonly feedbackIcon?: boolean | undefined;
  readonly reserveMessage?: boolean | undefined;
  /** Presentation only; the example explicitly passes disabled to its native controls. */
  readonly disabled?: boolean | undefined;
}

// Design reference. Explicit IDs keep the preview honest without defining the future scope API.
export function FormField({
  size = 'm',
  orientation = 'vertical',
  target = 'control',
  label,
  htmlFor,
  labelId,
  descriptionId,
  messageId,
  description,
  message,
  status = 'neutral',
  statusLabel,
  required,
  optional,
  labelAction,
  labelAlign = 'control',
  feedbackIcon = true,
  reserveMessage,
  disabled,
  className = '',
  children,
  ...props
}: FormFieldProps): ReactElement {
  const effectiveStatus = disabled ? 'neutral' : status;
  const hasFeedback =
    !disabled &&
    message !== '' &&
    ((message !== undefined && message !== null) || effectiveStatus !== 'neutral');
  return (
    <div
      {...props}
      className={`ff-proto ${className}`}
      data-size={size}
      data-orientation={orientation}
      data-label-align={labelAlign}
      data-disabled={disabled || undefined}
    >
      <div className="ff-layout">
        {(label || labelAction) && (
          <div className="ff-heading">
            {label && (
              <FormFieldLabel
                target={target}
                htmlFor={htmlFor}
                id={labelId}
                required={required}
                optional={optional}
              >
                {label}
              </FormFieldLabel>
            )}
            {labelAction && <span className="ff-label-action">{labelAction}</span>}
          </div>
        )}
        <div className="ff-body">
          <div className="ff-control">{children}</div>
          {(description || hasFeedback || reserveMessage) && (
            <div className="ff-support">
              {description && (
                <FormFieldDescription id={descriptionId}>{description}</FormFieldDescription>
              )}
              {(hasFeedback || reserveMessage) && (
                <div className="ff-feedback-slot" data-reserved={reserveMessage || undefined}>
                  {hasFeedback && (
                    <FormFieldFeedback
                      id={messageId}
                      status={effectiveStatus}
                      statusLabel={statusLabel}
                      icon={feedbackIcon}
                    >
                      {message}
                    </FormFieldFeedback>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
