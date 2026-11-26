import { NumberInput } from '@docouno/unica';
import type { NumberInputProps } from '@docouno/unica';
import { useId } from 'react';
import type { ReactElement, ReactNode } from 'react';
import type { PreviewContext } from '../../workbench/types.js';
import './number-input.examples.css';

interface NumberFieldProps extends NumberInputProps {
  readonly subject?: PreviewContext['subject'];
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly message?: ReactNode;
}

export function NumberField({
  subject,
  label,
  description,
  message,
  id,
  size = 'm',
  status = 'neutral',
  'aria-describedby': describedBy,
  ...props
}: NumberFieldProps): ReactElement {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const descriptionId = description ? fieldId + '-description' : undefined;
  const messageId = message ? fieldId + '-message' : undefined;
  const control = (
    <div {...subject} className="number-measure" data-width={props.width}>
      <NumberInput
        {...props}
        id={fieldId}
        size={size}
        status={status}
        aria-describedby={
          [describedBy, descriptionId, messageId].filter(Boolean).join(' ') || undefined
        }
      />
    </div>
  );
  if (!label && !description && !message) {
    return control;
  }
  return (
    <div className="number-example-field" data-size={size} data-width={props.width}>
      {label && (
        <label className="number-example-label" htmlFor={fieldId}>
          <bdi>{label}</bdi>
          {props.required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      {control}
      {(description || message) && (
        <div className="number-example-support">
          {description && <div id={descriptionId}>{description}</div>}
          {message && (
            <div id={messageId} data-status={props.disabled ? 'neutral' : status}>
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
