import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { UsageView } from './UsageView.js';
import { defineComponent } from './types.js';

afterEach(cleanup);

it('shows omitted enum defaults as undefined and keeps public choices with the same spelling', () => {
  const example = defineComponent({
    id: 'example',
    title: 'Example',
    category: 'Examples',
    status: 'UI',
    props: {
      role: {
        kind: 'enum',
        group: 'Semantics',
        description: 'Role for the message.',
        choices: [{ value: 'auto', omit: true }, { value: 'status' }, { value: 'alert' }],
        default: 'auto',
      },
      target: {
        kind: 'enum',
        group: 'Host',
        description: 'Use the default browsing context.',
        choices: [{ value: 'omitted', omit: true }],
        default: 'omitted',
      },
      size: {
        kind: 'enum',
        group: 'Geometry',
        description: 'Space around the message.',
        choices: [{ value: 'auto', omit: true }],
        default: 'auto',
        publicType: 'ResponsiveSize',
      },
      width: {
        kind: 'enum',
        group: 'Geometry',
        description: 'Width of the message.',
        choices: [{ value: 'auto' }, { value: 'full' }],
        default: 'auto',
      },
    },
    render: () => <span>Message</span>,
  });

  render(
    <UsageView
      component={example}
      scenes={[]}
      raw
      itemHref={({ item }) => '?item=' + item}
      navigateItem={() => {}}
    />,
  );

  const table = within(screen.getByRole('table', { name: 'Public props' }));
  const cells = (prop: string) =>
    within(table.getByText(prop, { selector: 'code' }).closest('tr')!)
      .getAllByRole('cell')
      .map((cell) => cell.textContent);
  expect(table.getByRole('columnheader', { name: 'Playground default' })).toBeDefined();
  expect(cells('target').slice(1, 3)).toEqual(['undefined', 'undefined']);
  expect(cells('size').slice(1, 3)).toEqual(['ResponsiveSize', 'undefined']);
  expect(cells('role').slice(1, 3)).toEqual(['"status" | "alert"', 'undefined']);
  expect(cells('width').slice(1, 3)).toEqual(['"auto" | "full"', '"auto"']);
});
