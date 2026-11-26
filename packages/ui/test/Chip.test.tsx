import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Chip, ChipGroup } from '../src/index.js';

afterEach(cleanup);

const items = [
  { value: 'notes', label: 'Notes' },
  { value: 'pages', label: 'Pages' },
] as const;

it('renders names and native default checkedness on the server', () => {
  const html = renderToStaticMarkup(
    <ChipGroup
      aria-labelledby="external"
      description="Choose one."
      defaultValue="rich"
      items={[
        { value: 'rich', label: <strong>Research guide</strong>, textValue: 'Research guide' },
      ]}
    />,
  );
  expect(html).toContain('role="radiogroup"');
  expect(html).toContain('aria-labelledby="external"');
  expect(html).toMatch(/<input[^>]+aria-label="Research guide"[^>]+checked=""/);
});

it('hydrates group descriptions and messages with flow content', async () => {
  const group = (
    <ChipGroup
      label="Formats"
      items={items}
      description={<p>Read this first.</p>}
      status="danger"
      message={<p>Choose a format.</p>}
    />
  );
  const host = document.createElement('div');
  host.innerHTML = renderToString(group);
  document.body.append(host);
  const original = host.querySelector('fieldset');
  const onRecoverableError = vi.fn();
  let root: Root | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(host, group, { onRecoverableError });
      await Promise.resolve();
    });
    expect(host.querySelector('fieldset')).toBe(original);
    expect(host.querySelectorAll('fieldset p')).toHaveLength(2);
    expect(onRecoverableError).not.toHaveBeenCalled();
  } finally {
    act(() => root?.unmount());
    host.remove();
  }
});

it('preserves canceled resets and rearms native change after reset', async () => {
  const chipRef = createRef<HTMLInputElement>();
  const groupRef = createRef<HTMLFieldSetElement>();
  const change = vi.fn();
  const proposal = vi.fn();
  const { getByRole } = render(
    <form aria-label="Filters">
      <Chip
        ref={chipRef}
        defaultChecked
        name="favorites"
        onChange={change}
        onCheckedChange={proposal}
      >
        Favorites
      </Chip>
      <ChipGroup ref={groupRef} name="type" label="Type" items={items} defaultValue="notes" />
    </form>,
  );
  const form = getByRole('form') as HTMLFormElement;
  const favorites = getByRole('checkbox', { name: 'Favorites' }) as HTMLInputElement;
  const pages = getByRole('radio', { name: 'Pages' }) as HTMLInputElement;
  const reset = () =>
    act(async () => {
      form.reset();
      await Promise.resolve();
    });
  expect(chipRef.current).toBe(favorites);
  expect(groupRef.current?.tagName).toBe('FIELDSET');
  fireEvent.click(favorites);
  fireEvent.click(pages);
  document.addEventListener('reset', (event) => event.preventDefault(), { once: true });
  await reset();
  expect(favorites.checked).toBe(false);
  expect(pages.checked).toBe(true);
  await reset();
  expect(favorites.checked).toBe(true);
  expect(pages.checked).toBe(false);
  fireEvent.click(favorites);
  expect(change).toHaveBeenCalledTimes(2);
  expect(proposal.mock.calls).toEqual([[false], [false]]);
});

it('uses committed state in both callbacks and suppresses canceled changes', () => {
  const reported: Array<boolean | FormDataEntryValue | null> = [];
  const { getByRole, getByText } = render(
    <form
      aria-label="Filters"
      onClick={(event) => {
        if ((event.target as Element).textContent === 'Cancel') {
          event.preventDefault();
        }
      }}
    >
      <Chip
        checked={false}
        name="fav"
        onCheckedChange={(next) => reported.push(next)}
        onChange={(event) => reported.push(new FormData(event.currentTarget.form!).get('fav'))}
      >
        Favorites
      </Chip>
      <Chip onCheckedChange={(next) => reported.push(next)}>Cancel</Chip>
    </form>,
  );
  fireEvent.click(getByText('Cancel', { selector: 'label span' }));
  fireEvent.click(getByRole('checkbox', { name: 'Favorites' }));
  expect(reported).toEqual([true, null]);
});

it('keeps accessible override and description precedence on the native elements', () => {
  const { getByRole } = render(
    <>
      <span id="author-label">Author name</span>
      <span id="author-description">Author details</span>
      <Chip
        aria-labelledby="author-label"
        aria-label="Secondary name"
        textValue="Long visible label"
      >
        <strong>Long visible label</strong>
      </Chip>
      <ChipGroup
        label="Formats"
        items={items}
        description="Read this first"
        message="Select one"
        status="danger"
        aria-describedby="author-description author-description"
      />
    </>,
  );
  expect(getByRole('checkbox', { name: 'Author name' })).toBeInstanceOf(HTMLInputElement);
  const group = getByRole('radiogroup', { name: 'Formats' });
  expect(group.getAttribute('aria-invalid')).toBe('true');
  const ids = group.getAttribute('aria-describedby')!.split(' ');
  expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual([
    'Author details',
    'Read this first',
    'Select one',
  ]);
});
