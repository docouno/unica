import { fireEvent, render } from '@testing-library/react';
import { expect, it } from 'vitest';
import { SelectedPeriod } from './selected-period.js';

it('keeps the accepted year period until its second date is chosen', () => {
  const { container } = render(<SelectedPeriod />);
  const period = () => Array.from(container.querySelectorAll('time'), (date) => date.dateTime);
  const day = (date: string) =>
    container.querySelector<HTMLButtonElement>(`button[data-date="${date}"]`)!;
  fireEvent.click(day('2026-09-30'));
  expect(period()).toEqual(['2026-09-25', '2026-10-07']);
  fireEvent.click(day('2026-10-01'));
  expect(period()).toEqual(['2026-09-30', '2026-10-01']);
  expect(
    Array.from(
      container.querySelectorAll<HTMLElement>('[role="gridcell"][aria-selected="true"] button'),
      (button) => button.dataset.date,
    ),
  ).toEqual(period());
});
