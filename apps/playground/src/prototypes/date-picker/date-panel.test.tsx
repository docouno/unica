import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DatePicker, DateRangePicker } from './date-picker.components.proto.js';

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

  expect(trigger.getAttribute('aria-controls')).toBe(dialog.id);
  expect(rows).toHaveLength(7);
  expect(
    within(rows[6]!)
      .getAllByRole('button')
      .map((button) => button.textContent),
  ).toEqual(['30', '31']);
  expect(today.parentElement).toBe(grid.parentElement);
  expect(grid.contains(today)).toBe(false);
  expect(within(dialog).queryByRole('button', { name: 'Close calendar' })).toBeNull();
  expect(
    dialog.querySelector('.date-picker-panel-feedback-proto')?.hasAttribute('data-empty'),
  ).toBe(true);

  fireEvent.click(today);

  expect(onValueChange).toHaveBeenCalledExactlyOnceWith('2026-09-16');
  expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Review date' }).value).toBe(
    '16/09/2026',
  );
  expect(screen.queryByRole('dialog', { name: 'Select date' })).toBeNull();
  expect(trigger.hasAttribute('aria-controls')).toBe(false);
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

it('describes an unavailable date beside the grid without filling the panel footer', () => {
  render(
    <DatePicker
      label="Review date"
      defaultValue="2026-09-14"
      unavailable={['2026-09-19']}
      defaultOpen
      previewInline
    />,
  );

  const panel = screen.getByRole('dialog', { name: 'Select date' });
  const blocked = within(panel).getByRole('button', { name: /19 Sept 2026.*unavailable/ });
  const footer = panel.querySelector('.date-picker-panel-feedback-proto');
  fireEvent.focus(blocked);

  const tooltip = panel.querySelector('.calendar-date-feedback[popover="manual"]');
  expect(tooltip?.textContent).toBe('19 Sept 2026 is unavailable');
  expect(blocked.getAttribute('aria-describedby')).toBeNull();
  expect(footer?.hasAttribute('data-empty')).toBe(true);

  fireEvent.click(blocked);
  expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Review date' }).value).toBe(
    '14/09/2026',
  );
});

it('describes a rejected range separately from its visual tooltip', () => {
  const onValueChange = vi.fn();
  render(
    <DateRangePicker
      label="Review interval"
      minRangeDays={3}
      defaultOpen
      previewInline
      onValueChange={onValueChange}
    />,
  );

  const panel = screen.getByRole('dialog', { name: 'Choose date range' });
  fireEvent.click(within(panel).getByRole('button', { name: /16 Sept 2026/ }));
  const tooEarly = within(panel).getByRole('button', { name: /17 Sept 2026/ });
  fireEvent.click(tooEarly);
  expect(onValueChange).not.toHaveBeenCalled();

  const descriptionId = tooEarly.getAttribute('aria-describedby');
  const description = descriptionId && document.getElementById(descriptionId);
  expect(description && description.textContent).toBe('Choose at least 3 days.');
  expect(
    within(panel).getByRole('button', {
      name: /17 Sept 2026/,
      description: 'Choose at least 3 days.',
    }),
  ).toBe(tooEarly);
  const tooltip = panel.querySelector('.calendar-date-feedback[popover="manual"]');
  expect(tooltip?.getAttribute('aria-hidden')).toBe('true');
  expect(tooltip?.id).not.toBe(descriptionId);

  fireEvent.click(tooltip!);

  expect(tooEarly.getAttribute('aria-describedby')).toBeNull();
  expect(panel.contains(tooltip)).toBe(true);
  expect(onValueChange).not.toHaveBeenCalled();
});
