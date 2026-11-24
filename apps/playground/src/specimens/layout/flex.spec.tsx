import { Flex, Text } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { RecordActions, ReversedFocusOrder, recordActionsCode } from './flex.examples.js';
import { LayoutExample } from './layout.examples.js';
import {
  alignOptions,
  choiceProp,
  directionOptions,
  spacingValues,
  viewportNote,
} from './layout.options.js';

const flowItemsCode = `<Text as="span" size="body-s">Draft</Text>\n  <Text as="span" size="caption-l">In review</Text>\n  <Text as="span" size="body-s">Ready</Text>`;

function FlowItems() {
  return (
    <>
      <Text as="span" size="body-s">
        Draft
      </Text>
      <Text as="span" size="caption-l">
        In review
      </Text>
      <Text as="span" size="body-s">
        Ready
      </Text>
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
    direction: choiceProp(
      directionOptions,
      'row',
      'Main axis and visual direction.',
      "Responsive<'row' | 'row-reverse' | 'column' | 'column-reverse'>",
    ),
    wrap: choiceProp(
      wrapOptions,
      'nowrap',
      'Allow items to start a new flex line.',
      "Responsive<'nowrap' | 'wrap' | 'wrap-reverse'>",
    ),
    justify: choiceProp(
      justifyOptions,
      'start',
      'Distribute space along the main axis.',
      "Responsive<'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'>",
    ),
    align: choiceProp(
      alignOptions,
      'stretch',
      'Align items along the cross axis.',
      "Responsive<'start' | 'center' | 'end' | 'stretch' | 'baseline'>",
    ),
    gap: choiceProp(spacingValues, '0', 'Space between items and lines.', 'Responsive<Spacing>'),
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
        gap={values.gap === '0' ? undefined : spacingValues[values.gap]}
      >
        <FlowItems />
      </Flex>
    </LayoutExample>
  ),
  code: (_, attributes) => `<Flex${attributes} style={{ minBlockSize: '6rem' }}>
  ${flowItemsCode}
</Flex>`,
  states: [
    {
      id: 'direction-gap',
      title: 'Main axis and reading direction',
      caption:
        'Reversing the axis changes visual order. The three labels keep their order in the document.',
      rows: 'direction',
      fixed: { gap: '8' },
    },
    {
      id: 'alignment',
      title: 'Distribution along the main axis',
      rows: 'justify',
      fixed: { align: 'center', gap: '8' },
    },
    {
      id: 'cross-axis',
      title: 'Alignment across the row',
      caption:
        'Different text sizes make baseline alignment visible. The outlines show how much height each item occupies.',
      rows: 'align',
      fixed: { justify: 'center', gap: '8' },
    },
  ],
  cases: [
    {
      id: 'wrap',
      title: 'A narrow row wraps',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Items move to the next line as soon as their widths and the 16px gap exceed the row.',
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
      reset: true,
      render: ReversedFocusOrder,
    },
  ],
  compositions: [
    {
      id: 'record-controls',
      title: 'Wrapping record actions',
      mode: 'live',
      caption:
        'Open the record or download the same text. When the actions wrap, Download follows Open record.',
      render: RecordActions,
      code: recordActionsCode,
    },
  ],
});
