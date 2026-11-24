import { Card, CardMedia, Skeleton, SkeletonText, Text, Title } from '@docouno/unica';
import type { ReactElement } from 'react';
import { Avatar } from '../../prototypes/avatar/avatar.proto.js';
import type { PreviewContext, PreviewProps } from '../../workbench/types.js';
import { SkeletonCase } from './skeleton.examples.js';

function ReportCard({
  loading,
  mediaOnly = false,
  subject,
}: {
  readonly loading: boolean;
  readonly mediaOnly?: boolean;
  readonly subject?: PreviewContext['subject'];
}): ReactElement {
  return (
    <Card className="skeleton-demo-report" aria-busy={(loading && !mediaOnly) || undefined}>
      <CardMedia
        className="skeleton-demo-media"
        style={{ marginBlock: 0 }}
        aria-busy={(loading && mediaOnly) || undefined}
      >
        {loading ? (
          <Skeleton {...subject} className="skeleton-demo-media-fill" />
        ) : (
          <img
            src="/assets/skeleton-report-landscape.svg"
            alt="Abstract green mountain landscape"
            width={720}
            height={405}
          />
        )}
      </CardMedia>
      <div className="skeleton-demo-copy">
        {loading && !mediaOnly ? (
          <SkeletonText size="heading-s" lines={1} width="78%" />
        ) : (
          <Title as="h3" size="heading-s" truncate>
            Field notes
          </Title>
        )}
        {loading && !mediaOnly ? (
          <SkeletonText size="body-s" lines={2} />
        ) : (
          <Text
            size="body-s"
            color="secondary"
            lineClamp={2}
            className="skeleton-demo-report-description"
          >
            <bdi>Observations on quieter, more thoughtful interfaces.</bdi>
          </Text>
        )}
      </div>
      <div className="skeleton-demo-author">
        {loading && !mediaOnly ? (
          <Skeleton shape="circle" width={24} />
        ) : (
          <Avatar size="xs" name="Design studio" alt="" />
        )}
        {loading && !mediaOnly ? (
          <SkeletonText size="caption-l" lines={1} width="48%" />
        ) : (
          <Text size="caption-l" color="muted" truncate>
            Design studio
          </Text>
        )}
      </div>
    </Card>
  );
}

export function SkeletonMediaExample({ ctx }: PreviewProps): ReactElement {
  const loaded = ctx.story?.controls.loaded === true;
  const mediaOnly = ctx.story?.controls.mediaOnly === true;

  return (
    <div className="skeleton-demo-pair">
      <SkeletonCase
        title={loaded ? 'Content arrived' : mediaOnly ? 'Waiting for image' : 'Waiting for content'}
      >
        <ReportCard loading={!loaded} mediaOnly={mediaOnly} subject={ctx.subject} />
      </SkeletonCase>
      <SkeletonCase title="Ready reference">
        <ReportCard loading={false} />
      </SkeletonCase>
    </div>
  );
}
