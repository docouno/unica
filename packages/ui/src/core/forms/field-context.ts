import { createContext, useContext } from 'react';
import type { Context } from 'react';
import { warnOnce } from '../devWarning.js';
import type { ControlSize, FieldStatus } from './fieldAxes.js';

interface FieldScope {
  readonly size: ControlSize;
  readonly status: FieldStatus;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly required: boolean;
  readonly labelId: string | undefined;
  readonly descriptionId: string | undefined;
  readonly messageId: string | undefined;
  readonly counterId: string | undefined;
}

export type FormFieldContextValue = FieldScope &
  ({ readonly target: 'control'; readonly controlId: string } | { readonly target: 'group' });

/** Scope for adapters that bind FormField to a native control or a group. */
export const FormFieldContext: Context<FormFieldContextValue | null> =
  createContext<FormFieldContextValue | null>(null);

/** Read the nearest FormField scope from within its control area. */
export function useFormField(): FormFieldContextValue | null {
  return useContext(FormFieldContext);
}

export function fieldControlId(
  field: Extract<FormFieldContextValue, { target: 'control' }> | null,
  id: string | undefined,
): string | undefined {
  if (field && id !== undefined && id !== field.controlId) {
    warnOnce('form-field-control-id', 'Set the control ID on FormField using controlId.');
  }
  return field?.controlId ?? id;
}

export function idRefs(...values: readonly (string | undefined)[]): string | undefined {
  return (
    [...new Set(values.flatMap((value) => value?.match(/[^\t\n\f\r ]+/g) ?? []))].join(' ') ||
    undefined
  );
}

export function fieldDescription(
  field: FormFieldContextValue | null,
  author: string | undefined,
  omitMessage: boolean,
): string | undefined {
  if (!field) {
    return author;
  }

  const { descriptionId, messageId, counterId } = field;
  const authorIds =
    omitMessage && messageId
      ? author
          ?.match(/[^\t\n\f\r ]+/g)
          ?.filter((id) => id !== messageId)
          .join(' ')
      : author;
  return idRefs(authorIds, descriptionId, omitMessage ? undefined : messageId, counterId);
}

export function fieldGroupLabel(
  field: FormFieldContextValue | null,
  author: string | undefined,
): string | undefined {
  return field?.labelId ? idRefs(author, field.labelId) : author;
}
