import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { ArrowClockwiseIcon } from '@phosphor-icons/react';
import { Avatar } from '../../prototypes/avatar/avatar.proto.js';
import { Button, Flex, Icon, Skeleton, SkeletonText, Stack, Text, Title } from '@docouno/unica';
import type { TextSize, TitleSize } from '@docouno/unica';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { PreviewContext, PreviewProps } from '../../workbench/types.js';
import { textSizes } from './skeleton.controls.js';
import type { TextStep } from './skeleton.controls.js';
import './skeleton.examples.css';

export const loadingSummaryCode = `<>
  <article aria-busy={loading} style={{ minBlockSize: 'calc(3 * var(--text-size-body-m-lh))' }}>
    {loading ? (
      <SkeletonText size="body-m" lines={3} />
    ) : (
      <p style={{ margin: 0, fontSize: 'var(--text-size-body-m)', lineHeight: 'var(--text-size-body-m-lh)' }}>
        {summary}
      </p>
    )}
  </article>
  <p role="status">{loading ? 'Loading the summary…' : 'Summary loaded.'}</p>
</>`;

export function SummaryExample(): ReactElement {
  const [loading, setLoading] = useState(true);

  return (
    <div className="skeleton-demo-stack">
      <div>
        <Button size="s" variant="secondary" tone="neutral" onClick={() => setLoading(!loading)}>
          {loading ? 'Reveal summary' : 'Show placeholder'}
        </Button>
      </div>
      <article aria-busy={loading} style={{ minBlockSize: 'calc(3 * var(--text-size-body-m-lh))' }}>
        {loading ? (
          <SkeletonText size="body-m" lines={3} />
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-size-body-m)',
              lineHeight: 'var(--text-size-body-m-lh)',
            }}
          >
            Observations on quieter, more thoughtful interfaces.
          </p>
        )}
      </article>
      <p role="status">{loading ? 'Loading the summary…' : 'Summary loaded.'}</p>
    </div>
  );
}

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

export function TypographyExample(): ReactElement {
  const [size, setSize] = useState<TextStep>('body-m');
  return (
    <div className="skeleton-demo-stack">
      <label className="skeleton-demo-control">
        <span>Text size</span>
        <select value={size} onChange={(event) => setSize(event.target.value as TextStep)}>
          {textSizes.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      {[1, 3].map((lines) => (
        <SkeletonCase
          key={lines}
          title={`${lines === 1 ? 'One line' : 'Three lines'} · matching line boxes`}
        >
          <div className="skeleton-demo-metrics" data-metric-lines={lines} data-metric-size={size}>
            <div className="skeleton-demo-metric-cell">
              <SkeletonText size={size} lines={lines} />
            </div>
            <div className="skeleton-demo-metric-cell">
              <MetricText size={size} lines={lines} />
            </div>
          </div>
        </SkeletonCase>
      ))}
      <Text size="caption-l" color="muted">
        All 13 sizes use the same line boxes as Text and Title. The rules mark block edges; explicit
        line breaks keep this comparison independent of wrapping.
      </Text>
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
  run,
  subject,
}: {
  readonly run: number;
  readonly subject?: PreviewContext['subject'];
}): ReactElement {
  return (
    <div className="skeleton-demo-pair">
      <SkeletonCase title="Two quiet passes, then rest">
        <div key={run} className="skeleton-demo-stack skeleton-demo-motion-sample">
          <Skeleton {...subject} height={56} />
          <SkeletonText size="body-s" lines={2} />
        </div>
      </SkeletonCase>
      <SkeletonCase title="Static · reduced-motion reference">
        <div data-skeleton-demo-static className="skeleton-demo-stack skeleton-demo-motion-sample">
          <Skeleton {...subject} height={56} />
          <SkeletonText size="body-s" lines={2} />
        </div>
      </SkeletonCase>
    </div>
  );
}

export function SkeletonMotionExample({ ctx }: PreviewProps): ReactElement {
  const [run, setRun] = useState(0);
  useStoryAction(ctx, (action) => {
    if (action === 'replay') {
      setRun((value) => value + 1);
    }
  });
  return <MotionSamples run={run} subject={ctx.subject} />;
}

export function MotionExample(): ReactElement {
  const [run, setRun] = useState(0);
  return (
    <div className="skeleton-demo-stack">
      <MotionSamples run={run} />
      <div>
        <Button size="s" variant="secondary" tone="neutral" onClick={() => setRun(run + 1)}>
          <Icon usage="slot" icon={ArrowClockwiseIcon} size="s" /> Replay motion
        </Button>
      </div>
      <Text size="caption-l" color="muted">
        A soft diagonal band crosses wide and short silhouettes twice, then the fill rests. Reduced
        motion and frozen captures show the static fill. RTL mirrors the sweep.
      </Text>
    </div>
  );
}
