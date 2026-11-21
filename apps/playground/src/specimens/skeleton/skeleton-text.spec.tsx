import { SkeletonText } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { previewProps } from '../preview-code.js';
import { dimension, propValues, textSizes, widthControl } from './skeleton.controls.js';
import {
  loadingSummaryCode,
  MotionExample,
  SummaryExample,
  TypographyExample,
} from './skeleton.examples.js';

export default defineComponent({
  id: 'skeleton-text',
  title: 'SkeletonText',
  category: 'Feedback & Status',
  status: 'UI',
  summary: 'Reserves the line boxes of arriving text at the matching typography step.',
  componentName: 'SkeletonText',
  props: {
    size: {
      kind: 'enum',
      group: 'Typography',
      default: 'body-m',
      description: 'Use the typography step of the content that will replace the placeholder.',
      choices: textSizes.map((value) => ({ value })),
    },
    lines: {
      kind: 'number',
      group: 'Typography',
      default: 3,
      description: 'Reserve between 1 and 20 lines. Fractional counts round down.',
      examples: [1, 3, 20],
    },
    width: widthControl,
    hidden: {
      kind: 'boolean',
      group: 'Availability',
      default: false,
      description: 'Hide the placeholder after its content is available.',
    },
  },
  constraints: [
    {
      kind: 'ignored',
      when: { hidden: true },
      affects: ['size', 'lines', 'width'],
      reason: 'A hidden placeholder has no visible geometry and takes up no space.',
    },
  ],
  render: ({ ctx, values: { width, ...values } }) => (
    <SkeletonText {...ctx.subject} {...values} width={dimension(width)} />
  ),
  code: (values) =>
    `<SkeletonText${previewProps(propValues(values), { size: 'body-m', lines: 3, hidden: false })} />`,
  matrixViews: [
    {
      id: 'typography',
      title: 'Typography & line count',
      rows: 'size',
      cols: 'lines',
      caption: 'A single line fills the slot. The last line of a multiline block is 60% wide.',
    },
  ],
  cases: [
    {
      id: 'typography',
      title: 'Matching line boxes',
      kind: 'content',
      render: () => <TypographyExample />,
    },
    {
      id: 'motion',
      title: 'Activity & quiet rest',
      mode: 'live',
      kind: 'behavior',
      render: () => <MotionExample />,
    },
  ],
  usage: [
    {
      id: 'summary',
      title: 'Reserve space for a loading summary',
      code: loadingSummaryCode,
      render: () => <SummaryExample />,
    },
  ],
});
