import type { ReactElement } from 'react';
import { cx } from '../../core/cx.js';
import {
  FieldDangerGlyph,
  FieldInfoGlyph,
  FieldSuccessGlyph,
  FieldWarningGlyph,
} from '../../internal/glyphs/index.js';
import { feedbackContent, hasFieldContent } from './content.js';
import type {
  FormFieldDescriptionProps,
  FormFieldFeedbackProps,
  FormFieldLabelProps,
} from './types.js';
import './form-field.css';

const statusGlyphs = {
  info: FieldInfoGlyph,
  success: FieldSuccessGlyph,
  warning: FieldWarningGlyph,
  danger: FieldDangerGlyph,
};

/** A native label for one control or a non-interactive heading for a group. */
export function FormFieldLabel(props: FormFieldLabelProps): ReactElement {
  const { target, required, optional, children, className, htmlFor, ref, ...native } = props;
  const copy = (
    <>
      {children}
      {required && (
        <span className="unica-form-field-required" aria-hidden="true">
          {'\u00a0*'}
        </span>
      )}
      {!required && hasFieldContent(optional) && (
        <span className="unica-form-field-optional"> {optional}</span>
      )}
    </>
  );
  const classNames = cx('unica-form-field-label', className);
  return target === 'group' ? (
    <span {...native} ref={ref} className={classNames}>
      {copy}
    </span>
  ) : (
    <label {...native} ref={ref} htmlFor={htmlFor} className={classNames}>
      {copy}
    </label>
  );
}

/** Persistent instructions that can be referenced from an editor or group. */
export function FormFieldDescription({
  className,
  ...props
}: FormFieldDescriptionProps): ReactElement {
  return <div {...props} className={cx('unica-form-field-description', className)} />;
}

/** Inline semantic feedback with an optional status glyph and localizable fallback. */
export function FormFieldFeedback({
  status = 'neutral',
  statusLabel,
  icon = true,
  children,
  className,
  ...props
}: FormFieldFeedbackProps): ReactElement | null {
  const content = feedbackContent(status, children, statusLabel);
  if (content === null || content === '') {
    return null;
  }

  const Glyph = icon && status !== 'neutral' ? statusGlyphs[status] : null;
  return (
    <div
      {...props}
      className={cx('unica-form-field-feedback', className)}
      data-unica-form-field-status={status}
    >
      {Glyph && <Glyph className="unica-form-field-feedback-glyph" />}
      <div>{content}</div>
    </div>
  );
}
