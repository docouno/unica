import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Calendar } from './calendar.proto.js';
import { DateRangePicker } from './date-picker.components.proto.js';

afterEach(cleanup);

function day(calendar: HTMLElement, date: number): HTMLButtonElement {
  const iso = `2026-09-${String(date).padStart(2, '0')}`;
  const button = calendar.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`);
  if (!button) {
    throw new Error(`Calendar day ${iso} is missing`);
  }
  return button;
}

it('previews a corrected range while retaining the prior selection and error', () => {
  const { container } = render(
    <Calendar
      mode="range"
      minRangeDays={2}
      unavailable={['2026-09-18', '2026-09-19', '2026-09-20']}
    />,
  );
  const first = day(container, 14);
  const blocked = day(container, 22);
  const suggested = day(container, 17);

  fireEvent.click(day(container, 8));
  fireEvent.click(day(container, 11));
  fireEvent.click(first);
  fireEvent.click(blocked);
  fireEvent.focus(suggested);

  expect(suggested.getAttribute('data-candidate')).toBe('true');
  expect(day(container, 16).parentElement?.getAttribute('data-preview-range')).toBe('true');
  expect(blocked.getAttribute('data-rejected')).toBe('true');
  expect(first.getAttribute('data-draft-anchor')).toBe('true');
  expect(day(container, 8).getAttribute('data-edge')).toBe('true');
  expect(day(container, 11).getAttribute('data-edge')).toBe('true');
  expect(container.querySelector('[role="tooltip"]')?.textContent).toBe(
    'This range includes an unavailable date.',
  );
  expect(screen.getByText('First 14 Sept · Preview · 4 days')).toBeTruthy();

  fireEvent.pointerEnter(day(container, 18), { pointerType: 'mouse' });
  expect(container.querySelector('[role="tooltip"]')?.textContent).toBe(
    '18 Sept 2026 is unavailable',
  );
  expect(blocked.getAttribute('data-rejected')).toBe('true');

  fireEvent.click(suggested);

  expect(first.getAttribute('data-edge')).toBe('true');
  expect(suggested.getAttribute('data-edge')).toBe('true');
  expect(blocked.hasAttribute('data-rejected')).toBe(false);
});

it('shows the range in the picker before the second date is confirmed', () => {
  const { container } = render(
    <DateRangePicker
      label="Date window"
      minRangeDays={2}
      unavailable={['2026-09-18']}
      defaultOpen
      previewInline
    />,
  );
  const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Date window' });
  const first = day(container, 14);
  const suggested = day(container, 16);
  const blocked = day(container, 19);

  fireEvent.click(first);
  expect(screen.queryByRole('button', { name: /^(start|end) date/i })).toBeNull();
  fireEvent.pointerEnter(suggested, { pointerType: 'mouse' });

  expect(suggested.getAttribute('data-candidate')).toBe('true');
  expect(day(container, 15).parentElement?.getAttribute('data-preview-range')).toBe('true');
  expect(screen.getByText('First 14 Sept · Preview · 3 days')).toBeTruthy();
  expect(input.value).toBe('');

  fireEvent.click(blocked);
  fireEvent.pointerEnter(suggested, { pointerType: 'mouse' });

  expect(suggested.getAttribute('data-candidate')).toBe('true');
  expect(day(container, 15).parentElement?.getAttribute('data-preview-range')).toBe('true');
  expect(blocked.getAttribute('data-rejected')).toBe('true');
  expect(first.getAttribute('data-edge')).toBe('true');
  expect(input.value).toBe('');

  fireEvent.click(suggested);

  expect(input.value).toBe('14/09/2026 – 16/09/2026');
  expect(container.querySelector('.date-picker-panel-proto')).toBeNull();
});

it('replaces a filled range with two day choices in the same panel', () => {
  const onValueChange = vi.fn();
  const { container } = render(
    <DateRangePicker
      label="Date window"
      defaultValue={['2026-09-11', '2026-09-15']}
      defaultOpen
      previewInline
      onValueChange={onValueChange}
    />,
  );
  const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Date window' });
  const panel = container.querySelector('.date-picker-panel-proto');
  const first = day(container, 15);
  const second = day(container, 8);

  expect(screen.queryByRole('button', { name: /^(start|end) date/i })).toBeNull();
  fireEvent.click(first);
  expect(screen.getByText('First 15 Sept · Choose next date')).toBeTruthy();
  fireEvent.pointerEnter(second, { pointerType: 'mouse' });

  expect(panel).toBeTruthy();
  expect(container.querySelector('.date-picker-panel-proto')).toBe(panel);
  expect(first.getAttribute('data-edge')).toBe('true');
  expect(second.getAttribute('data-candidate')).toBe('true');
  expect(screen.getByText('First 15 Sept · Preview · 8 days')).toBeTruthy();
  expect(input.value).toBe('11/09/2026 – 15/09/2026');
  expect(onValueChange).not.toHaveBeenCalled();

  fireEvent.click(second);

  expect(onValueChange).toHaveBeenCalledExactlyOnceWith(['2026-09-08', '2026-09-15']);
  expect(input.value).toBe('08/09/2026 – 15/09/2026');
  expect(container.querySelector('.date-picker-panel-proto')).toBeNull();
});
