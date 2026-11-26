import { createRef } from 'react';
import {
  FormField,
  FormFieldContext,
  FormFieldDescription,
  FormFieldFeedback,
  FormFieldLabel,
  useFormField,
} from '../src/index.js';
import type {
  FormFieldContextValue,
  FormFieldDescriptionProps,
  FormFieldFeedbackProps,
  FormFieldLabelProps,
  FormFieldProps,
} from '../src/server.js';

const field: FormFieldProps = {
  ref: createRef<HTMLDivElement>(),
  id: 'row',
  controlId: 'email',
  description: 'Instructions',
  feedbackIcon: undefined,
  message: <span>Feedback</span>,
  counter: 0,
};
const label: FormFieldLabelProps = { ref: createRef<HTMLLabelElement>(), htmlFor: 'email' };
const description: FormFieldDescriptionProps = { ref: createRef<HTMLDivElement>() };
const feedback: FormFieldFeedbackProps = { ref: createRef<HTMLDivElement>(), status: 'success' };

function Adapter() {
  const value: FormFieldContextValue | null = useFormField();
  return (
    <input
      id={value?.target === 'control' ? value.controlId : undefined}
      aria-describedby={value?.descriptionId}
    />
  );
}

export const parts = (
  <>
    <FormField {...field}>
      <Adapter />
    </FormField>
    <FormFieldLabel {...label}>Contact</FormFieldLabel>
    <FormFieldLabel target="group" ref={createRef<HTMLSpanElement>()}>
      Contact options
    </FormFieldLabel>
    <FormFieldDescription {...description}>Help</FormFieldDescription>
    <FormFieldFeedback {...feedback} />
    <FormFieldContext value={null}>
      <Adapter />
    </FormFieldContext>
  </>
);

// @ts-expect-error Group headings are not native labels.
export const groupWithFor = <FormFieldLabel target="group" htmlFor="first" />;
// @ts-expect-error Editor values belong to the control.
export const ownsValue = <FormField value="text" />;
// @ts-expect-error Material belongs to the theme.
export const material = <FormField appearance="glass" />;
// @ts-expect-error Preview state belongs to examples.
export const pinned = <FormField previewState="focus" />;
