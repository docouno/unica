import { createRef } from 'react';
import { Textarea } from '../src/index.js';
import type { TextareaProps } from '../src/server.js';

const ref = createRef<HTMLTextAreaElement>();

export const local = {
  ref,
  form: 'draft',
  defaultValue: '',
  'aria-describedby': 'hint feedback count',
  'data-draft': 'short',
  size: 's',
  wrap: 'hard',
  cols: 20,
  style: { height: 140 },
  onChange(event) {
    event.currentTarget.setSelectionRange(0, 1);
  },
} satisfies TextareaProps;

export const fields = (
  <>
    <Textarea {...local} />
    <Textarea value="" onChange={() => undefined} autosize minRows={2} />
    <Textarea aria-label="Note" />
  </>
);

// @ts-expect-error One owner per mounted editor.
export const both = <Textarea value="" defaultValue="Draft" />;
// @ts-expect-error Textarea values are strings.
export const number = <Textarea value={10} />;
// @ts-expect-error Textarea owns aria-invalid through its status.
export const invalid = <Textarea aria-invalid />;
// @ts-expect-error Pass the initial text using defaultValue.
export const children = <Textarea>Draft</Textarea>;
// @ts-expect-error Textarea is a plain text editor.
export const html = <Textarea dangerouslySetInnerHTML={{ __html: 'Draft' }} />;
// @ts-expect-error Feedback belongs to the form composition.
export const label = <Textarea label="Draft" />;
// @ts-expect-error A counter is external.
export const counter = <Textarea counter={10} />;
// @ts-expect-error Save state belongs to the form or button.
export const loading = <Textarea loading />;
// @ts-expect-error Manual resizing is vertical only.
export const resize = <Textarea resize="both" />;
// @ts-expect-error The ref points to the native textarea.
export const wrongRef = <Textarea ref={createRef<HTMLInputElement>()} />;
