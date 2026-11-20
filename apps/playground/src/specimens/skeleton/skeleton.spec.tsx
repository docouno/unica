import { defineComponent } from '../../workbench/types.js';
import { Card } from '../../prototypes/card/card.proto.js';
import { PopoverContent } from '../../prototypes/popover/popover.proto.js';
import { Text } from '../../prototypes/text/text.proto.js';
import { Title } from '../../prototypes/title/title.proto.js';
import { Skeleton } from '../../prototypes/skeleton/skeleton.proto.js';
import {
  DocumentRows,
  LifecycleExample,
  MediaExample,
  MotionExample,
  ShapeExamples,
  SkeletonCase,
  TypographyExample,
} from '../../prototypes/skeleton/skeleton.examples.js';

export default defineComponent({
  id: 'skeleton',
  title: 'Skeleton',
  category: 'Feedback & Status',
  status: 'Proto',
  summary:
    'Quiet silhouettes that hold the place of arriving content. Known structure stays visible.',
  componentName: 'Skeleton',
  props: {
    shape: {
      kind: 'enum',
      group: 'Geometry',
      default: 'rect',
      description: 'Choose a rectangular or circular placeholder.',
      choices: [{ value: 'rect' }, { value: 'circle' }],
    },
    width: {
      kind: 'number',
      group: 'Geometry',
      default: 96,
      description: 'Inline size of the placeholder in CSS pixels.',
      examples: [32, 96, 180],
    },
    hidden: {
      kind: 'boolean',
      group: 'Availability',
      default: false,
      description: 'Hide the placeholder after its content is available.',
    },
  },
  render: ({ ctx, values }) => <Skeleton {...ctx.subject} {...values} />,
  code: ({ shape, width, hidden }) =>
    `<Skeleton${shape === 'circle' ? ' shape="circle"' : ''} width={${width}}${hidden ? ' hidden' : ''} />`,
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
        <PopoverContent role="presentation" className="skeleton-demo-overlay">
          <Title as="h3" size="heading-s">
            Related documents
          </Title>
          <DocumentRows ready={1} />
          <Text size="caption-l" color="muted">
            Loading remaining documents…
          </Text>
        </PopoverContent>
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
      code: `<article aria-busy={loading}>
  {loading ? <SkeletonText size="body-m" lines={3} /> : <Text>{summary}</Text>}
</article>`,
      title: 'Text & Title parity',
      render: () => <TypographyExample />,
    },
  ],
});
