import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useFormValue } from '../src/core/forms/useFormValue.js';

afterEach(cleanup);

it('keeps authority after a rejected proposal throws and delivers subsequent requests', () => {
  const input = document.createElement('input');
  const form = document.createElement('form');
  input.name = 'value';
  form.append(input);
  const calls: [string, FormDataEntryValue | null][] = [];
  const changed = vi.fn((candidate: string) => {
    calls.push([candidate, new FormData(form).get('value')]);
    if (candidate === 'B') {
      throw new Error('consumer callback failed');
    }
  });

  const { result, rerender } = renderHook(
    (value: string) =>
      useFormValue({
        value,
        defaultValue: 'A',
        getControl: () => input,
        write: (value) => {
          input.value = value;
        },
        onChange: changed,
      }),
    { initialProps: 'A' },
  );

  expect(() => act(() => result.current.propose('B'))).toThrow('consumer callback failed');
  expect(input.value).toBe('A');
  rerender('C');
  act(() => result.current.propose('D'));
  expect(calls).toEqual([
    ['B', 'A'],
    ['D', 'C'],
  ]);
  expect(input.value).toBe('C');
});
