import { Card, Skeleton, Text, Title } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { previewProps } from '../preview-code.js';
import { dimension, propValues, widthControl } from './skeleton.controls.js';
import {
  DocumentRows,
  LifecycleExample,
  loadingSummaryCode,
  MediaExample,
  MotionExample,
  ShapeExamples,
  SkeletonCase,
  SummaryExample,
} from './skeleton.examples.js';

export default defineComponent({
  id: 'skeleton',
  title: 'Skeleton',
  category: 'Feedback & Status',
  status: 'UI',
  summary:
    'Quiet silhouettes that hold the place of arriving content. Known structure stays visible.',
  componentName: 'Skeleton',
  props: {
    shape: {
      kind: 'enum',
      group: 'Geometry',
      default: 'rect',
      description: 'Choose a rectangular block or a theme-shaped avatar silhouette.',
      choices: [{ value: 'rect' }, { value: 'circle' }],
    },
    width: widthControl,
    height: {
      kind: 'string',
      group: 'Geometry',
      default: '',
      description: 'Block size. Enter pixels or a CSS size. Leave blank for the shape default.',
      examples: ['', '32', '60%'],
    },
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
      affects: ['shape', 'width', 'height'],
      reason: 'A hidden placeholder has no visible geometry and takes up no space.',
    },
  ],
  render: ({ ctx, values: { width, height, ...values } }) => (
    <Skeleton {...ctx.subject} {...values} width={dimension(width)} height={dimension(height)} />
  ),
  code: (values) =>
    `<Skeleton${previewProps(propValues(values), { shape: 'rect', hidden: false })} />`,
  matrixViews: [
    {
      id: 'geometry',
      rows: 'shape',
      cols: 'width',
      title: 'Shapes & text rhythm',
      caption:
        'Two primitives, no material or status variants. Avatar shapes follow the theme; text follows its line height.',
      reference: () => <ShapeExamples />,
    },
  ],
  cases: [
    {
      id: 'media',
      title: 'From silhouette to content',
      kind: 'behavior',
      render: () => <MediaExample />,
    },
    {
      id: 'lifecycle',
      mode: 'live',
      title: 'Initial, partial & terminal states',
      kind: 'behavior',
      render: () => <LifecycleExample />,
    },
    {
      id: 'surfaces',
      title: 'Canvas & raised card',
      caption:
        'The same neutral fill on two real surfaces. No borders, shadows, or accent hues on the placeholders.',
      kind: 'surface',
      render: () => (
        <div className="skeleton-demo-pair">
          <SkeletonCase title="Canvas">
            <div className="skeleton-demo-canvas">
              <DocumentRows />
            </div>
          </SkeletonCase>
          <SkeletonCase title="Card">
            <Card>
              <DocumentRows />
            </Card>
          </SkeletonCase>
        </div>
      ),
    },
    {
      id: 'overlay',
      mode: 'pinned',
      title: 'Content inside a floating surface',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'Static panel preview. Its title and material are ready; only the unknown content is loading.',
      kind: 'surface',
      render: () => (
        <div
          className="unica-overlay-surface skeleton-demo-overlay"
          data-surface="overlay"
          data-skeleton-demo-static
        >
          <Title as="h3" size="heading-s">
            Related documents
          </Title>
          <DocumentRows ready={1} />
          <Text size="caption-l" color="muted">
            Loading remaining documents…
          </Text>
        </div>
      ),
    },
    {
      id: 'motion',
      mode: 'live',
      title: 'Activity & quiet rest',
      kind: 'behavior',
      render: () => <MotionExample />,
    },
  ],
  usage: [
    {
      id: 'typography',
      code: loadingSummaryCode,
      title: 'Reserve space for a loading summary',
      render: () => <SummaryExample />,
    },
  ],
});
