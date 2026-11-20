import { fieldStatusGlyphs } from '../control-glyphs.js';
import { useId } from 'react';
import type { ComponentPropsWithRef, CSSProperties, ReactElement, ReactNode } from 'react';
import { Icon } from '@docouno/unica';
import type { ControlSize, FieldStatus, FieldVariant } from '../input/input.proto.js';
import { useInputFocus } from '../input/input-focus.proto.js';
import '../input/input.css';
import '../scrollbar/scrollbar.css';
import './textarea.css';

const statusLabels: Record<Exclude<FieldStatus, 'neutral'>, string> = {
  info: 'Information',
  success: 'Valid',
  warning: 'Review this value',
  danger: 'Needs attention',
};

export interface TextareaProps extends ComponentPropsWithRef<'textarea'> {
  readonly size?: ControlSize | undefined;
  readonly variant?: FieldVariant | undefined;
  readonly status?: FieldStatus | undefined;
  readonly width?: 'full' | 'auto' | undefined;
  readonly resize?: 'vertical' | 'none' | undefined;
  readonly autosize?: boolean | undefined;
  readonly minRows?: number | undefined;
  readonly maxRows?: number | undefined;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly message?: ReactNode;
  readonly counter?: ReactNode;
  /** Pins appearance without moving DOM focus. */
  readonly previewState?: 'rest' | 'hover' | 'pointer-focus' | 'keyboard-focus' | undefined;
}

function rowCount(value: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 3;
}

// A native design reference. Final API and reusable form mechanisms belong to the library stage.
export function Textarea({
  size = 'm',
  variant = 'default',
  status = 'neutral',
  width = 'full',
  resize = 'vertical',
  autosize = false,
  minRows = 3,
  maxRows,
  label,
  description,
  message,
  counter,
  id,
  className = '',
  style,
  required,
  disabled,
  hidden,
  rows = 3,
  previewState,
  ...props
}: TextareaProps): ReactElement {
  const generatedId = useId();
  const focusScope = useInputFocus();
  const textareaId = id ?? generatedId;
  const effectiveStatus = disabled ? 'neutral' : status;
  const StatusGlyph = effectiveStatus === 'neutral' ? null : fieldStatusGlyphs[effectiveStatus];
  const footerStatus = props.wrap === 'off';
  const feedback =
    message ??
    (footerStatus && effectiveStatus !== 'neutral' ? statusLabels[effectiveStatus] : undefined);
  const minimum = rowCount(minRows);
  const hasCounter = counter !== undefined && counter !== null;
  const describedBy =
    [
      description ? `${textareaId}-description` : undefined,
      feedback ? `${textareaId}-message` : undefined,
      hasCounter ? `${textareaId}-counter` : undefined,
      props['aria-describedby'],
    ]
      .filter(Boolean)
      .join(' ') || undefined;
  const geometry = {
    '--textarea-rows': rowCount(rows),
    '--textarea-min-rows': minimum,
    '--textarea-max-rows': maxRows === undefined ? 'none' : Math.max(minimum, rowCount(maxRows)),
  } as CSSProperties;
  const control = (
    <span
      ref={focusScope}
      className="textarea-shell-proto"
      data-input-focus-scope=""
      data-size={size}
      data-variant={variant}
      data-status={effectiveStatus}
      data-width={width}
      data-preview={previewState}
      dir={props.dir}
      hidden={hidden}
      style={geometry}
    >
      <textarea
        {...props}
        rows={autosize ? minimum : rowCount(rows)}
        id={textareaId}
        required={required}
        disabled={disabled}
        hidden={hidden}
        className={`textarea-proto scrollbar-proto ${className}`}
        data-autosize={autosize || undefined}
        data-bounded={maxRows !== undefined || undefined}
        data-resize={autosize || disabled ? 'none' : resize}
        style={style}
        aria-invalid={effectiveStatus === 'danger' || props['aria-invalid'] || undefined}
        aria-describedby={describedBy}
      />
      {StatusGlyph && !footerStatus && (
        <span className="textarea-status-proto" aria-hidden="true">
          <Icon className="textarea-message-glyph" usage="slot" icon={StatusGlyph} size={size} />
        </span>
      )}
    </span>
  );
  return label || description || feedback || hasCounter ? (
    <div
      className="form-field-proto textarea-field-proto"
      data-status={effectiveStatus}
      data-width={width}
      hidden={hidden}
    >
      {label && (
        <label className="form-field-label-proto" htmlFor={textareaId}>
          <span>{label}</span>
          {required && (
            <span className="form-field-required-proto" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {control}
      {(description || feedback || hasCounter) && (
        <div className="textarea-support-proto">
          {description && (
            <div id={`${textareaId}-description`} className="form-field-description-proto">
              {description}
            </div>
          )}
          {(feedback || hasCounter) && (
            <div className="textarea-footer-proto">
              {feedback && (
                <div
                  id={`${textareaId}-message`}
                  className="form-field-message-proto textarea-message-proto"
                  data-status-glyph={(footerStatus && !!StatusGlyph) || undefined}
                >
                  {footerStatus && StatusGlyph && (
                    <Icon
                      className="textarea-message-glyph"
                      usage="slot"
                      icon={StatusGlyph}
                      size="inherit"
                    />
                  )}
                  <span>{feedback}</span>
                </div>
              )}
              {hasCounter && (
                <div id={`${textareaId}-counter`} className="textarea-counter-proto">
                  {counter}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  ) : (
    control
  );
}
