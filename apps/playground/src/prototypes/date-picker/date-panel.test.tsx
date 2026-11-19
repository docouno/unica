import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DatePicker } from './date-picker.components.proto.js';

afterEach(cleanup);

it('places Today beside the sixth week and commits it from the same panel', () => {
  const onValueChange = vi.fn();
  render(
    <DatePicker
      label="Review date"
      defaultValue="2026-03-30"
      today="2026-09-16"
      defaultOpen
      previewInline
      onValueChange={onValueChange}
    />,
  );

  const dialog = screen.getByRole('dialog', { name: 'Select date' });
  const grid = within(dialog).getByRole('grid', { name: 'March 2026' });
  const rows = within(grid).getAllByRole('row');
  const today = within(dialog).getByRole('button', { name: 'Today' });
  const trigger = screen.getByRole('button', { name: 'Close calendar' });

  expect(rows).toHaveLength(7);
  expect(
    within(rows[6]!)
      .getAllByRole('button')
      .map((button) => button.textContent),
  ).toEqual(['30', '31']);
  expect(today.parentElement).toBe(grid.parentElement);
  expect(grid.contains(today)).toBe(false);
  expect(within(dialog).queryByRole('button', { name: 'Close calendar' })).toBeNull();
  expect(within(dialog).getByRole('status').hasAttribute('data-empty')).toBe(true);

  fireEvent.click(today);

  expect(onValueChange).toHaveBeenCalledExactlyOnceWith('2026-09-16');
  expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Review date' }).value).toBe(
    '16/09/2026',
  );
  expect(screen.queryByRole('dialog', { name: 'Select date' })).toBeNull();
  expect(document.activeElement).toBe(trigger);
});

it('does not offer Today when it is outside the date window', () => {
  render(
    <DatePicker
      label="Review date"
      defaultValue="2026-09-20"
      today="2026-09-16"
      min="2026-09-17"
      defaultOpen
      previewInline
    />,
  );

  expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
});

it('returns focus on trigger dismissal even when the click does not focus it', () => {
  render(<DatePicker label="Review date" defaultOpen previewInline />);

  const calendar = screen.getByRole('dialog', { name: 'Select date' });
  const today = within(calendar).getByRole('button', { name: 'Today' });
  const trigger = screen.getByRole('button', { name: 'Close calendar' });
  today.focus();

  fireEvent.click(trigger);

  expect(screen.queryByRole('dialog', { name: 'Select date' })).toBeNull();
  expect(document.activeElement).toBe(trigger);
});
