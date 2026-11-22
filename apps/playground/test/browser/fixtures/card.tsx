import { BookmarkSimpleIcon } from '@phosphor-icons/react';
import {
  Alert,
  Card,
  CardAction,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardMedia,
  CardSection,
  CardTitle,
  Code,
  Divider,
  Link,
} from '@docouno/unica';
import { useId, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { IconButton } from '../../../src/prototypes/button/button.proto.js';
import { Table, TableScroll } from '../../../src/prototypes/table/table.proto.js';
import { unicaWorkbenchBase } from '../../../src/unica.workbench.shared.js';
import './card.fixture.css';

const cover = '/assets/skeleton-report-landscape.svg';

function ImageFrame(): ReactElement {
  return (
    <CardMedia aspectRatio="4 / 3" fit="contain" data-frame="">
      <img alt="" src={cover} width={720} height={405} />
    </CardMedia>
  );
}

function ShortCard({ testId }: { readonly testId: string }): ReactElement {
  const title = useId();
  return (
    <Card asChild aria-labelledby={title}>
      <a href="#guide" data-testid={testId}>
        <CardHeader>
          <CardTitle id={title}>Field guide</CardTitle>
          <CardDescription>Start with the installation notes.</CardDescription>
        </CardHeader>
        <CardFooter>Read the guide →</CardFooter>
      </a>
    </Card>
  );
}

function TypeSamples({ unavailable }: { readonly unavailable?: boolean }): ReactElement {
  return (
    <Card
      className={unavailable ? 'test-card-restricted' : undefined}
      variant={unavailable ? 'subtle' : 'default'}
      data-testid={unavailable ? 'restricted' : 'default'}
    >
      <CardHeader>
        <CardTitle>Reference notes</CardTitle>
        <CardDescription>
          {unavailable
            ? 'The collection is restricted to its owners.'
            : 'Reviewed examples and decisions.'}
        </CardDescription>
      </CardHeader>
      {unavailable && <button type="button">Request access</button>}
    </Card>
  );
}

function RichCard(): ReactElement {
  const [saved, setSaved] = useState(false);
  return (
    <form aria-label="Export form" onSubmit={(event) => event.preventDefault()}>
      <Card asChild>
        <article data-testid="rich">
          <CardHeader>
            <CardTitle>
              <a href="#guide">Technical notes</a>
            </CardTitle>
            <CardAction>
              <button type="button" aria-pressed={saved} onClick={() => setSaved(!saved)}>
                Save notes
              </button>
            </CardAction>
            <CardDescription>Keep technical work discoverable.</CardDescription>
          </CardHeader>
          <CardBody data-testid="copy">Select and copy this sentence.</CardBody>
          <CardFooter withBorder>
            <label>
              <input type="checkbox" name="include" value="notes" /> Include notes
            </label>
            <button type="submit" name="action" value="export">
              Export
            </button>
            <button type="reset">Reset</button>
          </CardFooter>
        </article>
      </Card>
    </form>
  );
}

function Ink({ where }: { readonly where: string }): ReactElement {
  return (
    <>
      <Code data-testid={`code-${where}`}>release()</Code>{' '}
      <Link href="#guide" tone="inherit" data-testid={`link-${where}`}>
        Read guidance
      </Link>
      <Divider data-testid={`divider-${where}`} />
    </>
  );
}

function SampleTable({ id }: { readonly id: string }): ReactElement {
  return (
    <TableScroll>
      <Table stickyHeader data-testid={id}>
        <thead>
          <tr>
            <th scope="col">Document</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Release guide</td>
          </tr>
        </tbody>
      </Table>
    </TableScroll>
  );
}

function Surface({ children }: { readonly children: ReactNode }): ReactElement {
  const { theme, surface } = document.documentElement.dataset;
  const preset = unicaWorkbenchBase.themes.find(({ id }) => id === theme);
  if (!preset) {
    throw new Error('Missing theme in Card fixture.');
  }
  const overlay = surface === 'overlay';
  const contents = (
    <div className="test-card-surface" data-testid="painted-surface">
      {children}
    </div>
  );
  return (
    <>
      {unicaWorkbenchBase.renderStage?.({
        theme: preset,
        surface: overlay ? 'overlay' : 'base',
        overlayStage: overlay,
        children: contents,
      })}
    </>
  );
}

function Geometry(): ReactElement {
  const [media, setMedia] = useState(true);
  const [failed, setFailed] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setMedia(!media)}>
        Toggle media
      </button>
      <button type="button" onClick={() => setFailed(!failed)}>
        Toggle image failure
      </button>
      {(['direct', 'section'] as const).map((shape) => {
        const frame = failed ? (
          <CardMedia aspectRatio="4 / 3" data-frame="">
            Preview unavailable
          </CardMedia>
        ) : (
          <ImageFrame />
        );
        return (
          <div key={shape} data-testid={`geometry-${shape}`} className="test-card-geometry">
            <Card orientation="horizontal" data-layout="">
              {media &&
                (shape === 'direct' ? (
                  frame
                ) : (
                  <CardSection withBorder data-section="">
                    {frame}
                  </CardSection>
                ))}
              <CardBody data-body="">
                <CardHeader>
                  <CardTitle>Horizontal notes</CardTitle>
                  <CardDescription>Available width controls the layout.</CardDescription>
                  <CardAction>
                    <IconButton
                      size="s"
                      variant="ghost"
                      tone="neutral"
                      icon={BookmarkSimpleIcon}
                      aria-label="Save horizontal notes"
                    />
                  </CardAction>
                </CardHeader>
              </CardBody>
            </Card>
          </div>
        );
      })}
      {(['s', 'm', 'l'] as const).map((size, index) => (
        <Card
          key={size}
          size={size}
          variant={index === 1 ? 'subtle' : 'default'}
          data-testid={`geometry-${size}`}
        >
          <CardSection withBorder data-first="">
            <ImageFrame />
          </CardSection>
          <ImageFrame />
          <CardHeader data-heading="">
            <CardTitle>LongIdentifierThatNeedsToWrapWithinTheCardWidth</CardTitle>
            <CardAction>
              <IconButton
                size="s"
                variant="ghost"
                tone="neutral"
                icon={BookmarkSimpleIcon}
                aria-label="Save report"
              />
            </CardAction>
          </CardHeader>
          <CardSection withBorder data-middle="">
            <ImageFrame />
          </CardSection>
          <CardBody data-body="">Notes</CardBody>
          <CardSection data-last="">
            <ImageFrame />
          </CardSection>
        </Card>
      ))}
      <Card data-testid="only-section">
        <CardSection withBorder>
          <ImageFrame />
        </CardSection>
      </Card>
      <Card data-testid="natural-media">
        <CardTitle>Image sizing</CardTitle>
        <CardMedia hidden>
          <img alt="" src={cover} width={720} height={405} />
        </CardMedia>
        <CardMedia aspectRatio="initial" data-natural="">
          <img alt="" src={cover} width={720} height={405} />
        </CardMedia>
        <CardMedia style={{ aspectRatio: 'var(--missing-ratio, auto)' }} data-natural="">
          <img alt="" src={cover} width={720} height={405} />
        </CardMedia>
        <CardMedia data-hidden-image="">
          <img alt="" src={cover} width={720} height={405} hidden />
        </CardMedia>
      </Card>
      <div style={{ display: 'flex' }}>
        <Card data-testid="intrinsic-card">Intrinsic inline width</Card>
      </div>
      <Card hidden data-testid="hidden-card">
        <CardBody>Hidden</CardBody>
      </Card>
      <Card data-testid="reveal-card" id="reveal-card">
        <CardBody>Until found</CardBody>
      </Card>
    </>
  );
}

export default function CardFixture(): ReactElement {
  return (
    <>
      <Surface>
        <ShortCard testId="whole-link" />
        <TypeSamples />
        <TypeSamples unavailable />
        <div data-testid="hover-reference" className="test-card-hover-reference" />
        <div data-testid="press-reference" className="test-card-press-reference" />
      </Surface>
      <RichCard />
      <article id="guide" tabIndex={-1}>
        Opened guide
      </article>
      <section data-testid="contexts" className="test-card-ink">
        <Alert status="danger">
          <Ink where="alert" />
          <Card data-testid="ink-card">
            <Ink where="card" />
            <Card variant="subtle" data-testid="nested">
              <Ink where="nested" />
              <SampleTable id="table-subtle" />
              <Card>
                <SampleTable id="table-default" />
              </Card>
            </Card>
            <Card data-surface="base" data-testid="base-card">
              <Ink where="base" />
            </Card>
            <div data-theme="soft-dark">
              <Card data-testid="theme-card">
                <Ink where="theme" />
              </Card>
            </div>
          </Card>
        </Alert>
        <Card data-testid="sibling-card">
          <Ink where="sibling" />
        </Card>
      </section>
      <Geometry />
    </>
  );
}
