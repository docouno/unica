import { Flex } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { LayoutExample } from './layout.examples.js';
import {
  alignOptions,
  choiceProp,
  directionOptions,
  spacingOptions,
  viewportNote,
} from './layout.options.js';

const flowItemsCode = `<span>Draft</span>\n  <span>In review</span>\n  <span>Ready</span>`;

function FlowItems() {
  return (
    <>
      <span>Draft</span>
      <span>In review</span>
      <span>Ready</span>
    </>
  );
}

const wrapOptions = {
  nowrap: 'nowrap',
  wrap: 'wrap',
  'wrap-reverse': 'wrap-reverse',
  'Tablet wrap': { tablet: 'wrap' },
} as const;

const justifyOptions = {
  start: 'start',
  center: 'center',
  end: 'end',
  'space-between': 'space-between',
  'space-around': 'space-around',
  'space-evenly': 'space-evenly',
  'Desktop space-between': { desktop: 'space-between' },
} as const;

export default defineComponent({
  id: 'flex',
  title: 'Flex',
  category: 'Layout',
  status: 'UI',
  summary: 'Arrange children along one axis with wrapping and alignment. ' + viewportNote,
  props: {
    direction: choiceProp(directionOptions, 'row', 'Main axis and visual direction.'),
    wrap: choiceProp(wrapOptions, 'nowrap', 'Allow items to start a new flex line.'),
    justify: choiceProp(justifyOptions, 'start', 'Distribute space along the main axis.'),
    align: choiceProp(alignOptions, 'stretch', 'Align the items along the cross axis.'),
    gap: choiceProp(spacingOptions, 'Default', 'Space between items and lines. Defaults to 0.'),
  },
  render: ({ ctx, values }) => (
    <LayoutExample>
      <Flex
        {...ctx.subject}
        className="layout-flow"
        style={{ minBlockSize: '6rem' }}
        direction={values.direction === 'row' ? undefined : directionOptions[values.direction]}
        wrap={values.wrap === 'nowrap' ? undefined : wrapOptions[values.wrap]}
        justify={values.justify === 'start' ? undefined : justifyOptions[values.justify]}
        align={values.align === 'stretch' ? undefined : alignOptions[values.align]}
        gap={spacingOptions[values.gap]}
      >
        <FlowItems />
      </Flex>
    </LayoutExample>
  ),
  code: (_, attributes) => `<Flex${attributes} style={{ minBlockSize: '6rem' }}>
  ${flowItemsCode}
</Flex>`,
  matrixViews: [
    {
      id: 'direction-gap',
      title: 'Main axis and spacing',
      rows: 'direction',
      cols: 'gap',
    },
    {
      id: 'alignment',
      title: 'Main-axis and cross-axis alignment',
      rows: 'justify',
      cols: 'align',
      fixed: { gap: '8' },
    },
  ],
  cases: [
    {
      id: 'wrap',
      title: 'A narrow row wraps',
      kind: 'behavior',
      width: 168,
      render: ({ ctx }) => (
        <LayoutExample>
          <Flex {...ctx.subject} gap={16} wrap="wrap" className="layout-flow">
            <FlowItems />
          </Flex>
        </LayoutExample>
      ),
    },
    {
      id: 'source-order',
      title: 'Visual direction and keyboard order',
      kind: 'behavior',
      mode: 'live',
      caption: 'Tab reaches Draft, In review, and Ready in that order.',
      render: ({ ctx }) => (
        <LayoutExample>
          <Flex {...ctx.subject} direction="row-reverse" gap={8} wrap="wrap">
            <button type="button">Draft</button>
            <button type="button">In review</button>
            <button type="button">Ready</button>
          </Flex>
        </LayoutExample>
      ),
    },
  ],
  usage: [
    {
      id: 'record-controls',
      title: 'Wrapping record actions',
      render: ({ ctx }) => (
        <Flex {...ctx.subject} align="center" gap={8} wrap="wrap">
          <button type="button">Open record</button>
          <button type="button">Download</button>
        </Flex>
      ),
      code: `import '@docouno/unica/styles.css';
import { Flex } from '@docouno/unica';

<Flex align="center" gap={8} wrap="wrap">
  <button type="button">Open record</button>
  <button type="button">Download</button>
</Flex>`,
    },
  ],
});
