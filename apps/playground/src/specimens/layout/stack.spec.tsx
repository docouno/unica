import { Fragment } from 'react';
import { Divider, Stack, Text } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { LayoutExample } from './layout.examples.js';
import {
  alignOptions,
  choiceProp,
  directionOptions,
  spacingValues,
  viewportNote,
} from './layout.options.js';
import { DividerToggle, HelpTopics, NormalizedChildren, helpTopicsCode } from './stack.examples.js';

const dividers = {
  none: undefined,
  rule: <Divider style={{ flex: '1 1 0' }} />,
  '0': 0,
} as const;

export default defineComponent({
  id: 'stack',
  title: 'Stack',
  category: 'Layout',
  status: 'UI',
  summary: 'Space a sequence of children with optional dividers. ' + viewportNote,
  props: {
    direction: choiceProp(
      directionOptions,
      'column',
      'Main axis and visual order.',
      "Responsive<'row' | 'row-reverse' | 'column' | 'column-reverse'>",
    ),
    align: choiceProp(
      alignOptions,
      'stretch',
      'Alignment across the main axis.',
      "Responsive<'start' | 'center' | 'end' | 'stretch' | 'baseline'>",
    ),
    gap: choiceProp(
      spacingValues,
      '0',
      'Space between consecutive children and dividers.',
      'Responsive<Spacing>',
    ),
    divider: {
      kind: 'slot',
      group: 'Content',
      default: 'none',
      publicType: 'ReactNode',
      description: 'A node inserted between consecutive non-empty children.',
      choices: [
        { value: 'none', label: 'None' },
        { value: 'rule', label: 'Rule', code: "<Divider style={{ flex: '1 1 0' }} />" },
        { value: '0', label: 'Numeric zero', code: '0' },
      ],
    },
  },
  render: withOverlaySurface(({ ctx, values }) => (
    <LayoutExample>
      <Stack
        {...ctx.subject}
        className="layout-flow"
        direction={values.direction === 'column' ? undefined : directionOptions[values.direction]}
        align={values.align === 'stretch' ? undefined : alignOptions[values.align]}
        gap={values.gap === '0' ? undefined : spacingValues[values.gap]}
        divider={dividers[values.divider]}
      >
        <Text as="span" size="body-s">
          Draft
        </Text>
        <Fragment key="checks">
          <Text as="span" size="caption-l">
            In review
          </Text>
          <Text as="span" size="body-s">
            Ready
          </Text>
        </Fragment>
      </Stack>
    </LayoutExample>
  )),
  code: ({ divider }, attributes) => `import { Fragment } from 'react';
import { ${divider === 'rule' ? 'Divider, ' : ''}Stack, Text } from '@docouno/unica';

<Stack${attributes}>
  <Text as="span" size="body-s">Draft</Text>
  <Fragment key="checks">
    <Text as="span" size="caption-l">In review</Text>
    <Text as="span" size="body-s">Ready</Text>
  </Fragment>
</Stack>`,
  states: [
    {
      id: 'divider-gap',
      title: 'Inserting a divider',
      rows: 'divider',
      fixed: { gap: '8' },
      caption:
        'A rule or the number zero occupies one position between adjacent items. The 8px gap applies on both sides.',
    },
    {
      id: 'spacing',
      title: 'Space between children',
      rows: 'gap',
      fixed: { divider: 'none' },
    },
    {
      id: 'direction',
      title: 'Dividers along the main axis',
      rows: 'direction',
      fixed: { divider: 'rule', gap: '4' },
      caption:
        'The rule separates rows in a column. In a row it fills the remaining space between labels.',
    },
  ],
  cases: [
    {
      id: 'normalized-children',
      title: 'Empty children, zero, and fragments',
      kind: 'content',
      mode: 'pinned',
      caption:
        'The empty child takes no space. Zero counts as one child and the fragment contributes two, giving four items and three separators.',
      render: withOverlaySurface(NormalizedChildren),
    },
    {
      id: 'divider-toggle',
      title: 'Toggling dividers while editing',
      kind: 'behavior',
      mode: 'live',
      caption: 'Edit the project name, then toggle dividers. The input keeps its value.',
      controls: { showDividers: { kind: 'boolean', label: 'Show dividers', default: true } },
      reset: true,
      render: withOverlaySurface(DividerToggle),
    },
  ],
  compositions: [
    {
      id: 'support',
      title: 'Separated help topics',
      mode: 'live',
      caption:
        'The links lead to three sections of the layout guide. Each divider separates two topics.',
      render: withOverlaySurface(HelpTopics),
      code: helpTopicsCode,
    },
  ],
});
