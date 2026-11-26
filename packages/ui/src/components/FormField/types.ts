import type { ComponentPropsWithRef, ReactNode } from 'react';
import type { ControlSize, FieldStatus } from '../../core/forms/fieldAxes.js';
import type { DataAttributeValue } from '../../core/passiveRoot.js';

export interface FormFieldProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'dangerouslySetInnerHTML'
> {
  readonly [data: `data-${string}`]: DataAttributeValue;
  readonly target?: 'control' | 'group' | undefined;
  readonly controlId?: string | undefined;
  readonly labelId?: string | undefined;
  readonly size?: ControlSize | undefined;
  readonly orientation?: 'vertical' | 'horizontal' | undefined;
  readonly labelAlign?: 'control' | 'text' | 'start' | undefined;
  readonly status?: FieldStatus | undefined;
  readonly disabled?: boolean | undefined;
  readonly readOnly?: boolean | undefined;
  readonly required?: boolean | undefined;
  readonly reserveMessage?: boolean | undefined;
  readonly feedbackIcon?: boolean | undefined;
  readonly label?: ReactNode;
  readonly optional?: ReactNode;
  readonly labelAction?: ReactNode;
  readonly description?: ReactNode;
  readonly message?: ReactNode;
  readonly counter?: ReactNode;
  readonly statusLabel?: ReactNode;
}

interface LabelOptions {
  readonly required?: boolean | undefined;
  readonly optional?: ReactNode;
}

export type FormFieldLabelProps = LabelOptions &
  (
    | (Omit<ComponentPropsWithRef<'label'>, 'dangerouslySetInnerHTML'> & {
        readonly target?: 'control' | undefined;
      })
    | (Omit<ComponentPropsWithRef<'span'>, 'dangerouslySetInnerHTML'> & {
        readonly target: 'group';
        readonly htmlFor?: never;
      })
  );

export type FormFieldDescriptionProps = ComponentPropsWithRef<'div'>;

export interface FormFieldFeedbackProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'dangerouslySetInnerHTML'
> {
  readonly status?: FieldStatus | undefined;
  readonly statusLabel?: ReactNode;
  readonly icon?: boolean | undefined;
}
