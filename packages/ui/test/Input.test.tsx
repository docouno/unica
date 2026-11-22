import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode, createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { Input } from '../src/index.js';
import type { InputProps } from '../src/index.js';

afterEach(cleanup);

it('forwards native props and the ref to the sole form control', () => {
  const ref = createRef<HTMLInputElement>();
  const { container } = render(
    <form>
      <label htmlFor="contact">Contact</label>
      <Input
        id="contact"
        name="email"
        ref={ref}
        defaultValue="user@example.com"
        type="email"
        autoComplete="email"
        aria-describedby="hint"
        data-ticket={42}
        data-unica-input-focus="pointer"
        status="danger"
        dir="rtl"
        className="contact"
        style={{ inlineSize: 240 }}
        clearable
      />
      <p id="hint">Use your work email.</p>
    </form>,
  );
  const node = screen.getByLabelText<HTMLInputElement>('Contact');
  expect(ref.current).toBe(node);
  expect(container.querySelectorAll('input')).toHaveLength(1);
  expect(node.type).toBe('email');
  expect(node.autocomplete).toBe('email');
  expect(node.dir).toBe('rtl');
  expect(node.dataset.ticket).toBe('42');
  expect(node.hasAttribute('data-unica-input-focus')).toBe(false);
  expect(node.getAttribute('aria-invalid')).toBe('true');
  expect(node.getAttribute('aria-describedby')).toBe('hint');
  expect(node.parentElement?.classList.contains('contact')).toBe(true);
  expect(node.parentElement?.style.inlineSize).toBe('240px');
  expect(node.parentElement?.dir).toBe('rtl');
  expect(node.validity.valid).toBe(true);
  expect(new FormData(node.form!).get('email')).toBe('user@example.com');
  expect(screen.getByRole('button', { name: 'Clear value' }).getAttribute('aria-controls')).toBe(
    'contact',
  );
});

it('cleans up a React 19 callback ref and replaces unsupported JavaScript types', () => {
  const release = vi.fn();
  const ref = vi.fn(() => release);
  const { unmount } = render(
    <StrictMode>
      <Input ref={ref} type={'checkbox' as InputProps['type']} aria-label="Name" />
    </StrictMode>,
  );
  const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Name' });
  expect(input.type).toBe('text');
  expect(ref).toHaveBeenLastCalledWith(input);
  unmount();
  expect(release.mock.calls.length).toBe(ref.mock.calls.length);
});

it('renders a deterministic aria-controls target and a default value before hydration', () => {
  const source = renderToString(
    <>
      <Input aria-label="First" defaultValue="alpha" clearable />
      <Input
        aria-label="Second"
        value="beta"
        defaultValue="ignored"
        status="danger"
        disabled
        clearable
      />
    </>,
  );
  const document = new DOMParser().parseFromString(source, 'text/html');
  const inputs = [...document.querySelectorAll('input')];
  const buttons = [...document.querySelectorAll('button')];
  expect(inputs.map((node) => node.defaultValue)).toEqual(['alpha', 'beta']);
  expect(inputs[0]?.id).toBeTruthy();
  expect(inputs[0]?.id).not.toBe(inputs[1]?.id);
  expect(buttons.map((button) => button.getAttribute('aria-controls'))).toEqual(
    inputs.map((node) => node.id),
  );
  expect(inputs[1]?.hasAttribute('aria-invalid')).toBe(false);
});

it('reports the real React change before Clear and returns focus to the input', async () => {
  const calls: string[] = [];
  const input = createRef<HTMLInputElement>();
  render(
    <form>
      <Input
        ref={input}
        aria-label="Name"
        clearLabel="  Clear name "
        name="name"
        clearable
        defaultValue="initial"
        onChange={(event) => {
          expect(event.target).toBe(input.current);
          expect(event.currentTarget).toBe(input.current);
          expect(new FormData(event.currentTarget.form!).get('name')).toBe('');
          calls.push(event.currentTarget.value);
        }}
        onClear={() => calls.push('clear')}
      />
    </form>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Clear name' }));
  expect(calls).toEqual(['', 'clear']);
  expect(input.current?.value).toBe('');
  await Promise.resolve();
  expect(document.activeElement).toBe(input.current);
});
