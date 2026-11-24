import { act, fireEvent, render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { Chip, ChipGroup } from './chip.proto.js';

it('preserves a canceled reset and reports the next change after a completed native reset', async () => {
  const changed = vi.fn();
  const { getByRole } = render(
    <form aria-label="Filters">
      <Chip defaultChecked onChange={changed}>
        Favorites
      </Chip>
      <ChipGroup
        name="type"
        label="Type"
        defaultValue="notes"
        items={[
          { value: 'notes', label: 'Notes' },
          { value: 'pages', label: 'Pages' },
        ]}
      />
    </form>,
  );
  const form = getByRole('form') as HTMLFormElement;
  const favorites = getByRole('checkbox') as HTMLInputElement;
  const pages = getByRole('radio', { name: 'Pages' }) as HTMLInputElement;
  const reset = () =>
    act(async () => {
      form.reset();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  fireEvent.click(favorites);
  fireEvent.click(pages);
  document.addEventListener('reset', (event) => event.preventDefault(), { once: true });
  await reset();
  expect(favorites.checked).toBe(false);
  expect(pages.checked).toBe(true);
  await reset();
  expect(favorites.checked).toBe(true);
  expect(pages.checked).toBe(false);
  expect(changed).toHaveBeenCalledTimes(1);
  fireEvent.click(favorites);
  expect(changed).toHaveBeenCalledTimes(2);
});
