import { useEffect, useId, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { ArrowClockwiseIcon, FileTextIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { Avatar } from '../../prototypes/avatar/avatar.proto.js';
import { Button } from '../../prototypes/button/button.proto.js';
import { Card, CardMedia, Icon, Skeleton, SkeletonText, Text, Title } from '@docouno/unica';
import type { TextSize, TitleSize } from '@docouno/unica';
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
      <figcaption>{title}</figcaption>
      {children}
    </figure>
  );
}

export function ShapeExamples(): ReactElement {
  return (
    <div className="skeleton-demo-stack">
      <SkeletonCase title="Avatar silhouette · 20 / 24 / 32 / 40 / 48">
        <div className="skeleton-demo-avatars">
          {([20, 24, 32, 40, 48] as const).map((width) => (
            <Skeleton key={width} shape="circle" width={width} />
          ))}
        </div>
      </SkeletonCase>
      <div className="skeleton-demo-pair">
        <SkeletonCase title="Block · 100% × 80">
          <Skeleton height={80} />
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

function ReportCard({
  loading,
  mediaOnly = false,
}: {
  readonly loading: boolean;
  readonly mediaOnly?: boolean;
}): ReactElement {
  return (
    <Card className="skeleton-demo-report" aria-busy={(loading && !mediaOnly) || undefined}>
      <CardMedia
        className="skeleton-demo-media"
        style={{ marginBlock: 0 }}
        aria-busy={(loading && mediaOnly) || undefined}
      >
        {loading ? (
          <Skeleton className="skeleton-demo-media-fill" />
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
            Observations on quieter, more thoughtful interfaces.
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

export function MediaExample(): ReactElement {
  const [loaded, setLoaded] = useState(false);
  const [mediaOnly, setMediaOnly] = useState(false);
  return (
    <div className="skeleton-demo-stack">
      <div className="skeleton-demo-controls">
        <Button size="s" variant="secondary" tone="neutral" onClick={() => setLoaded(!loaded)}>
          {loaded ? 'Show placeholders' : 'Reveal content'}
        </Button>
        <label className="skeleton-demo-checkbox">
          <input
            type="checkbox"
            checked={mediaOnly}
            onChange={(event) => setMediaOnly(event.target.checked)}
          />
          Image only
        </label>
      </div>
      <div className="skeleton-demo-pair">
        <figure className="skeleton-demo-case">
          <figcaption>
            <span role="status">
              {loaded ? 'Content arrived' : mediaOnly ? 'Waiting for image' : 'Waiting for content'}
            </span>
          </figcaption>
          <ReportCard loading={!loaded} mediaOnly={mediaOnly} />
        </figure>
        <SkeletonCase title="Ready reference">
          <ReportCard loading={false} />
        </SkeletonCase>
      </div>
      <Text size="caption-l" color="muted">
        The same 16:9 media slot, one-line title, two-line description reserve, and author row.
        Loaded text stays visible while its image arrives.
      </Text>
    </div>
  );
}

const documents = [
  { title: 'Design principles', detail: 'Updated today', width: '72%' },
  { title: 'Component inventory', detail: 'Updated yesterday', width: '88%' },
  { title: 'Research notes', detail: 'Updated this week', width: '62%' },
] as const;

export function DocumentRows({ ready = 0 }: { readonly ready?: number }): ReactElement {
  return (
    <ul className="skeleton-demo-list">
      {documents.map((document, index) => (
        <li key={document.title} className="skeleton-demo-list-row">
          {index < ready ? (
            <Avatar size="s" name={document.title} alt="" />
          ) : (
            <Skeleton shape="circle" width={32} />
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

type LoadState = 'initial' | 'partial' | 'slow' | 'ready' | 'refresh' | 'empty' | 'error' | 'delay';
const states: readonly { value: Exclude<LoadState, 'delay'>; label: string }[] = [
  { value: 'initial', label: 'Initial loading' },
  { value: 'partial', label: 'Partially loaded' },
  { value: 'slow', label: 'Taking longer' },
  { value: 'ready', label: 'Ready' },
  { value: 'refresh', label: 'Refreshing existing data' },
  { value: 'empty', label: 'Empty result' },
  { value: 'error', label: 'Failed request' },
];
const messages: Record<LoadState, string> = {
  initial: 'Loading documents…',
  partial: 'Loading remaining documents…',
  slow: 'Still loading. This is taking longer than usual.',
  ready: '3 documents loaded.',
  refresh: 'Updating documents. Showing the last available version.',
  empty: 'No documents found.',
  error: 'Documents could not be loaded.',
  delay: 'Loading documents…',
};

export function LifecycleExample(): ReactElement {
  const [state, setState] = useState<LoadState>('initial');
  const [requestAction, setRequestAction] = useState<'retry' | 'refresh' | null>(null);
  const [run, setRun] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const titleId = useId();
  const busy = !['ready', 'empty', 'error'].includes(state);
  const ready = state === 'ready' || state === 'refresh' ? 3 : state === 'partial' ? 1 : 0;

  function clearTimers(): void {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function choose(value: LoadState): void {
    clearTimers();
    setRequestAction(null);
    if (value === 'initial') {
      setRun((value) => value + 1);
    }
    setState(value);
  }

  function replay(fast: boolean, retry = false): void {
    choose('delay');
    setRequestAction(retry ? 'retry' : null);
    if (!fast) {
      timers.current.push(setTimeout(() => setState('initial'), 200));
      timers.current.push(setTimeout(() => setState('partial'), 1100));
    }
    timers.current.push(
      setTimeout(
        () => {
          setState('ready');
          setRequestAction(null);
        },
        fast ? 100 : 2200,
      ),
    );
  }

  function refresh(): void {
    choose('refresh');
    setRequestAction('refresh');
    timers.current.push(
      setTimeout(() => {
        setState('ready');
        setRequestAction(null);
      }, 1100),
    );
  }

  return (
    <div className="skeleton-demo-stack">
      <div className="skeleton-demo-controls">
        <label className="skeleton-demo-control">
          <span>Preview state</span>
          <select
            value={state === 'delay' ? 'initial' : state}
            onChange={(event) => choose(event.target.value as LoadState)}
          >
            {states.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <Button size="s" variant="secondary" tone="neutral" onClick={() => replay(false)}>
          Replay load
        </Button>
        <Button size="s" variant="ghost" tone="neutral" onClick={() => replay(true)}>
          Fast response
        </Button>
      </div>
      <Card className="skeleton-demo-lifecycle">
        <Title as="h3" size="heading-s" id={titleId}>
          Recent documents
        </Title>
        <div
          role="region"
          aria-labelledby={titleId}
          aria-busy={busy}
          className="skeleton-demo-region"
          data-load-state={state}
          data-skeleton-demo-static={state === 'slow' || undefined}
        >
          {state === 'empty' || state === 'error' ? (
            <div className="skeleton-demo-terminal">
              <Icon
                usage="slot"
                icon={state === 'error' ? WarningCircleIcon : FileTextIcon}
                size="l"
              />
              <Text size="body-s" weight="medium">
                {state === 'error' ? 'Couldn’t load documents' : 'No documents yet'}
              </Text>
              <Text size="caption-l" color="muted">
                {state === 'error'
                  ? 'Check your connection and try again.'
                  : 'New documents will appear here.'}
              </Text>
            </div>
          ) : state === 'delay' ? null : (
            <DocumentRows ready={ready} key={run} />
          )}
        </div>
        <div className="skeleton-demo-status-slot">
          <Text size="caption-l" color="muted" role="status" aria-atomic="true">
            {messages[state]}
          </Text>
        </div>
        <div className="skeleton-demo-footer">
          <Button
            size="s"
            variant="secondary"
            tone="neutral"
            disabled={!requestAction && !['slow', 'ready', 'error'].includes(state)}
            loading={requestAction !== null}
            onClick={() => (state === 'ready' ? refresh() : replay(false, true))}
          >
            {state === 'slow' || state === 'error' || requestAction === 'retry'
              ? 'Try again'
              : 'Refresh'}
          </Button>
        </div>
      </Card>
      <Text size="caption-l" color="muted">
        Local preview controls simulate a request. Replay reveals partial data; Fast response
        finishes before the 200ms placeholder delay. Empty and failed results replace the
        placeholders.
      </Text>
    </div>
  );
}

export function MotionExample(): ReactElement {
  const [run, setRun] = useState(0);
  return (
    <div className="skeleton-demo-stack">
      <div className="skeleton-demo-pair">
        <SkeletonCase title="Two quiet passes, then rest">
          <div key={run} className="skeleton-demo-stack skeleton-demo-motion-sample">
            <Skeleton height={56} />
            <SkeletonText size="body-s" lines={2} />
          </div>
        </SkeletonCase>
        <SkeletonCase title="Static · reduced-motion reference">
          <div
            data-skeleton-demo-static
            className="skeleton-demo-stack skeleton-demo-motion-sample"
          >
            <Skeleton height={56} />
            <SkeletonText size="body-s" lines={2} />
          </div>
        </SkeletonCase>
      </div>
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
