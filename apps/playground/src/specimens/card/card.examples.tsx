import { useId, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import {
  ArrowRightIcon,
  BookmarkSimpleIcon,
  CheckIcon,
  FileTextIcon,
  ImageBrokenIcon,
  LockSimpleIcon,
} from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardMedia,
  CardSection,
  CardTitle,
  Checkbox,
  Flex,
  Icon,
  IconButton,
  Link,
  Skeleton,
  SkeletonText,
  Text,
  Title,
} from '@docouno/unica';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { PreviewProps } from '../../workbench/types.js';
import './card.examples.css';

function Label({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <Text size="caption-l" color="muted" weight="semibold">
      <bdi>{children}</bdi>
    </Text>
  );
}

function Metadata(): ReactElement {
  return (
    <Flex align="center" wrap="wrap" gap={8}>
      <Icon usage="slot" icon={FileTextIcon} size="s" color="muted" />
      <Text as="span" size="caption-l" color="muted">
        <bdi>8 min read</bdi>
      </Text>
      <Text as="span" size="caption-l" color="muted" aria-hidden="true">
        ·
      </Text>
      <Text as="span" size="caption-l" color="muted">
        <bdi>Updated today</bdi>
      </Text>
    </Flex>
  );
}

function studySize(ctx: PreviewProps['ctx']): 's' | 'm' | 'l' {
  const size = ctx.story?.controls.size;
  return size === 's' || size === 'l' ? size : 'm';
}

export function SaveAction({ name = 'Field guide' }: { readonly name?: string }): ReactElement {
  const [saved, setSaved] = useState(false);
  return (
    <IconButton
      size="s"
      variant="ghost"
      tone="neutral"
      icon={saved ? CheckIcon : BookmarkSimpleIcon}
      aria-label={`Save ${name}`}
      pressed={saved}
      onPressedChange={setSaved}
    />
  );
}

function Cover({
  ratio = '16 / 9',
  fit = 'cover',
}: {
  readonly ratio?: string;
  readonly fit?: 'cover' | 'contain';
}): ReactElement {
  return (
    <CardMedia aspectRatio={ratio} fit={fit}>
      <img src="/assets/skeleton-report-landscape.svg" alt="" width="720" height="405" />
    </CardMedia>
  );
}

function Diagram(): ReactElement {
  return (
    <CardMedia aspectRatio="16 / 9" fit="contain" className="card-example-diagram">
      <svg
        viewBox="0 0 360 200"
        role="img"
        aria-label="Three services connected through a shared gateway"
      >
        <g fill="none" stroke="currentColor" strokeWidth="1.5">
          <path
            className="card-example-wire"
            d="M92 100H170M170 100V48H252M170 100H252M170 100V152H252"
          />
          <rect x="28" y="80" width="64" height="40" rx="2" />
          <rect x="252" y="28" width="76" height="40" rx="2" />
          <rect x="252" y="80" width="76" height="40" rx="2" />
          <rect x="252" y="132" width="76" height="40" rx="2" />
        </g>
        <g fill="currentColor">
          <circle cx="60" cy="100" r="5" />
          <path d="M274 44h32v3h-32zM274 51h20v3h-20zM274 96h32v3h-32zM274 103h20v3h-20zM274 148h32v3h-32zM274 155h20v3h-20z" />
        </g>
      </svg>
    </CardMedia>
  );
}

