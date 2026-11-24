import { SkeletonText } from '@docouno/unica';
import type { ReactElement } from 'react';
import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PreviewProps, PropSchema } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { previewProps } from '../preview-code.js';
import { dimension, propValues, textSizes, widthControl } from './skeleton.controls.js';
import { SkeletonTextMotionExample, TypographyExample } from './skeleton.examples.js';
import { motionStudy, summaryComposition } from './skeleton.studies.js';

const props = {
  size: {
    kind: 'enum',
    group: 'Geometry',
    default: 'body-m',
    description: 'Use the typography step of the content that will replace the placeholder.',
    choices: textSizes.map((value) => ({ value })),
  },
  lines: {
    kind: 'number',
    group: 'Geometry',
    default: 3,
    publicType: 'number',
    description:
      'Reserve 1–20 whole lines. The default is three. Finite values round down and clamp to this range.',
    examples: [1, 3, 20],
  },
  width: widthControl,
  hidden: {
    kind: 'boolean',
    group: 'Availability',
    default: false,
    description: 'Keep the placeholder in the DOM and remove its line boxes from layout.',
  },
} as const satisfies PropSchema;

function SkeletonTextPreview({
  ctx,
  values: { width, ...values },
}: PreviewProps & { readonly values: ComponentValues<typeof props> }): ReactElement {
  return <SkeletonText {...ctx.subject} {...values} width={dimension(width)} />;
}

export default defineComponent({
  id: 'skeleton-text',
  title: 'SkeletonText',
  category: 'Feedback & Status',
  status: 'UI',
  summary: 'Reserves the line boxes of arriving text at the matching typography step.',
  componentName: 'SkeletonText',
  props,
  constraints: [
    {
      kind: 'ignored',
      when: { hidden: true },
      affects: ['size', 'lines', 'width'],
      reason: 'A hidden placeholder has no visible geometry and takes up no space.',
    },
  ],
  render: withOverlaySurface(SkeletonTextPreview, 'border-box'),
  code: (values) =>
    `<SkeletonText${previewProps(propValues(values), { size: 'body-m', lines: 3, hidden: false })} />`,
  states: [
    {
      id: 'typography',
      title: 'Line height by text size',
      rows: 'size',
      caption:
        'Compare the line height and bar thickness from display to caption. Each sample starts with three lines.',
    },
    {
      id: 'lines',
      title: 'Line count',
      rows: 'lines',
      caption:
        'The examples start at body-m. A single line fills the slot. The last of multiple lines occupies 60% of the width from inline start, including at the 20-line limit.',
    },
  ],
  cases: [
    {
      id: 'typography',
      title: 'Matching line boxes',
      kind: 'content',
      mode: 'pinned',
      caption:
        'The rules mark the edges of one and three lines. Compare their height with the corresponding Text or Title, including larger display sizes.',
      controls: {
        size: { kind: 'enum', label: 'Text size', default: 'body-m', choices: textSizes },
      },
      reset: true,
      render: withOverlaySurface(TypographyExample, 'border-box'),
    },
    motionStudy(SkeletonTextMotionExample),
  ],
  compositions: [summaryComposition('SkeletonText')],
});
