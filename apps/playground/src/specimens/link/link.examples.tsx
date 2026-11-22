import { useId, useState, useSyncExternalStore } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { ArrowRightIcon, FileTextIcon } from '@phosphor-icons/react';
import { Alert, AlertTitle, Icon, Link, Text, Title } from '@docouno/unica';
import type { LinkProps } from '@docouno/unica';
import { Card } from '../../prototypes/card/card.proto.js';
import './link.examples.css';

const reference = 'https://www.w3.org/WAI/';
const sizes: readonly NonNullable<LinkProps['size']>[] = [
  'body-l',
  'body-m',
  'body-s',
  'caption-l',
  'caption-m',
  'caption-s',
];

function Label({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <Text size="caption-m" color="muted" className="link-study-label">
      {children}
    </Text>
  );
}

export function ReadingExamples(): ReactElement {
  return (
    <div className="link-study link-study-reading">
      <div className="link-study-group">
        <Label>Inline · accent</Label>
        <Text>
          Good documentation gives every idea a home. Start with the{' '}
          <Link href={reference}>writing guide</Link>, connect it to{' '}
          <Link href={reference}>related research</Link>, and leave a clear path for the next
          reader.
        </Text>
      </div>
      <div className="link-study-group">
        <Label>Quiet utility · neutral</Label>
        <Text size="body-s" color="secondary">
          Your work stays private. Read our{' '}
          <Link tone="neutral" href={reference}>
            privacy policy
          </Link>{' '}
          or review{' '}
          <Link tone="neutral" href={reference}>
            access permissions
          </Link>
          .
        </Text>
      </div>
      <div className="link-study-group">
        <Label>Linked heading · inherited type and ink</Label>
        <Title as="h3" size="heading-s">
          <Link tone="inherit" href={reference}>
            A calmer place to think
          </Link>
        </Title>
        <Text size="body-s" color="secondary">
          A linked title keeps its weight and baseline. Its line signals the destination.
        </Text>
      </div>
      <blockquote className="link-study-quote">
        <Text size="body-l" italic>
          “Make the next step clear, then{' '}
          <Link tone="inherit" href={reference}>
            get out of the reader’s way
          </Link>
          .”
        </Text>
      </blockquote>
      <div className="link-study-standalone">
        <Link className="link-study-target" href={reference} size="body-s">
          Explore the handbook{'\u00a0'}
          <Icon usage="slot" icon={ArrowRightIcon} directional />
        </Link>
      </div>
    </div>
  );
}

export function TypographyExamples(): ReactElement {
  return (
    <div className="link-study">
      {sizes.map((size) => (
        <div className="link-study-type-row" key={size}>
          <Label>{size}</Label>
          <div>
            <Link size={size} href={reference} target="_blank">
              Reference guide
            </Link>
          </div>
        </div>
      ))}
      <div className="link-study-group">
        <Label>Leading document glyph · inherited baseline</Label>
        <Text size="body-s">
          <Link href={reference} iconLeft={FileTextIcon}>
            Release notes
          </Link>
        </Text>
      </div>
      <div className="link-study-group">
        <Label>External destination · same tab</Label>
        <Text size="body-s">
          <Link href={reference} external>
            Accessibility resources
          </Link>
        </Text>
      </div>
      <div className="link-study-group">
        <Label>New tab · announced to assistive technology</Label>
        <Text size="body-s">
          <Link href={reference} target="_blank">
            Accessibility resources
          </Link>
        </Text>
      </div>
    </div>
  );
}

export function StateExamples(): ReactElement {
  return (
    <div className="link-study">
      {(['accent', 'neutral', 'inherit'] as const).map((tone) => (
        <div className="link-study-group" key={tone}>
          <Label>{tone}</Label>
          <div className="link-study-state-grid">
            <Text size="body-s">
              <Link tone={tone} href={reference} external>
                Read the guide
              </Link>
            </Text>
            <Text size="body-s">
              <Link tone={tone} href={reference} aria-current="page">
                Current guide
              </Link>
            </Text>
            <Text size="body-s">
              <Link tone={tone} disabled external>
                Archived guide
              </Link>
            </Text>
          </div>
        </div>
      ))}
    </div>
  );
}

export function NavigationExamples(): ReactElement {
  return (
    <div className="link-study">
      {(['always', 'hover', 'none'] as const).map((underline) => (
        <div className="link-study-group" key={underline}>
          <Label>Underline · {underline}</Label>
          <nav className="link-study-nav" aria-label={`${underline} underline examples`}>
            <Link
              className="link-study-target"
              href={reference}
              tone="neutral"
              underline={underline}
            >
              Overview
            </Link>
            <Link
              className="link-study-target"
              href={reference}
              tone="inherit"
              underline={underline}
            >
              Changelog
            </Link>
            <Link
              className="link-study-target"
              href={reference}
              tone="neutral"
              underline={underline}
              aria-current="page"
            >
              Guides
            </Link>
          </nav>
        </div>
      ))}
    </div>
  );
}