export function Anatomy(): ReactElement {
  const [reviewed, setReviewed] = useState(false);
  return (
    <div className="card-example-stack">
      <div className="card-example-grid">
        <Card>
          <CardHeader>
            <CardTitle>
              <bdi>Working together</bdi>
            </CardTitle>
            <CardDescription>
              <bdi>A practical guide to thoughtful reviews and clear decisions.</bdi>
            </CardDescription>
            <CardAction>
              <SaveAction name="Working together" />
            </CardAction>
          </CardHeader>
          <CardBody>
            <Text size="body-s" color="secondary">
              <bdi>
                Keep feedback specific, give it context, and leave the next person a clear place to
                start.
              </bdi>
            </Text>
          </CardBody>
          <CardFooter>
            <Metadata />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <bdi>Release checklist</bdi>
            </CardTitle>
            <CardDescription>
              <bdi>Everything needed for the next handoff.</bdi>
            </CardDescription>
            <CardAction>
              <Badge status="success" size="s">
                Ready
              </Badge>
            </CardAction>
          </CardHeader>
          <CardBody>
            <dl className="card-example-facts">
              <div>
                <dt>
                  <Text as="span" size="body-s" color="muted">
                    <bdi>Owner</bdi>
                  </Text>
                </dt>
                <dd>
                  <Text as="span" size="body-s">
                    <bdi>Design team</bdi>
                  </Text>
                </dd>
              </div>
              <div>
                <dt>
                  <Text as="span" size="body-s" color="muted">
                    <bdi>Coverage</bdi>
                  </Text>
                </dt>
                <dd>
                  <Text as="span" size="body-s">
                    <bdi>12 components</bdi>
                  </Text>
                </dd>
              </div>
            </dl>
          </CardBody>
          <CardFooter withBorder>
            <Text size="caption-l" color="muted">
              <bdi>{reviewed ? 'Review complete' : 'Ready to review'}</bdi>
            </Text>
            <Button
              size="s"
              variant="secondary"
              tone="neutral"
              iconRight={reviewed ? CheckIcon : ArrowRightIcon}
              onClick={() => setReviewed(!reviewed)}
            >
              {reviewed ? 'Reviewed' : 'Mark reviewed'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export function Media({ ctx }: PreviewProps): ReactElement {
  const width = Number(ctx.story?.controls.width ?? 560);
  const size = studySize(ctx);
  const placement = ctx.story?.controls.placement === 'inset' ? 'inset' : 'flush';
  return (
    <div className="card-example-stack">
      <div className="card-example-grid">
        <div className="card-example-cell">
          <Label>Flush · cover</Label>
          <Card size={size}>
            <CardSection>
              <Cover />
            </CardSection>
            <CardHeader>
              <CardTitle>
                <bdi>A little room to think</bdi>
              </CardTitle>
              <CardDescription>
                <bdi>Field notes from a slower, more focused week.</bdi>
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Metadata />
            </CardFooter>
          </Card>
        </div>
        <div className="card-example-cell">
          <Label>Inset · contain</Label>
          <Card size={size}>
            <CardSection placement="inset">
              <Diagram />
            </CardSection>
            <CardHeader>
              <CardTitle>
                <bdi>Connections, clearly</bdi>
              </CardTitle>
              <CardDescription>
                <bdi>Three services share one gateway.</bdi>
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Metadata />
            </CardFooter>
          </Card>
        </div>
      </div>
      <Label>Horizontal media</Label>
      <Card size={size} orientation="horizontal" style={{ inlineSize: `min(100%, ${width}px)` }}>
        <CardSection placement={placement}>
          <Cover ratio="4 / 3" />
        </CardSection>
        <CardBody>
          <CardHeader>
            <CardTitle>
              <bdi>Designing for the everyday</bdi>
            </CardTitle>
            <CardDescription>
              <bdi>Small details that make a familiar interface feel considered.</bdi>
            </CardDescription>
            <CardAction>
              <SaveAction name="Designing for the everyday" />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <Metadata />
          </CardFooter>
        </CardBody>
      </Card>
      <div className="card-example-grid">
        <Card size={size}>
          <CardHeader>
            <CardTitle>
              <bdi>Image proportions</bdi>
            </CardTitle>
            <CardDescription>
              <bdi>Contain preserves the entire original image.</bdi>
            </CardDescription>
          </CardHeader>
          <CardSection>
            <Cover ratio="2 / 1" fit="contain" />
          </CardSection>
        </Card>
        <Card size={size}>
          <CardHeader>
            <CardTitle>
              <bdi>Without an image</bdi>
            </CardTitle>
            <CardDescription>
              <bdi>Text-only cards do not reserve an empty media slot.</bdi>
            </CardDescription>
          </CardHeader>
          <CardBody>
            <Text size="body-s" color="secondary">
              <bdi>
                An illustration is optional. The same spacing and content hierarchy work on their
                own.
              </bdi>
            </Text>
          </CardBody>
          <CardFooter>
            <Metadata />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export function Sections(): ReactElement {
  const [showTime, setShowTime] = useState(true);
  const [showSize, setShowSize] = useState(false);
  return (
    <div className="card-example-grid">
      <Card>
        <CardHeader>
          <CardTitle>
            <bdi>Document details</bdi>
          </CardTitle>
          <CardDescription>
            <bdi>Related information in a single surface.</bdi>
          </CardDescription>
        </CardHeader>
        <CardSection withBorder padded>
          <dl className="card-example-facts">
            <div>
              <dt>
                <Text as="span" size="body-s" color="muted">
                  <bdi>Format</bdi>
                </Text>
              </dt>
              <dd>
                <Text as="span" size="body-s">
                  <bdi>PDF document</bdi>
                </Text>
              </dd>
            </div>
            <div>
              <dt>
                <Text as="span" size="body-s" color="muted">
                  <bdi>Size</bdi>
                </Text>
              </dt>
              <dd>
                <Text as="span" size="body-s">
                  <bdi>2.4 MB</bdi>
                </Text>
              </dd>
            </div>
            <div>
              <dt>
                <Text as="span" size="body-s" color="muted">
                  <bdi>Updated</bdi>
                </Text>
              </dt>
              <dd>
                <Text as="span" size="body-s">
                  <bdi>Today, 09:42</bdi>
                </Text>
              </dd>
            </div>
          </dl>
        </CardSection>
        <CardFooter justify="end">
          <Button size="s" variant="secondary" tone="neutral" disabled>
            Download unavailable
          </Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <bdi>Reading preferences</bdi>
          </CardTitle>
          <CardDescription>
            <bdi>Choose which details appear below the guide title.</bdi>
          </CardDescription>
        </CardHeader>
        <CardBody>
          <Checkbox checked={showTime} onCheckedChange={setShowTime} label="Show reading time" />
          <Checkbox checked={showSize} onCheckedChange={setShowSize} label="Show file size" />
        </CardBody>
        <CardSection withBorder padded className="card-example-quiet-section">
          <Text size="body-s" weight="medium">
            <bdi>Editorial guide</bdi>
          </Text>
          {showTime && (
            <Text size="caption-l" color="secondary">
              <bdi>8 min read</bdi>
            </Text>
          )}
          {showSize && (
            <Text size="caption-l" color="secondary">
              <bdi>2.4 MB</bdi>
            </Text>
          )}
        </CardSection>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <bdi>Useful context</bdi>
          </CardTitle>
        </CardHeader>
        <CardBody>
          <Text size="body-s" color="secondary">
            <bdi>Read the draft before the next review.</bdi>
          </Text>
          <Card size="s" variant="subtle">
            <CardHeader>
              <CardTitle as="h4">
                <bdi>A short reminder</bdi>
              </CardTitle>
              <CardDescription>
                <bdi>Bring one question for the author.</bdi>
              </CardDescription>
            </CardHeader>
          </Card>
        </CardBody>
      </Card>
      <Card variant="subtle">
        <CardBody>
          <Text size="body-s" color="secondary">
            <bdi>New notes appear here after the next review.</bdi>
          </Text>
        </CardBody>
      </Card>
    </div>
  );
}

export function Navigation({ ctx }: PreviewProps): ReactElement {
  const size = studySize(ctx);
  const variant = ctx.story?.controls.variant === 'subtle' ? 'subtle' : 'default';
  const id = useId();
  const [opened, setOpened] = useState('Choose a guide above');
  const [selected, setSelected] = useState(false);
  return (
    <div className="card-example-stack">
      <div className="card-example-grid">
        <Card asChild size={size} variant={variant}>
          <a
            href={`#${id}`}
            aria-labelledby={`${id}-title`}
            onClick={() => setOpened('Getting started')}
          >
            <CardHeader>
              <CardTitle id={`${id}-title`}>
                <bdi>Getting started</bdi>
              </CardTitle>
              <CardDescription>
                <bdi>Find your way around the essentials.</bdi>
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Text size="caption-l" color="muted">
                <bdi>Read the guide</bdi>
              </Text>
              <Icon usage="slot" icon={ArrowRightIcon} size="m" directional />
            </CardFooter>
          </a>
        </Card>
        <Card size={size} variant={variant}>
          <CardHeader>
            <CardTitle>
              <Link
                tone="inherit"
                href={`#${id}`}
                onClick={() => setOpened('A more thoughtful handoff')}
              >
                <bdi>A more thoughtful handoff</bdi>
              </Link>
            </CardTitle>
            <CardDescription>
              <bdi>Details, rationale, and a useful next step.</bdi>
            </CardDescription>
            <CardAction>
              <SaveAction name="A more thoughtful handoff" />
            </CardAction>
          </CardHeader>
          <CardBody>
            <Text size="body-s" color="secondary">
              <bdi>Select and copy this sentence. Saving the guide never opens it.</bdi>
            </Text>
          </CardBody>
          <CardFooter withBorder>
            <Checkbox
              size="s"
              checked={selected}
              onCheckedChange={setSelected}
              label={selected ? 'Selected for export' : 'Select for export'}
            />
            <Link
              tone="neutral"
              size="caption-l"
              href={`#${id}`}
              onClick={() => setOpened('Handoff source notes')}
            >
              <bdi>Source notes</bdi>
            </Link>
          </CardFooter>
        </Card>
      </div>
      <div className="card-example-destination" id={id} tabIndex={-1}>
        <Text size="caption-l" color="muted">
          <bdi>Local preview</bdi>
        </Text>
        <Text size="body-s" weight="medium">
          <bdi>{opened}</bdi>
        </Text>
      </div>
    </div>
  );
}

export function States({ ctx }: PreviewProps): ReactElement {
  const variant = ctx.story?.controls.variant === 'subtle' ? 'subtle' : 'default';
  const size = studySize(ctx);
  const states = [
    { label: 'Rest', state: 'rest' },
    { label: 'Hover', state: 'hover' },
    { label: 'Held press', state: 'active' },
    { label: 'Keyboard focus', state: 'rest', focus: true },
    { label: 'Focus + hover', state: 'hover', focus: true },
    { label: 'Focus + press', state: 'active', focus: true },
  ] as const;
  return (
    <div className="card-example-stack">
      <div className="card-example-grid">
        {states.map((state) => (
          <div key={state.label} className="card-example-cell">
            <Label>{state.label}</Label>
            <Card
              variant={variant}
              size={size}
              className="card-example-state"
              data-preview={state.state}
              data-preview-focus={'focus' in state ? true : undefined}
            >
              <CardHeader>
                <CardTitle className="card-example-state-title">
                  <bdi>Getting started</bdi>
                </CardTitle>
                <CardDescription>
                  <bdi>A clear place to begin.</bdi>
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Text size="caption-l" color="muted">
                  <bdi>Read the guide</bdi>
                </Text>
                <Icon usage="slot" icon={ArrowRightIcon} size="m" directional />
              </CardFooter>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Availability({ ctx }: PreviewProps): ReactElement {
  const loaded = ctx.story?.controls.loaded === true;
  const [requested, setRequested] = useState(false);
  const [image, setImage] = useState<{ attempt: number; status: 'failed' | 'loading' | 'loaded' }>({
    attempt: 0,
    status: 'failed',
  });

  useStoryAction(ctx, (action) => {
    if (action === 'fail-image') {
      setImage((previous) => ({ attempt: previous.attempt + 1, status: 'failed' }));
    }
  });
  function reportImage(status: 'loaded' | 'failed'): void {
    setImage((previous) =>
      previous.attempt === image.attempt ? { ...previous, status } : previous,
    );
  }

  return (
    <div className="card-example-stack">
      <div className="card-example-grid card-example-natural">
        <div className="card-example-cell">
          <Label>Loading → content</Label>
          <Card className="card-example-loading" aria-busy={!loaded}>
            <div className="card-example-loading-region">
              <div
                className="card-example-loaded-copy"
                aria-hidden={!loaded}
                style={{ visibility: loaded ? 'visible' : 'hidden' }}
              >
                <CardHeader>
                  <CardTitle>
                    <bdi>Design principles</bdi>
                  </CardTitle>
                  <CardDescription>
                    <bdi>A shared foundation for everyday decisions.</bdi>
                  </CardDescription>
                </CardHeader>
                <Text size="body-s" color="secondary">
                  <bdi>Be clear. Make room. Keep the important things close.</bdi>
                </Text>
              </div>
              <div className="card-example-loading-placeholder" aria-hidden="true">
                {!loaded && (
                  <>
                    <Skeleton className="card-example-skeleton-title" />
                    <SkeletonText size="body-s" lines={2} />
                    <SkeletonText size="body-s" lines={2} />
                  </>
                )}
              </div>
            </div>
            <CardFooter>
              <Text size="caption-l" color="muted">
                <bdi>{loaded ? 'Updated today' : 'Loading document…'}</bdi>
              </Text>
            </CardFooter>
          </Card>
        </div>
        <div className="card-example-cell">
          <Label>Empty content</Label>
          <Card>
            <CardHeader>
              <CardTitle>
                <bdi>Saved references</bdi>
              </CardTitle>
            </CardHeader>
            <CardBody className="card-example-empty">
              <Icon usage="slot" icon={BookmarkSimpleIcon} size="l" color="muted" />
              <CardTitle as="h4">
                <bdi>Nothing saved yet</bdi>
              </CardTitle>
              <CardDescription>
                <bdi>Save a useful guide to keep it close.</bdi>
              </CardDescription>
            </CardBody>
            <CardFooter>
              <Text size="caption-l" color="muted">
                <bdi>Use the bookmark action on a guide.</bdi>
              </Text>
            </CardFooter>
          </Card>
        </div>
        <div className="card-example-cell">
          <Label>Unavailable destination</Label>
          <Card className="card-example-unavailable">
            <CardHeader>
              <CardTitle>
                <bdi>Archived research</bdi>
              </CardTitle>
              <CardDescription>
                <bdi>This collection is restricted to its owners.</bdi>
              </CardDescription>
              <CardAction>
                <Icon usage="slot" icon={LockSimpleIcon} size="m" color="muted" />
              </CardAction>
            </CardHeader>
            <CardBody>
              <Text size="body-s" color="secondary">
                <bdi>Ask a collection owner for access.</bdi>
              </Text>
            </CardBody>
            <CardFooter>
              <Button size="s" variant="secondary" tone="neutral" disabled>
                Open collection
              </Button>
              <Button
                size="s"
                variant="ghost"
                tone="neutral"
                onClick={() => setRequested((current) => !current)}
              >
                {requested ? 'Cancel request' : 'Request access'}
              </Button>
              {requested && (
                <Text role="status" size="body-s">
                  <bdi>Access requested</bdi>
                </Text>
              )}
            </CardFooter>
          </Card>
        </div>
        <div className="card-example-cell">
          <Label>Media unavailable → retry</Label>
          <Card>
            <CardSection>
              {image.status !== 'failed' ? (
                <CardMedia aspectRatio="16 / 9">
                  <img
                    key={image.attempt}
                    src="/assets/skeleton-report-landscape.svg"
                    width={720}
                    height={405}
                    alt=""
                    onLoad={() => reportImage('loaded')}
                    onError={() => reportImage('failed')}
                  />
                </CardMedia>
              ) : (
                <CardMedia aspectRatio="16 / 9">
                  <div className="card-example-media-fallback">
                    <Icon usage="slot" icon={ImageBrokenIcon} size="l" color="muted" />
                    <Text as="span" size="caption-l" color="muted">
                      <bdi>Preview unavailable</bdi>
                    </Text>
                  </div>
                </CardMedia>
              )}
            </CardSection>
            <CardHeader>
              <CardTitle>
                <bdi>Field notes</bdi>
              </CardTitle>
              <CardDescription>
                <bdi>A guide to the studio’s current work.</bdi>
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Text size="caption-l" color="muted">
                <bdi>
                  {image.status === 'failed'
                    ? 'Could not load image'
                    : image.status === 'loaded'
                      ? 'Preview loaded'
                      : 'Loading preview…'}
                </bdi>
              </Text>
              <Button
                size="s"
                variant="ghost"
                tone="neutral"
                onClick={() =>
                  setImage((previous) => ({ attempt: previous.attempt + 1, status: 'loading' }))
                }
              >
                {image.status === 'loaded' ? 'Reload image' : 'Retry image'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function Overflow(): ReactElement {
  return (
    <div className="card-example-stack">
      <div className="card-example-grid">
        <Card>
          <CardHeader>
            <CardTitle>
              <bdi>A considered approach to making complex information easier to understand</bdi>
            </CardTitle>
            <CardDescription>
              <bdi>
                Longer descriptions keep their line height and leave room for a compact action
                without overlapping it.
              </bdi>
            </CardDescription>
            <CardAction>
              <SaveAction name="A considered approach" />
            </CardAction>
          </CardHeader>
          <CardBody>
            <Text size="body-s" color="secondary">
              <bdi>
                references/design-systems/components/surfaces/internationalization-and-accessibility-guidelines
              </bdi>
            </Text>
          </CardBody>
          <CardFooter withBorder>
            <Text size="caption-l" color="muted">
              <bdi>Last updated by the documentation working group</bdi>
            </Text>
            <Button size="s" variant="secondary" tone="neutral" disabled>
              Available after review
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <bdi>Short title</bdi>
            </CardTitle>
            <CardDescription>
              <bdi>A brief for the next review.</bdi>
            </CardDescription>
            <CardAction>
              <Badge size="s" status="neutral">
                Draft
              </Badge>
            </CardAction>
          </CardHeader>
          <CardBody>
            <Text size="body-s" color="secondary">
              <bdi>Review the draft with an editor.</bdi>
            </Text>
          </CardBody>
          <CardFooter withBorder>
            <Text size="caption-l" color="muted">
              <bdi>Updated today</bdi>
            </Text>
            <Button size="s" variant="secondary" tone="neutral" disabled>
              Awaiting review
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export function Overlay({ ctx }: PreviewProps): ReactElement {
  const titleId = useId();
  const study = ctx.story?.controls.study;
  const size = studySize(ctx);
  const variant = ctx.story?.controls.variant === 'subtle' ? 'subtle' : 'default';
  return (
    <div
      className={
        ctx.surface === 'overlay'
          ? 'unica-overlay-surface card-example-overlay'
          : 'card-example-overlay'
      }
      data-surface={ctx.surface}
      role="group"
      aria-labelledby={titleId}
    >
      <Title id={titleId} as="h2" size="heading-s">
        <bdi>Related reading</bdi>
      </Title>
      {study === 'states' ? (
        <States ctx={ctx} />
      ) : study === 'navigation' ? (
        <Navigation ctx={ctx} />
      ) : (
        <>
          <Card size={size} variant={variant}>
            <CardHeader>
              <CardTitle>
                <bdi>Working with surfaces</bdi>
              </CardTitle>
              <CardDescription>
                <bdi>Hierarchy, spacing, and a little restraint.</bdi>
              </CardDescription>
              <CardAction>
                <SaveAction name="Working with surfaces" />
              </CardAction>
            </CardHeader>
            <CardFooter>
              <Metadata />
            </CardFooter>
          </Card>
          <Card size={size} variant="subtle">
            <CardHeader>
              <CardTitle>
                <bdi>One useful note</bdi>
              </CardTitle>
              <CardDescription>
                <bdi>Read the short checklist before starting a new draft.</bdi>
              </CardDescription>
            </CardHeader>
          </Card>
        </>
      )}
    </div>
  );
}
