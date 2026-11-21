import { useId, useSyncExternalStore } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { ArrowRightIcon, FileTextIcon } from '@phosphor-icons/react';
import { Icon } from '@docouno/unica';
import { Text } from '../text/text.proto.js';
import type { TextSize } from '../text/text.proto.js';
import { Title } from '../title/title.proto.js';
import { Link } from './link.proto.js';
import type { LinkProps } from './link.proto.js';
import './link.examples.css';

const reference = 'https://www.w3.org/WAI/';
const sizes: readonly TextSize[] = [
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
        <Link href={reference} size="body-s">
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
      <div className="link-study-divider" />
      <div className="link-study-group">
        <Label>Leading document glyph · inherited baseline</Label>
        <Text size="body-s">
          <Link href={reference}>
            <Icon usage="slot" icon={FileTextIcon} />
            {'\u00a0'}Release notes
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

const states: readonly { label: string; props: Partial<LinkProps> }[] = [
  { label: 'Rest / visited', props: { previewState: 'rest' } },
  { label: 'Hover', props: { previewState: 'hover' } },
  { label: 'Held press', props: { previewState: 'active' } },
  { label: 'Keyboard focus', props: { previewState: 'rest', previewFocus: true } },
  { label: 'Focus + press', props: { previewState: 'active', previewFocus: true } },
  { label: 'Unavailable', props: { disabled: true } },
];

export function StateExamples(): ReactElement {
  return (
    <div className="link-study">
      {(['accent', 'neutral', 'inherit'] as const).map((tone) => (
        <div className="link-study-group" key={tone}>
          <Label>{tone}</Label>
          <div className="link-study-state-grid">
            {states.map(({ label, props }) => (
              <div className="link-study-state" key={label}>
                <Text size="body-s">
                  <Link tone={tone} href={reference} external {...props}>
                    Read the guide
                  </Link>
                </Text>
                <Label>{label}</Label>
              </div>
            ))}
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
          <div className="link-study-nav" aria-label={`${underline} underline previews`}>
            <Link href={reference} tone="neutral" underline={underline} previewState="rest">
              Overview
            </Link>
            <Link href={reference} tone="neutral" underline={underline} previewState="hover">
              Changelog
            </Link>
            <Link
              href={reference}
              tone="neutral"
              underline={underline}
              aria-current="page"
              previewState="hover"
            >
              Guides
            </Link>
          </div>
        </div>
      ))}
      <div className="link-study-divider" />
      <Label>Inherited ink without a line · live / pinned hover / pinned press</Label>
      <div className="link-study-state-grid">
        <div>
          <Link href={reference} tone="inherit" underline="none">
            Handbook
          </Link>
        </div>
        <div>
          <Link href={reference} tone="inherit" underline="none" previewState="hover">
            Handbook
          </Link>
        </div>
        <div>
          <Link href={reference} tone="inherit" underline="none" previewState="active">
            Handbook
          </Link>
        </div>
      </div>
      <Label>Current · rest / hover / focus + press</Label>
      <div className="link-study-state-grid">
        <div>
          <Link href={reference} aria-current="page" previewState="rest">
            Guides
          </Link>
        </div>
        <div>
          <Link href={reference} aria-current="page" previewState="hover">
            Guides
          </Link>
        </div>
        <div>
          <Link href={reference} aria-current="page" previewState="active" previewFocus>
            Guides
          </Link>
        </div>
      </div>
      <Text size="caption-l" color="secondary">
        Hover-only and unlined links belong in clear navigation groups. Running prose always keeps
        its underline.
      </Text>
      <div className="link-study-group">
        <Text size="body-s">
          <Link href={reference} disabled external>
            Download archive
          </Link>
        </Text>
        <Text size="caption-l" color="secondary">
          Available after your workspace export finishes.
        </Text>
      </div>
    </div>
  );
}

export function WrappingExamples(): ReactElement {
  return (
    <div className="link-study link-study-measure">
      <div className="link-study-group">
        <Label>Long reference · pinned focus</Label>
        <Text size="body-m">
          Continue with{' '}
          <Link href={reference} external previewFocus>
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
              <Link href={reference} external previewFocus>
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