export function WrappingExamples(): ReactElement {
  return (
    <div className="link-study link-study-measure">
      <div className="link-study-group">
        <Label>Long reference</Label>
        <Text size="body-m">
          Continue with{' '}
          <Link href={reference} external>
            practical guidance for writing clear and accessible documentation
          </Link>{' '}
          before sharing your draft.
        </Text>
      </div>
      <div className="link-study-group">
        <Label>Long URL · no ellipsis</Label>
        <Text size="body-s">
          <Link
            href="https://example.com/research/understanding-accessibility-in-collaborative-workspaces"
            external
          >
            <bdi>
              https://example.com/research/understanding-accessibility-in-collaborative-workspaces
            </bdi>
          </Link>
        </Text>
      </div>
      <div className="link-study-group">
        <Label>Latin identifier inside the current reading direction</Label>
        <Text size="body-s">
          Reference:{' '}
          <Link href={reference} external>
            <bdi>WCAG 2.2 accessibility guidance</bdi>
          </Link>
          .
        </Text>
      </div>
      <div className="link-study-group">
        <Label>Directional continuation · mirrors in RTL</Label>
        <Text size="body-s">
          <Link href={reference}>
            Continue reading{'\u00a0'}
            <Icon usage="slot" icon={ArrowRightIcon} directional />
          </Link>
        </Text>
      </div>
    </div>
  );
}

export function SurfaceExamples({ overlay = false }: { readonly overlay?: boolean }): ReactElement {
  return (
    <div className="link-study">
      {(overlay ? ['overlay'] : ['canvas', 'surface']).map((surface) => (
        <div
          className="link-study-surface"
          data-link-surface={surface}
          data-surface={overlay ? 'overlay' : undefined}
          key={surface}
        >
          <Label>{surface}</Label>
          <Text size="body-s">
            Keep the source close. Read the <Link href={reference}>reference guide</Link> and{' '}
            <Link href={reference} tone="neutral">
              related notes
            </Link>
            .
          </Text>
          <div className="link-study-state-grid">
            <div>
              <Link href={reference} external>
                Read source
              </Link>
            </div>
            <div>
              <Link href={reference} aria-current="page">
                Overview
              </Link>
            </div>
            <div>
              <Link href={reference} disabled>
                Archived
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ContextExamples(): ReactElement {
  return (
    <Alert role="none" status="danger">
      <AlertTitle>The source is unavailable</AlertTitle>
      <Text color="secondary">
        <Link href={reference} tone="inherit">
          Read recovery guidance
        </Link>
      </Text>
      <Card size="s">
        <Text color="secondary">
          <Link href={reference} tone="inherit">
            Inspect the neutral card
          </Link>
        </Text>
      </Card>
      <div className="link-study-surface" data-link-surface="overlay" data-surface="overlay">
        <Text color="secondary">
          <Link href={reference} tone="inherit">
            Inspect the floating surface
          </Link>
        </Text>
      </div>
      <Text color="secondary">
        <Link href={reference} tone="inherit">
          Return to recovery guidance
        </Link>
      </Text>
    </Alert>
  );
}

function subscribeToFragment(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

export function LiveExamples(): ReactElement {
  const id = useId();
  const fragment = useSyncExternalStore(
    subscribeToFragment,
    () => window.location.hash,
    () => '',
  );
  const location =
    fragment === `#${id}-details`
      ? 'details'
      : fragment === '' || fragment === `#${id}-summary`
        ? 'summary'
        : undefined;
  return (
    <div className="link-study">
      <nav className="link-study-nav" aria-label="On this example">
        {['summary', 'details'].map((part) => (
          <Link
            key={part}
            className="link-study-target"
            href={`#${id}-${part}`}
            underline="hover"
            aria-current={location === part ? 'location' : undefined}
          >
            {part === 'summary' ? 'Summary' : 'Details'}
          </Link>
        ))}
      </nav>
      <div className="link-study-destination" id={`${id}-summary`} tabIndex={-1}>
        <Title as="h3" size="body-m">
          Summary
        </Title>
        <Text size="body-s">
          These are native document anchors. Following one brings its destination into view and
          moves keyboard focus there. The current marker follows the address, including Back and
          Forward.
        </Text>
      </div>
      <div className="link-study-destination" id={`${id}-details`} tabIndex={-1}>
        <Title as="h3" size="body-m">
          Details
        </Title>
        <Text size="body-s">
          The address remains available to the browser.{' '}
          <Link href={reference} target="_blank">
            Open the accessibility reference
          </Link>{' '}
          in a new tab.
        </Text>
      </div>
      <div className="link-study-group">
        <Text size="body-s">
          <Link href={reference} disabled>
            Download archive
          </Link>
        </Text>
        <Text size="caption-l" color="secondary">
          Export in progress. This destination is unavailable and skipped by Tab.
        </Text>
      </div>
    </div>
  );
}

export function RouteAnchor({
  to,
  ...props
}: Omit<ComponentPropsWithRef<'a'>, 'href'> & { readonly to: string }): ReactElement {
  return <a {...props} href={to} />;
}

export function DestinationExamples(): ReactElement {
  const id = useId();
  const [disabled, setDisabled] = useState(false);
  return (
    <div className="link-study">
      <label>
        <input
          type="checkbox"
          checked={disabled}
          onChange={(event) => setDisabled(event.currentTarget.checked)}
        />{' '}
        Disable release notes
      </label>
      <Text>
        <Link asChild disabled={disabled} iconLeft={FileTextIcon}>
          <RouteAnchor to={`#${id}-release`} aria-describedby={`${id}-availability`}>
            Release notes
          </RouteAnchor>
        </Link>{' '}
        <span id={`${id}-availability`}>
          {disabled ? 'Available after review.' : 'Read the latest revision.'}
        </span>
      </Text>
      <p id={`${id}-release`} tabIndex={-1}>
        Release notes for the current revision.
      </p>
      <Text>
        <Link href="data:text/plain,Release%20notes" download="release-notes.txt" target="_blank">
          Download release notes
        </Link>
      </Text>
      <Text>
        <Link href={reference} target="_blank" newTabHint="Se abre en una pestaña nueva">
          Recursos de accesibilidad
        </Link>
      </Text>
    </div>
  );
}
