import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  Dropzone,
  FileInput,
  FileList,
  FileListItem,
  FormField,
  UnicaProvider,
} from '../src/index.js';

describe('file attachment controls', () => {
  it('renders a closed native carrier and a labelable target on the server', () => {
    const container = document.createElement('div');
    container.innerHTML = renderToStaticMarkup(
      <form>
        <FormField label="Evidence" controlId="evidence" required>
          <FileInput name="evidence" />
        </FormField>
        <FormField label="Additional files" controlId="extra" required>
          <Dropzone name="extra" description="Signed copies" />
        </FormField>
      </form>,
    );
    const form = container.querySelector('form')!;
    const labels = Array.from(form.querySelectorAll('label'), ({ control }) => control?.tagName);
    expect(labels).toEqual(['BUTTON', 'INPUT']);
    const nativeInputs = Array.from(form.querySelectorAll('input'));
    expect(nativeInputs.every(({ disabled }) => disabled)).toBe(true);
    expect(Array.from(new FormData(form))).toEqual([]);
    expect(form.checkValidity()).toBe(true);
  });

  it('associates explicit field semantics with the compact target and delegates the carrier ref', async () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <FormField
        label="Local document"
        controlId="document"
        description="Required by the team"
        status="danger"
      >
        <FileInput ref={ref} name="document" status="neutral" aria-describedby="outside" />
        <span id="outside">Additional context</span>
      </FormField>,
    );
    const picker = screen.getByRole('button', { name: 'Choose file Local document' });
    expect(picker.id).toBe('document');
    expect(picker.hasAttribute('aria-invalid')).toBe(false);
    expect(picker.getAttribute('aria-describedby')).toContain('outside');
    expect(ref.current?.type).toBe('file');
    expect(ref.current?.name).toBe('document');
    ref.current?.focus();
    await Promise.resolve();
    expect(document.activeElement).toBe(picker);
  });

  it('keeps saved rows independent and preserves pending removal actions without callbacks', () => {
    const onRemove = vi.fn();
    const onRetry = vi.fn();
    render(
      <FileList aria-label="Attachments" size="s">
        <FileListItem name="stored.md" href="#stored" readOnly onRemove={onRemove} />
        <FileListItem
          name="local.md"
          state={{ phase: 'failed', reason: 'Connection lost', progress: 42 }}
          removing
          onRemove={onRemove}
          onRetry={onRetry}
        />
      </FileList>,
    );
    expect(screen.getByRole('link', { name: 'stored.md' }).getAttribute('download')).toBe(
      'stored.md',
    );
    expect(screen.queryByText('Selected locally')).toBeNull();
    expect(screen.queryByText('Connection lost')).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByText('Removing…')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Remove .*local[.]md/ }));
    expect(onRemove).not.toHaveBeenCalled();
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('keeps built-in attachment glyphs when the application adapter hides its icons', () => {
    const adapter = vi.fn(() => null);
    const { container } = render(
      <UnicaProvider iconAdapter={adapter}>
        <FileList aria-label="Attachments">
          <FileListItem name="stored.md" state={{ phase: 'success' }} onRemove={() => {}} />
        </FileList>
      </UnicaProvider>,
    );
    const row = within(container).getByRole('listitem');
    expect(row.querySelectorAll('svg')).toHaveLength(3);
    expect(
      within(row)
        .getByRole('button', { name: /Remove .*stored[.]md/ })
        .querySelector('svg'),
    ).toBeTruthy();
    expect(adapter).not.toHaveBeenCalled();
  });
});
