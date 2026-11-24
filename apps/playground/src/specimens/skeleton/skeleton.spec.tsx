import { Card, Skeleton, Text, Title } from '@docouno/unica';
import type { ReactElement } from 'react';
import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PreviewProps, PropSchema, Values } from '../../workbench/types.js';
import { previewProps } from '../preview-code.js';
import { ExampleSurface } from '../shared/example-surface.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { dimension, propValues, skeletonPhases, widthControl } from './skeleton.controls.js';
import {
  DocumentRows,
  ShapeExamples,
  SkeletonCase,
  SkeletonMotionExample,
} from './skeleton.examples.js';
import { SkeletonLifecycleExample } from './skeleton-lifecycle.js';
import { SkeletonMediaExample } from './skeleton-media.js';
import { LoadingSummary } from './loading-summary.js';
import summarySource from './loading-summary.tsx?raw';

const props = {
  shape: {
    kind: 'enum',
    group: 'Geometry',
    default: 'rect',
    description:
      'A rectangle fills the available width. The avatar silhouette defaults to a 40px square in Pixel and a 40px circle in Soft and Frost.',
    choices: [{ value: 'rect' }, { value: 'circle' }],
  },
  width: widthControl,
  height: {
    kind: 'string',
    group: 'Geometry',
    default: '',
    publicType: "CSSProperties['blockSize']",
    description:
      'Logical height in CSS pixels or a CSS size. A rectangle defaults to 16px. An avatar defaults to its width. The example resolves percentage heights against an 80px slot.',
    examples: ['', '32', '60%'],
  },
  hidden: {
    kind: 'boolean',
    group: 'Availability',
    default: false,
    description: 'Keep the placeholder mounted and remove it from layout.',
  },
} as const satisfies PropSchema;

const slotHeight = 80;

function needsHeightSlot({ height }: Values): boolean {
  return typeof height === 'string' && height.includes('%');
}

function SkeletonPreview({
  ctx,
  values,
}: PreviewProps & { readonly values: ComponentValues<typeof props> }): ReactElement {
  const { width, height, ...rest } = values;
  const placeholder = (
    <Skeleton {...ctx.subject} {...rest} width={dimension(width)} height={dimension(height)} />
  );
  return needsHeightSlot(values) ? (
    <div hidden={values.hidden} style={{ inlineSize: '100%', blockSize: slotHeight }}>
      {placeholder}
    </div>
  ) : (
    placeholder
  );
}

export default defineComponent({
  id: 'skeleton',
  title: 'Skeleton',
  category: 'Feedback & Status',
  status: 'UI',
  summary:
    'Quiet silhouettes that hold the place of arriving content. Known structure stays visible.',
  componentName: 'Skeleton',
  props,
  constraints: [
    {
      kind: 'ignored',
      when: { hidden: true },
      affects: ['shape', 'width', 'height'],
      reason: 'A hidden placeholder has no visible geometry and takes up no space.',
    },
  ],
  render: withOverlaySurface(SkeletonPreview, 'border-box'),
  code: (values) => {
    const placeholder = `<Skeleton${previewProps(propValues(values), { shape: 'rect', hidden: false })} />`;
    return needsHeightSlot(values)
      ? `<div${values.hidden ? ' hidden' : ''} style={{ inlineSize: '100%', blockSize: ${slotHeight} }}>${placeholder}</div>`
      : placeholder;
  },
  states: [
    {
      id: 'geometry',
      rows: 'shape',
      cols: 'width',
      title: 'Shape and width',
      caption:
        'A rectangle keeps its default height as the width changes. An avatar silhouette keeps a 1:1 aspect ratio until you supply a height.',
    },
  ],
  cases: [
    {
      id: 'silhouettes',
      title: 'Shapes and text rhythm',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Avatar placeholders follow the theme at each size. A rectangular media slot reserves its height; text placeholders follow the line boxes of the content.',
      render: withOverlaySurface(ShapeExamples, 'border-box'),
    },
    {
      id: 'media',
      title: 'From silhouette to content',
      kind: 'behavior',
      mode: 'live',
      caption:
        'The two cards reserve the same 16:9 image slot, title, description and author row. When only the image is pending, the text stays available.',
      controls: {
        mediaOnly: { kind: 'boolean', label: 'Image only', default: false },
        loaded: { kind: 'boolean', label: 'Show loaded content', default: false },
      },
      reset: true,
      render: withOverlaySurface(SkeletonMediaExample, 'border-box'),
    },
    {
      id: 'lifecycle',
      title: 'Initial, partial and terminal states',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Replay reveals the first document before the remaining two. A fast response arrives before the 200 ms placeholder delay. Retry a failed request or refresh a loaded card to keep its existing rows in place.',
      controls: {
        phase: {
          kind: 'enum',
          label: 'Preview state',
          default: 'initial',
          choices: skeletonPhases,
        },
      },
      actions: [
        { id: 'replay', label: 'Replay load' },
        { id: 'fast', label: 'Fast response' },
      ],
      reset: true,
      render: withOverlaySurface(SkeletonLifecycleExample, 'border-box'),
    },
    {
      id: 'surfaces',
      title: 'Canvas and raised card',
      caption:
        'Compare the same document rows on canvas and Card. The host supplies the material behind each placeholder.',
      mode: 'pinned',
      kind: 'surface',
      render: withOverlaySurface(
        ({ ctx }) => (
          <div className="skeleton-demo-pair" data-skeleton-demo-static>
            <SkeletonCase title="Canvas">
              <div className="skeleton-demo-canvas" data-surface="base">
                <DocumentRows subject={ctx.subject} />
              </div>
            </SkeletonCase>
            <SkeletonCase title="Card">
              <Card>
                <DocumentRows subject={ctx.subject} />
              </Card>
            </SkeletonCase>
          </div>
        ),
        'border-box',
      ),
    },
    {
      id: 'overlay',
      mode: 'pinned',
      title: 'Content inside a floating surface',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'The panel title and first document are available while the remaining rows wait for content.',
      kind: 'surface',
      render: ({ ctx }) => (
        <div style={{ inlineSize: 'min(100%, 400px)' }} data-skeleton-demo-static>
          <ExampleSurface surface={ctx.surface} sizing="border-box">
            <Title as="h3" size="heading-s">
              Related documents
            </Title>
            <DocumentRows subject={ctx.subject} ready={1} />
            <Text size="caption-l" color="muted">
              <bdi>Loading remaining documents…</bdi>
            </Text>
          </ExampleSurface>
        </div>
      ),
    },
    {
      id: 'motion',
      mode: 'live',
      title: 'Activity and quiet rest',
      kind: 'behavior',
      caption:
        'A diagonal band sweeps across the live placeholders twice, then rests. RTL mirrors its direction. The static reference shows the fill under reduced motion.',
      actions: [{ id: 'replay', label: 'Replay motion' }],
      reset: true,
      render: withOverlaySurface(SkeletonMotionExample, 'border-box'),
    },
  ],
  compositions: [
    {
      id: 'typography',
      title: 'Reserve space for a loading summary',
      mode: 'live',
      caption:
        'A document icon and three lines reserve space for the summary. Its loading status stays outside the busy article.',
      controls: {
        loaded: { kind: 'boolean', label: 'Show loaded summary', default: false },
      },
      reset: true,
      code: summarySource,
      render: withOverlaySurface(
        ({ ctx }) => (
          <LoadingSummary
            loading={ctx.story?.controls.loaded !== true}
            announce={!ctx.comparing}
            skeletonProps={ctx.subject}
          />
        ),
        'border-box',
      ),
    },
  ],
});
