import { Fragment, useState } from 'react';
import { Stack } from '@docouno/unica';
import type { StackProps } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import type { PreviewContext } from '../../workbench/types.js';
import { LayoutExample } from './layout.examples.js';
import {
  alignOptions,
  choiceProp,
  directionOptions,
  spacingOptions,
  viewportNote,
} from './layout.options.js';

const dividers = {
  none: undefined,
  rule: <hr />,
  '0': 0,
} as const;

function StackExample(props: StackProps) {
  return (
    <Stack {...props} className="layout-flow">
      <span>Draft</span>
      {null}
      {0}
      <Fragment key="checks">
        <span>In review</span>
        <span>Ready</span>
      </Fragment>
    </Stack>
  );
}

function DividerToggle({ ctx }: { ctx: PreviewContext }) {
  const [show, setShow] = useState(true);
  return (
    <LayoutExample>
      <label>
        <input type="checkbox" checked={show} onChange={(event) => setShow(event.target.checked)} />{' '}
        Show dividers
      </label>
      <Stack {...ctx.subject} gap={8} divider={show ? <hr /> : undefined}>
        <span>Checklist</span>
        {null}
        <Fragment key="details">
          <label>
            Project name <input defaultValue="Release notes" />
          </label>
          <span>Ready for review</span>
        </Fragment>
      </Stack>
    </LayoutExample>
  );
}

export default defineComponent({
  id: 'stack',
  title: 'Stack',
  category: 'Layout',
  status: 'UI',
  summary: 'Space a sequence of children with optional dividers. ' + viewportNote,
  props: {
    direction: choiceProp(directionOptions, 'column', 'Main axis. Defaults to column.'),
    align: choiceProp(alignOptions, 'stretch', 'Align the items along the cross axis.'),
    gap: choiceProp(spacingOptions, 'Default', 'Space between children. Defaults to 0.'),
    divider: {
      kind: 'slot',
      group: 'Children',
      default: 'none',
      description: 'A React node inserted between non-empty children.',
      choices: [
        { value: 'none', label: 'None' },
        { value: 'rule', label: 'Rule', code: '<hr />' },
        { value: '0', label: 'Numeric zero', code: '0' },
      ],
    },
  },
  render: ({ ctx, values }) => (
    <LayoutExample>
      <StackExample
        {...ctx.subject}
        direction={values.direction === 'column' ? undefined : directionOptions[values.direction]}
        align={values.align === 'stretch' ? undefined : alignOptions[values.align]}
        gap={spacingOptions[values.gap]}
        divider={dividers[values.divider]}
      />
    </LayoutExample>
  ),
  code: (_, attributes) => `import { Fragment } from 'react';

<Stack${attributes}>
  <span>Draft</span>
  {null}
  {0}
  <Fragment key="checks">
    <span>In review</span>
    <span>Ready</span>
  </Fragment>
</Stack>`,
  matrixViews: [
    {
      id: 'divider-gap',
      title: 'Dividers and spacing',
      rows: 'divider',
      cols: 'gap',
    },
  ],
  cases: [
    {
      id: 'normalized-children',
      title: 'Empty children, zero, and fragments',
      kind: 'content',
      caption: 'Zero remains a child. Dividers also appear between children of the fragment.',
      render: ({ ctx }) => (
        <LayoutExample>
          <StackExample {...ctx.subject} gap={8} divider={<hr />} />
        </LayoutExample>
      ),
    },
    {
      id: 'divider-toggle',
      title: 'Toggling dividers',
      kind: 'behavior',
      mode: 'live',
      caption: 'Edit the project name, then toggle dividers. The input keeps its value.',
      render: DividerToggle,
    },
  ],
  usage: [
    {
      id: 'support',
      title: 'Separated help topics',
      render: ({ ctx }) => (
        <LayoutExample>
          <Stack {...ctx.subject} gap={8} divider={<hr />}>
            <a href="#account">Manage your account</a>
            <a href="#billing">Find an invoice</a>
            <a href="#support">Contact support</a>
          </Stack>
        </LayoutExample>
      ),
      code: `import '@docouno/unica/styles.css';
import { Stack } from '@docouno/unica';

<Stack gap={8} divider={<hr />}>
  <a href="#account">Manage your account</a>
  <a href="#billing">Find an invoice</a>
  <a href="#support">Contact support</a>
</Stack>`,
    },
  ],
});
