import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Avatar, Flex, Skeleton, SkeletonText, Stack, Text, Title } from '@docouno/unica';
import type { TextSize, TitleSize } from '@docouno/unica';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { PreviewContext, PreviewProps } from '../../workbench/types.js';
import { textSizes } from './skeleton.controls.js';
import type { TextStep } from './skeleton.controls.js';
import './skeleton.examples.css';

export function SkeletonCase({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <figure className="skeleton-demo-case">
      <figcaption>
        <Text as="span" size="caption-l" color="muted">
          <bdi>{title}</bdi>
        </Text>
      </figcaption>
      {children}
    </figure>
  );
}

export function ShapeExamples({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="skeleton-demo-stack" data-skeleton-demo-static>
      <SkeletonCase title="Avatar silhouettes">
        <Flex align="end" wrap="wrap" gap={16}>
          {([20, 24, 32, 40, 48] as const).map((width) => (
            <Stack key={width} align="center" gap={4}>
              <Skeleton {...ctx.subject} shape="circle" width={width} />
              <Text as="span" size="caption-s" tabularNums>
                <bdi>{width}px</bdi>
              </Text>
            </Stack>
          ))}
        </Flex>
      </SkeletonCase>
      <div className="skeleton-demo-pair">
        <SkeletonCase title="Block · 100% × 80">
          <Skeleton {...ctx.subject} height={80} />
        </SkeletonCase>
        <SkeletonCase title="Text · body-m, 3 lines">
          <SkeletonText />
        </SkeletonCase>
      </div>
      <SkeletonCase title="One line stays full width">
        <SkeletonText size="body-s" lines={1} />
      </SkeletonCase>
    </div>
  );
}

export function MetricText({
  size,
  lines,
}: {
  readonly size: TextStep;
  readonly lines: number;
}): ReactElement {
  const words =
    lines === 1 ? (
      'Aa'
    ) : (
      <>
        Aa
        <br />
        Bb
        <br />
        Cc
      </>
    );
  return size.startsWith('display') || size.startsWith('heading') ? (
    <Title as="h3" size={size as TitleSize} className="skeleton-demo-metric-text">
      {words}
    </Title>
  ) : (
    <Text size={size as TextSize} className="skeleton-demo-metric-text">
      {words}
    </Text>
  );
}

export function TypographyExample({ ctx }: PreviewProps): ReactElement {
  const size = textSizes.find((step) => step === ctx.story?.controls.size) ?? 'body-m';
  return (
    <div className="skeleton-demo-stack" data-skeleton-demo-static>
      {[1, 3].map((lines) => (
        <SkeletonCase
          key={lines}
          title={`${lines === 1 ? 'One line' : 'Three lines'} · matching line boxes`}
        >
          <div className="skeleton-demo-metrics" data-metric-lines={lines} data-metric-size={size}>
            <div className="skeleton-demo-metric-cell">
              <SkeletonText {...ctx.subject} size={size} lines={lines} />
            </div>
            <div className="skeleton-demo-metric-cell">
              <MetricText size={size} lines={lines} />
            </div>
          </div>
        </SkeletonCase>
      ))}
    </div>
  );
}

const documents = [
  { title: 'Design principles', detail: 'Updated today', width: '72%' },
  { title: 'Component inventory', detail: 'Updated yesterday', width: '88%' },
  { title: 'Research notes', detail: 'Updated this week', width: '62%' },
] as const;

export function DocumentRows({
  ready = 0,
  subject,
}: {
  readonly ready?: number;
  readonly subject?: PreviewContext['subject'];
}): ReactElement {
  return (
    <ul className="skeleton-demo-list">
      {documents.map((document, index) => (
        <li key={document.title} className="skeleton-demo-list-row">
          {index < ready ? (
            <Avatar size="s" name={document.title} alt="" />
          ) : (
            <Skeleton {...subject} shape="circle" width={32} />
          )}
          <div className="skeleton-demo-row-copy">
            {index < ready ? (
              <>
                <Text size="body-s" weight="medium" truncate>
                  {document.title}
                </Text>
                <Text size="caption-l" color="muted" truncate>
                  {document.detail}
                </Text>
              </>
            ) : (
              <>
                <SkeletonText size="body-s" lines={1} width={document.width} />
                <SkeletonText size="caption-l" lines={1} width="44%" />
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function MotionSamples({
  ctx,
  subject,
}: PreviewProps & { readonly subject: 'shape' | 'text' }): ReactElement {
  const [run, setRun] = useState(0);
  useStoryAction(ctx, (action) => {
    if (action === 'replay') {
      setRun((value) => value + 1);
    }
  });

  const samples = (
    <>
      <Skeleton {...(subject === 'shape' && ctx.subject)} height={56} />
      <SkeletonText {...(subject === 'text' && ctx.subject)} size="body-s" lines={2} />
    </>
  );
  return (
    <div className="skeleton-demo-pair">
      <SkeletonCase title="Two quiet passes, then rest">
        <div key={run} className="skeleton-demo-stack skeleton-demo-motion-sample">
          {samples}
        </div>
      </SkeletonCase>
      <SkeletonCase title="Static · reduced-motion reference">
        <div data-skeleton-demo-static className="skeleton-demo-stack skeleton-demo-motion-sample">
          {samples}
        </div>
      </SkeletonCase>
    </div>
  );
}

export function SkeletonMotionExample({ ctx }: PreviewProps): ReactElement {
  return <MotionSamples ctx={ctx} subject="shape" />;
}

export function SkeletonTextMotionExample({ ctx }: PreviewProps): ReactElement {
  return <MotionSamples ctx={ctx} subject="text" />;
}
