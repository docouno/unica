import { defineSpecimen } from '../../workbench/types.js';
import { Card } from '../card/card.proto.js';
import { PopoverContent } from '../popover/popover.proto.js';
import { Text } from '../text/text.proto.js';
import { Title } from '../title/title.proto.js';
import {
  DocumentRows,
  LifecycleExample,
  MediaExample,
  MotionExample,
  ShapeExamples,
  SkeletonCase,
  TypographyExample,
} from './skeleton.examples.js';

export default defineSpecimen({
  id: 'skeleton',
  title: 'Skeleton',
  group: 'Status',
  summary:
    'Quiet silhouettes that hold the place of arriving content. Known structure stays visible.',
  sections: [
    {
      id: 'geometry',
      title: 'Shapes & text rhythm',
      kind: 'matrix',
      caption:
        'Two primitives, no material or status variants. Avatar shapes follow the theme; text follows its line height.',
      render: () => <ShapeExamples />,
    },
    {
      id: 'typography',
      title: 'Text & Title parity',
      kind: 'matrix',
      render: () => <TypographyExample />,
    },
    {
      id: 'media',
      title: 'From silhouette to content',
      kind: 'context',
      render: () => <MediaExample />,
    },
    {
      id: 'lifecycle',
      title: 'Initial, partial & terminal states',
      kind: 'states',
      render: () => <LifecycleExample />,
    },
    {
      id: 'surfaces',
      title: 'Canvas & raised card',
      kind: 'states',
      caption:
        'The same neutral fill on two real surfaces. No borders, shadows, or accent hues on the placeholders.',
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
      title: 'Content inside a floating surface',
      kind: 'states',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'Static panel preview. Its title and material are ready; only the unknown content is loading.',
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
      title: 'Activity & quiet rest',
      kind: 'states',
      render: () => <MotionExample />,
    },
  ],
});
