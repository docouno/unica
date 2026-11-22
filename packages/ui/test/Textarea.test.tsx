import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef, StrictMode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { Textarea } from '../src/index.js';

afterEach(cleanup);

it('forwards the label, ref, styling, form attributes and native change to one editor', () => {
  const ref = createRef<HTMLTextAreaElement>();
  const changes: unknown[] = [];
  render(
    <>
      <form id="draft" />
      <label htmlFor="note">Release note</label>
      <Textarea
        id="note"
        name="note"
        form="draft"
        ref={ref}
        className="custom"
        style={{ fontWeight: 600 }}
        aria-describedby="hint result count"
        data-editor="note"
        required
        defaultValue="Start"
        onChange={(event) => {
          const editor = event.currentTarget;
          changes.push([editor, editor.value, new FormData(editor.form!).get('note')]);
        }}
      />
    </>,
  );

  const editor = screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Release note' });
  expect(ref.current).toBe(editor);
  expect(editor.labels?.[0]?.control).toBe(editor);
  expect(editor.required).toBe(true);
  expect(editor.value).toBe('Start');
  expect(editor.dataset.editor).toBe('note');
  expect(editor.getAttribute('aria-describedby')).toBe('hint result count');
  expect(editor.classList.contains('custom')).toBe(true);
  expect(editor.style.fontWeight).toBe('600');

  fireEvent.change(editor, { target: { value: 'Edited' } });
  expect(changes).toEqual([[editor, 'Edited', 'Edited']]);
  expect(editor.form?.elements).toHaveLength(1);
});

it('keeps the mounted draft and handles callback ref changes and cleanups', () => {
  const initialCleanup = vi.fn();
  const nextCleanup = vi.fn();
  const initialRef = vi.fn(() => initialCleanup);
  const nextRef = vi.fn(() => nextCleanup);
  const view = render(
    <StrictMode>
      <Textarea ref={initialRef} defaultValue="A" aria-label="Draft" />
    </StrictMode>,
  );
  const editor = screen.getByRole<HTMLTextAreaElement>('textbox');
  expect(initialRef).toHaveBeenLastCalledWith(editor);
  fireEvent.change(editor, { target: { value: '' } });
  editor.setSelectionRange(0, 0);

  view.rerender(
    <StrictMode>
      <Textarea ref={nextRef} defaultValue="B" aria-label="Draft" status="danger" />
    </StrictMode>,
  );
  expect(initialCleanup.mock.calls.length).toBe(initialRef.mock.calls.length);
  expect(nextRef).toHaveBeenLastCalledWith(editor);
  expect(editor.value).toBe('');
  expect(editor.defaultValue).toBe('A');
  expect(editor.getAttribute('aria-invalid')).toBe('true');
  view.unmount();
  expect(nextCleanup).toHaveBeenCalledTimes(1);
});

it('normalizes row settings and applies local status to an available editor', () => {
  const view = render(
    <Textarea aria-label="Draft" rows={2.9} readOnly status="danger" defaultValue="Read me" />,
  );
  const editor = screen.getByRole<HTMLTextAreaElement>('textbox');
  expect(editor.rows).toBe(2);
  expect(editor.getAttribute('aria-invalid')).toBe('true');
  expect(editor.parentElement?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');

  view.rerender(
    <Textarea
      aria-label="Draft"
      autosize
      minRows={7}
      maxRows={Infinity}
      status="danger"
      wrap="off"
    />,
  );
  expect(editor.rows).toBe(7);
  expect(editor.style.getPropertyValue('--_textarea-max-rows')).toBe('7');
  expect(editor.parentElement?.querySelector('svg')).toBeNull();

  view.rerender(<Textarea aria-label="Draft" rows={NaN} disabled status="danger" />);
  expect(editor.rows).toBe(3);
  expect(editor.hasAttribute('aria-invalid')).toBe(false);
});

it.each([{ value: 'Initial' }, { defaultValue: 'Initial' }] as const)(
  'provides the initial value to native autoFocus handlers (%o)',
  (props) => {
    const seen: unknown[] = [];
    render(
      <form
        onFocus={(event) => {
          const form = event.currentTarget;
          seen.push([form.querySelector('textarea')?.value, new FormData(form).get('note')]);
        }}
      >
        <Textarea {...props} aria-label="Auto focus" name="note" autoFocus />
      </form>,
    );
    expect(seen).toEqual([['Initial', 'Initial']]);
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Auto focus' }));
  },
);

it('publishes a new controlled value before replacing the callback ref', () => {
  const firstRef = createRef<HTMLTextAreaElement>();
  const view = render(
    <form>
      <Textarea name="note" value="A" ref={firstRef} />
    </form>,
  );
  const editor = firstRef.current;

  const received: unknown[] = [];
  view.rerender(
    <form>
      <Textarea
        name="note"
        value="B"
        ref={(node) => {
          const form = node?.form;
          if (node && form) {
            received.push([node, node.value, new FormData(form).get('note')]);
          }
        }}
      />
    </form>,
  );

  expect(received).toEqual([[editor, 'B', 'B']]);
});
