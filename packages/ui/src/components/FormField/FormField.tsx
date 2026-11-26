import { useId, useRef } from 'react';
import type { ReactElement } from 'react';
import { cx, dataFlag } from '../../core/cx.js';
import { FormFieldContext } from '../../core/forms/field-context.js';
import type { FormFieldContextValue } from '../../core/forms/field-context.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { feedbackContent, hasFieldContent } from './content.js';
import { observeFeedbackGlyph } from './feedback-glyph.js';
import { FormFieldDescription, FormFieldFeedback, FormFieldLabel } from './parts.js';
import type { FormFieldProps } from './types.js';
import './form-field.css';

/** Bind one editor or group to its label, instructions, and inline feedback. */
export function FormField({
  target = 'control',
  controlId,
  labelId,
  size = 'm',
  orientation = 'vertical',
  labelAlign = 'control',
  status = 'neutral',
  disabled = false,
  readOnly = false,
  required = false,
  reserveMessage = false,
  feedbackIcon = true,
  label,
  optional,
  labelAction,
  description,
  message,
  counter,
  statusLabel,
  className,
  children,
  ...props
}: FormFieldProps): ReactElement {
  const id = useId();
  const fieldStatus = disabled ? 'neutral' : status;
  const feedback = disabled ? null : feedbackContent(fieldStatus, message, statusLabel);
  const hasMessage = feedback !== null && feedback !== '';
  const scope = {
    size,
    status: fieldStatus,
    disabled,
    readOnly,
    required,
    labelId: hasFieldContent(label) ? (labelId ?? `${id}-label`) : undefined,
    descriptionId: hasFieldContent(description) ? `${id}-description` : undefined,
    messageId: hasMessage ? `${id}-message` : undefined,
    counterId: hasFieldContent(counter) ? `${id}-counter` : undefined,
  };
  const context: FormFieldContextValue =
    target === 'group'
      ? { ...scope, target }
      : { ...scope, target, controlId: controlId ?? `${id}-control` };
  const body = useRef<HTMLDivElement>(null);
  const glyphControlId =
    context.target === 'control' && hasMessage && feedbackIcon && fieldStatus !== 'neutral'
      ? context.controlId
      : undefined;
  useIsoLayoutEffect(() => {
    if (glyphControlId !== undefined && body.current) {
      return observeFeedbackGlyph(body.current, glyphControlId);
    }
  }, [glyphControlId]);
  const hasAction = hasFieldContent(labelAction);

  return (
    <div
      {...props}
      className={cx('unica-form-field', className)}
      data-unica-form-field-size={size}
      data-unica-form-field-orientation={orientation}
      data-unica-form-field-align={labelAlign}
      data-unica-form-field-disabled={dataFlag(disabled)}
    >
      <FormFieldContext value={null}>
        <div className="unica-form-field-layout">
          {(scope.labelId !== undefined || hasAction) && (
            <div className="unica-form-field-heading">
              {scope.labelId !== undefined &&
                (context.target === 'control' ? (
                  <FormFieldLabel
                    id={scope.labelId}
                    htmlFor={context.controlId}
                    required={required}
                    optional={optional}
                  >
                    {label}
                  </FormFieldLabel>
                ) : (
                  <FormFieldLabel
                    id={scope.labelId}
                    target="group"
                    required={required}
                    optional={optional}
                  >
                    {label}
                  </FormFieldLabel>
                ))}
              {hasAction && <span className="unica-form-field-action">{labelAction}</span>}
            </div>
          )}
          <div
            ref={body}
            className="unica-form-field-body"
            data-unica-form-field-auto-glyph={dataFlag(glyphControlId !== undefined)}
          >
            <div className="unica-form-field-control">
              <FormFieldContext value={context}>{children}</FormFieldContext>
            </div>
            {(scope.descriptionId || hasMessage || reserveMessage || scope.counterId) && (
              <div className="unica-form-field-support">
                {scope.descriptionId && (
                  <FormFieldDescription id={scope.descriptionId}>
                    {description}
                  </FormFieldDescription>
                )}
                {(hasMessage || reserveMessage || scope.counterId) && (
                  <div
                    className="unica-form-field-result"
                    data-unica-form-field-reserved={dataFlag(reserveMessage)}
                  >
                    {hasMessage && (
                      <FormFieldFeedback
                        id={scope.messageId}
                        status={fieldStatus}
                        icon={feedbackIcon}
                      >
                        {feedback}
                      </FormFieldFeedback>
                    )}
                    {scope.counterId && (
                      <div className="unica-form-field-counter" id={scope.counterId}>
                        {counter}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </FormFieldContext>
    </div>
  );
}
