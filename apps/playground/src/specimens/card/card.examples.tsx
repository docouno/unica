import { useId, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import {
  ArrowRightIcon,
  ArrowSquareOutIcon,
  BookmarkSimpleIcon,
  CheckIcon,
  FileTextIcon,
  ImageBrokenIcon,
  LockSimpleIcon,
  StackIcon,
} from '@phosphor-icons/react';
import {
  Badge,
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
  Icon,
  Skeleton,
  SkeletonText,
  Text,
} from '@docouno/unica';
import { Button, IconButton } from '@docouno/unica';
import { PopoverContent } from '../../prototypes/popover/popover.proto.js';
import './card.examples.css';

function Note({ children }: { readonly children: ReactNode }): ReactElement {
  return <p className="card-example-note">{children}</p>;
}

function Label({ children }: { readonly children: ReactNode }): ReactElement {
  return <p className="card-example-label">{children}</p>;
}

function Metadata(): ReactElement {
  return (
    <div className="card-example-meta">
      <Icon usage="slot" icon={FileTextIcon} size="s" />
      <span>8 min read</span>
      <span aria-hidden="true">·</span>
      <span>Updated today</span>
    </div>
  );
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

export function Hierarchy(): ReactElement {
  return (
    <div className="card-example-stack">
      <Note>Two levels of emphasis. Size changes spacing, not the importance of the title.</Note>
      {(['s', 'm', 'l'] as const).map((size) => (
        <div key={size} className="card-example-grid">
          <div className="card-example-cell">
            <Label>Default · {size.toUpperCase()}</Label>
            <Card size={size}>
              <CardHeader>
                <CardTitle>Project library</CardTitle>
                <CardDescription>Guides, decisions, and useful references.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Text size="caption-l" color="muted">
                  24 documents
                </Text>
                <Icon usage="slot" icon={StackIcon} size="m" color="muted" />
              </CardFooter>
            </Card>
          </div>
          <div className="card-example-cell">
            <Label>Subtle · {size.toUpperCase()}</Label>
            <Card size={size} variant="subtle">
              <CardHeader>
                <CardTitle>Supporting notes</CardTitle>
                <CardDescription>Context that belongs beside the main content.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Text size="caption-l" color="muted">
                  Last edited today
                </Text>
              </CardFooter>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Anatomy(): ReactElement {
  const [reviewed, setReviewed] = useState(false);
  return (
    <div className="card-example-stack">
      <Note>
        A title and description share one column; compact actions occupy their own. Footer dividers
        are optional.
      </Note>
      <div className="card-example-grid">
        <Card>
          <CardHeader>
            <CardTitle>Working together</CardTitle>
            <CardDescription>
              A practical guide to thoughtful reviews and clear decisions.
            </CardDescription>
            <CardAction>
              <SaveAction name="Working together" />
            </CardAction>
          </CardHeader>
          <CardBody>
            <Text size="body-s" color="secondary">
              Keep feedback specific, give it context, and leave the next person a clear place to
              start.
            </Text>
          </CardBody>
          <CardFooter>
            <Metadata />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Release checklist</CardTitle>
            <CardDescription>Everything needed for the next handoff.</CardDescription>
            <CardAction>
              <Badge status="success" size="s">
                Ready
              </Badge>
            </CardAction>
          </CardHeader>
          <CardBody>
            <dl className="card-example-facts">
              <div>
                <dt>Owner</dt>
                <dd>Design team</dd>
              </div>
              <div>
                <dt>Coverage</dt>
                <dd>12 components</dd>
              </div>
            </dl>
          </CardBody>
          <CardFooter withBorder>
            <Text size="caption-l" color="muted">
              {reviewed ? 'Review complete' : 'Ready to review'}
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

export function Media(): ReactElement {
  const [width, setWidth] = useState(560);
  const [size, setSize] = useState<'s' | 'm' | 'l'>('m');
  const [placement, setPlacement] = useState<'flush' | 'inset'>('flush');
  return (
    <div className="card-example-stack">
      <div className="card-example-controls">
        <label>
          Size
          <select value={size} onChange={(event) => setSize(event.target.value as typeof size)}>
            <option value="s">Small</option>
            <option value="m">Medium</option>
            <option value="l">Large</option>
          </select>
        </label>
      </div>
      <Note>
        Flush media shares the outer corners. Inset media keeps a concentric inner frame. The card
        itself never clips focus rings.
      </Note>
      <div className="card-example-grid">
        <div className="card-example-cell">
          <Label>Flush · cover</Label>
          <Card size={size}>
            <CardSection>
              <Cover />
            </CardSection>
            <CardHeader>
              <CardTitle>A little room to think</CardTitle>
              <CardDescription>Field notes from a slower, more focused week.</CardDescription>
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
              <CardTitle>Connections, clearly</CardTitle>
              <CardDescription>A diagram stays complete inside its frame.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Metadata />
            </CardFooter>
          </Card>
        </div>
      </div>
      <div className="card-example-controls">
        <label>
          Horizontal media
          <select
            value={placement}
            onChange={(event) => setPlacement(event.target.value as typeof placement)}
          >
            <option value="flush">Flush</option>
            <option value="inset">Inset</option>
          </select>
        </label>
        <label>
          Available width ({width}px)
          <input
            type="range"
            min="300"
            max="680"
            value={width}
            onChange={(event) => setWidth(event.target.valueAsNumber)}
          />
        </label>
      </div>
      <Label>Horizontal · stacks below 28rem of content width</Label>
      <Card size={size} orientation="horizontal" style={{ inlineSize: `min(100%, ${width}px)` }}>
        <CardSection placement={placement}>
          <Cover ratio="4 / 3" />
        </CardSection>
        <CardBody>
          <CardHeader>
            <CardTitle>Designing for the everyday</CardTitle>
            <CardDescription>
              Small details that make a familiar interface feel considered.
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
            <CardTitle>Image proportions</CardTitle>
            <CardDescription>Contain preserves the entire original image.</CardDescription>
          </CardHeader>
          <CardSection>
            <Cover ratio="2 / 1" fit="contain" />
          </CardSection>
        </Card>
        <Card size={size}>
          <CardHeader>
            <CardTitle>Without an image</CardTitle>
            <CardDescription>Text-only cards do not reserve an empty media slot.</CardDescription>
          </CardHeader>
          <CardBody>
            <Text size="body-s" color="secondary">
              An illustration is optional. The same spacing and content hierarchy work on their own.
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
  return (
    <div className="card-example-grid">
      <Card>
        <CardHeader>
          <CardTitle>Document details</CardTitle>
          <CardDescription>Related information in a single surface.</CardDescription>
        </CardHeader>
        <CardSection withBorder padded>
          <dl className="card-example-facts">
            <div>
              <dt>Format</dt>
              <dd>PDF document</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>2.4 MB</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>Today, 09:42</dd>
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
          <CardTitle>Reading preferences</CardTitle>
          <CardDescription>Controls keep their own behavior and focus.</CardDescription>
        </CardHeader>
        <CardBody>
          <Checkbox defaultChecked label="Show reading time" />
          <Checkbox label="Open links in a new tab" />
        </CardBody>
        <CardSection withBorder padded className="card-example-quiet-section">
          <Text size="caption-l" color="secondary">
            Changes apply to this device.
          </Text>
        </CardSection>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Useful context</CardTitle>
        </CardHeader>
        <CardBody>
          <Text size="body-s" color="secondary">
            Use a quieter surface for one supporting group.
          </Text>
          <Card size="s" variant="subtle">
            <CardHeader>
              <CardTitle as="h4">A short reminder</CardTitle>
              <CardDescription>
                Related details stay close without another prominent frame.
              </CardDescription>
            </CardHeader>
          </Card>
        </CardBody>
      </Card>
      <Card variant="subtle">
        <CardBody>
          <Text size="body-s" color="secondary">
            A simple note needs only a body. Headers, footers, media, and separators are optional.
          </Text>
        </CardBody>
      </Card>
    </div>
  );
}

export function Navigation(): ReactElement {
  const id = useId();
  const [opened, setOpened] = useState('Choose a guide above');
  const [selected, setSelected] = useState(false);
  return (
    <div className="card-example-stack">
      <Note>
        Live examples. A short card has one large link target. In a richer card, the title link and
        controls are separate; body text stays selectable.
      </Note>
      <div className="card-example-grid">
        <Card asChild>
          <a
            href={`#${id}`}
            aria-labelledby={`${id}-title`}
            onClick={() => setOpened('Getting started')}
          >
            <CardHeader>
              <CardTitle id={`${id}-title`}>Getting started</CardTitle>
              <CardDescription>Find your way around the essentials.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Text size="caption-l" color="muted">
                Read the guide
              </Text>
              <Icon usage="slot" icon={ArrowRightIcon} size="m" directional />
            </CardFooter>
          </a>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <a href={`#${id}`} onClick={() => setOpened('A more thoughtful handoff')}>
                A more thoughtful handoff
              </a>
            </CardTitle>
            <CardDescription>Details, rationale, and a useful next step.</CardDescription>
            <CardAction>
              <SaveAction name="A more thoughtful handoff" />
            </CardAction>
          </CardHeader>
          <CardBody>
            <Text size="body-s" color="secondary">
              Select and copy this sentence. Saving the guide never opens it.
            </Text>
          </CardBody>
          <CardFooter withBorder>
            <Checkbox
              size="s"
              checked={selected}
              onCheckedChange={setSelected}
              label={selected ? 'Selected for export' : 'Select for export'}
            />
            <a
              className="card-example-inline-link"
              href={`#${id}`}
              onClick={() => setOpened('Handoff source notes')}
            >
              Source notes
              <Icon usage="slot" icon={ArrowSquareOutIcon} size="s" />
            </a>
          </CardFooter>
        </Card>
      </div>
      <div className="card-example-destination" id={id} tabIndex={-1}>
        <Text size="caption-l" color="muted">
          Local preview
        </Text>
        <Text size="body-s" weight="medium">
          {opened}
        </Text>
      </div>
    </div>
  );
}

export function States(): ReactElement {
  const [variant, setVariant] = useState<'default' | 'subtle'>('default');
  const [size, setSize] = useState<'s' | 'm' | 'l'>('m');
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
      <div className="card-example-controls">
        <label>
          Surface
          <select
            value={variant}
            onChange={(event) => setVariant(event.target.value as typeof variant)}
          >
            <option value="default">Default</option>
            <option value="subtle">Subtle</option>
          </select>
        </label>
        <label>
          Size
          <select value={size} onChange={(event) => setSize(event.target.value as typeof size)}>
            <option value="s">Small</option>
            <option value="m">Medium</option>
            <option value="l">Large</option>
          </select>
        </label>
      </div>
      <Note>
        Pinned appearance for comparison. Try real pointer and keyboard input in “Links &
        independent actions”.
      </Note>
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
                <CardTitle className="card-example-state-title">Getting started</CardTitle>
                <CardDescription>A clear place to begin.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Text size="caption-l" color="muted">
                  Read the guide
                </Text>
                <Icon usage="slot" icon={ArrowRightIcon} size="m" directional />
              </CardFooter>
            </Card>
          </div>
        ))}
      </div>
      <Note>
        No card translation or scale on press. Focus remains independent of fill and border. Static
        cards have no hover or press response.
      </Note>
    </div>
  );
}

export function Availability(): ReactElement {
  const [loaded, setLoaded] = useState(false);
  const [requested, setRequested] = useState(false);
  const [recovered, setRecovered] = useState(false);
  return (
    <div className="card-example-stack">
      <Note>
        Loading, empty, and error feedback belongs to the content. The card keeps its neutral
        material.
      </Note>
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
                  <CardTitle>Design principles</CardTitle>
                  <CardDescription>A shared foundation for everyday decisions.</CardDescription>
                </CardHeader>
                <Text size="body-s" color="secondary">
                  Be clear. Make room. Keep the important things close.
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
                {loaded ? 'Updated today' : 'Loading document…'}
              </Text>
            </CardFooter>
          </Card>
          <Button
            className="card-example-toggle-content"
            size="s"
            variant="ghost"
            tone="neutral"
            onClick={() => setLoaded(!loaded)}
          >
            {loaded ? 'Show loading' : 'Show content'}
          </Button>
        </div>
        <div className="card-example-cell">
          <Label>Empty content</Label>
          <Card>
            <CardHeader>
              <CardTitle>Saved references</CardTitle>
            </CardHeader>
            <CardBody className="card-example-empty">
              <Icon usage="slot" icon={BookmarkSimpleIcon} size="l" color="muted" />
              <CardTitle as="h4">Nothing saved yet</CardTitle>
              <CardDescription>Save a useful guide to keep it close.</CardDescription>
            </CardBody>
            <CardFooter>
              <Text size="caption-l" color="muted">
                Use the bookmark action on a guide.
              </Text>
            </CardFooter>
          </Card>
        </div>
        <div className="card-example-cell">
          <Label>Unavailable destination</Label>
          <Card className="card-example-unavailable">
            <CardHeader>
              <CardTitle>Archived research</CardTitle>
              <CardDescription>This collection is restricted to its owners.</CardDescription>
              <CardAction>
                <Icon usage="slot" icon={LockSimpleIcon} size="m" color="muted" />
              </CardAction>
            </CardHeader>
            <CardBody>
              <Text size="body-s" color="secondary">
                Ask a collection owner for access. The title and reason remain readable.
              </Text>
            </CardBody>
            <CardFooter>
              <Button size="s" variant="secondary" tone="neutral" disabled>
                Open collection
              </Button>
              <Button size="s" variant="ghost" tone="neutral" onClick={() => setRequested(true)}>
                Request access
              </Button>
              {requested && (
                <Text role="status" size="body-s">
                  Access requested
                </Text>
              )}
            </CardFooter>
          </Card>
        </div>
        <div className="card-example-cell">
          <Label>Media unavailable → retry</Label>
          <Card>
            <CardSection>
              {recovered ? (
                <Cover />
              ) : (
                <CardMedia aspectRatio="16 / 9">
                  <div className="card-example-media-fallback">
                    <Icon usage="slot" icon={ImageBrokenIcon} size="l" color="muted" />
                    <span>Preview unavailable</span>
                  </div>
                </CardMedia>
              )}
            </CardSection>
            <CardHeader>
              <CardTitle>Field notes</CardTitle>
              <CardDescription>The content remains available if its image fails.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Text size="caption-l" color="muted">
                {recovered ? 'Preview loaded' : 'Could not load image'}
              </Text>
              <Button
                size="s"
                variant="ghost"
                tone="neutral"
                onClick={() => setRecovered(!recovered)}
              >
                {recovered ? 'Show failure' : 'Retry image'}
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
      <Note>
        Titles and descriptions wrap naturally. The footer grows with its labels; content is never
        hidden merely to equalize card heights.
      </Note>
      <div className="card-example-grid">
        <Card>
          <CardHeader>
            <CardTitle>
              A considered approach to making complex information easier to understand
            </CardTitle>
            <CardDescription>
              Longer descriptions keep their line height and leave room for a compact action without
              overlapping it.
            </CardDescription>
            <CardAction>
              <SaveAction name="A considered approach" />
            </CardAction>
          </CardHeader>
          <CardBody>
            <Text size="body-s" color="secondary">
              references/design-systems/components/surfaces/internationalization-and-accessibility-guidelines
            </Text>
          </CardBody>
          <CardFooter withBorder>
            <Text size="caption-l" color="muted">
              Last updated by the documentation working group
            </Text>
            <Button size="s" variant="secondary" tone="neutral" disabled>
              Available after review
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Short title</CardTitle>
            <CardDescription>The same grid can contain less text.</CardDescription>
            <CardAction>
              <Badge size="s" status="neutral">
                Draft
              </Badge>
            </CardAction>
          </CardHeader>
          <CardBody>
            <Text size="body-s" color="secondary">
              The footer aligns at the bottom when the parent grid stretches its cards.
            </Text>
          </CardBody>
          <CardFooter withBorder>
            <Text size="caption-l" color="muted">
              Updated today
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

export function Overlay(): ReactElement {
  const [study, setStudy] = useState('hierarchy');
  return (
    <PopoverContent
      className="card-example-overlay"
      role="group"
      aria-label="Card inside a floating surface"
    >
      <CardHeader>
        <CardTitle>Related reading</CardTitle>
        <CardDescription>
          Cards adapt to the floating material. Only the outer panel casts a shadow.
        </CardDescription>
      </CardHeader>
      <div className="card-example-controls">
        <label>
          Study
          <select value={study} onChange={(event) => setStudy(event.target.value)}>
            <option value="hierarchy">Content hierarchy</option>
            <option value="states">Pinned navigation states</option>
            <option value="navigation">Live links &amp; actions</option>
          </select>
        </label>
      </div>
      {study === 'states' ? (
        <States />
      ) : study === 'navigation' ? (
        <Navigation />
      ) : (
        <>
          <Card size="s">
            <CardHeader>
              <CardTitle>Working with surfaces</CardTitle>
              <CardDescription>Hierarchy, spacing, and a little restraint.</CardDescription>
              <CardAction>
                <SaveAction name="Working with surfaces" />
              </CardAction>
            </CardHeader>
            <CardFooter>
              <Metadata />
            </CardFooter>
          </Card>
          <Card size="s" variant="subtle">
            <CardHeader>
              <CardTitle>One useful note</CardTitle>
              <CardDescription>Supporting context uses the quieter level.</CardDescription>
            </CardHeader>
          </Card>
        </>
      )}
    </PopoverContent>
  );
}
