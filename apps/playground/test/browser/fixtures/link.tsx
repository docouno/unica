import { IconProvider, Link, defineGlyph } from '@docouno/unica';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentPropsWithRef, ReactElement, RefCallback } from 'react';

const FileGlyph = defineGlyph((props) => (
  <svg {...props} viewBox="0 0 24 24">
    <path d="M4 2h12l4 4v16H4z" fill="currentColor" />
  </svg>
));
const ArrowGlyph = defineGlyph((props) => (
  <svg {...props} viewBox="0 0 24 24">
    <path d="M2 10h16v4H2z" fill="currentColor" />
  </svg>
));
function NullGlyph(): null {
  return null;
}

const fixedLine = (
  <Link href="#target" iconRight={NullGlyph}>
    handbook
  </Link>
);

function FixedLineSample(): ReactElement {
  const [showGlyph, setShowGlyph] = useState(false);
  return (
    <section data-testid="fixed-line-context">
      <button type="button" onClick={() => setShowGlyph(!showGlyph)}>
        Toggle trailing glyph
      </button>
      <p
        data-testid="fixed-line"
        style={{ font: '24px / 38.4px Arial', inlineSize: 120, blockSize: 160 }}
      >
        <IconProvider
          adapter={(_glyph, { svgProps }) =>
            showGlyph ? <svg {...svgProps} viewBox="0 0 24 24" /> : null
          }
        >
          {fixedLine}
        </IconProvider>
      </p>
    </section>
  );
}

type RouteProps = Omit<ComponentPropsWithRef<'a'>, 'href'> & {
  readonly to: string;
  readonly active: boolean;
  readonly onRoute: () => void;
};

function TestRoute({ to, active, ref, onClick, onRoute, ...props }: RouteProps): ReactElement {
  const forwardRef = useCallback<RefCallback<HTMLAnchorElement>>(
    (node) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  return (
    <a
      {...props}
      href={to}
      aria-current={active ? 'page' : undefined}
      ref={forwardRef}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && event.button === 0 && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          window.history.pushState(null, '', to);
          onRoute();
        }
      }}
    />
  );
}

function RouterSample(): ReactElement {
  const [disabled, setDisabled] = useState(false);
  const [active, setActive] = useState(false);
  const [cancel, setCancel] = useState('none');
  const [calls, setCalls] = useState<string[]>([]);
  const [refs, setRefs] = useState({ attached: 0, detached: 0 });
  const outer = useRef<HTMLAnchorElement>(null);
  const childRef = useCallback<RefCallback<HTMLAnchorElement>>((node) => {
    if (node) {
      setRefs((value) => ({ ...value, attached: value.attached + 1 }));
      return () => {
        setRefs((value) => ({ ...value, detached: value.detached + 1 }));
      };
    }
  }, []);
  const record = (call: string): void => setCalls((current) => [...current, call]);

  return (
    <section
      aria-label="Router sample"
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest('a')) {
          record('ancestor');
        }
      }}
    >
      <label>
        Cancel transition
        <select value={cancel} onChange={(event) => setCancel(event.currentTarget.value)}>
          <option value="none">None</option>
          <option value="child">Child</option>
          <option value="outer">Outer</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={disabled}
          onChange={(event) => setDisabled(event.currentTarget.checked)}
        />
        Disable route
      </label>
      <button type="button" data-testid="before-route">
        Before route
      </button>
      <Link
        asChild
        disabled={disabled}
        ref={outer}
        onClickCapture={() => record('capture')}
        onAuxClickCapture={() => record('aux capture')}
        onClick={(event) => {
          record('outer');
          if (cancel === 'outer') {
            event.preventDefault();
          }
        }}
      >
        <TestRoute
          to="#route"
          active={active}
          ref={childRef}
          tabIndex={0}
          aria-disabled="true"
          aria-describedby="route-note"
          rel="opener license"
          target="_blank"
          data-testid="route"
          onClick={(event) => {
            record('child');
            if (cancel === 'child') {
              event.preventDefault();
            }
          }}
          onRoute={() => {
            record('route');
            setActive(true);
          }}
        >
          Router destination
        </TestRoute>
      </Link>
      <span id="route-note" hidden>
        Route details
      </span>
      <button type="button" onClick={() => setCalls([])}>
        Clear activity
      </button>
      <output data-testid="calls">{calls.join(',')}</output>
      <output data-testid="refs">{refs.attached - refs.detached}</output>
      <output
        data-testid="matched-ref"
        ref={(node) => {
          if (node) {
            node.value = outer.current?.dataset.testid ?? '';
          }
        }}
      />
    </section>
  );
}

function LiveReportLabel(): ReactElement | null {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const reveal = (): void => setVisible(true);
    document.addEventListener('reveal-report-label', reveal);
    return () => document.removeEventListener('reveal-report-label', reveal);
  }, []);
  return visible ? <strong>Ready report</strong> : null;
}

function DescriptionSample(): ReactElement {
  const [hasReference, setHasReference] = useState(true);
  const [description, setDescription] = useState('Quarterly results');
  return (
    <section>
      <button type="button" onClick={() => setDescription('Annual results')}>
        Update author text
      </button>
      <button type="button" onClick={() => setHasReference(!hasReference)}>
        Toggle author reference
      </button>
      {hasReference && (
        <span id="report-note" hidden>
          {description}
        </span>
      )}
      <span id="report-name" hidden>
        Annual report
      </span>
      <span id="report-image-name" hidden>
        <img alt="External report" />
      </span>
      <button
        type="button"
        onClick={() => document.dispatchEvent(new Event('reveal-report-label'))}
      >
        Reveal report label
      </button>
      <Link
        href="#target"
        target="_blank"
        aria-labelledby="report-image-name"
        title="PDF, 4 MB"
        data-testid="image-name"
      />
      <Link
        href="#target"
        target="_blank"
        title="Title names destination"
        data-testid="decorative-name"
      >
        <span aria-hidden="true">Visible decoration</span>
      </Link>
      <Link href="#target" target="_blank" title="PDF coming soon" data-testid="live-name">
        <LiveReportLabel />
      </Link>
      <Link
        href="#target"
        target="_blank"
        aria-labelledby="report-name"
        aria-describedby="report-note report-note missing"
        aria-description="Portable document"
        title="PDF, 4 MB"
        newTabHint="Se abre en una pestaña nueva"
        data-testid="referenced"
      >
        <em>Visible report link</em>
      </Link>
      <Link
        href="#target"
        target="_BLANK"
        aria-label="Named report"
        aria-description="Author description"
        title="Ignored tooltip"
        data-testid="named"
      >
        Visible report
      </Link>
      <Link href="#target" target="_blank" title="PDF, 4 MB" data-testid="titled">
        <strong>Report</strong>
      </Link>
      <Link href="#target" title="Report" data-testid="same-title-native">
        <strong>Report</strong>
      </Link>
      <Link href="#target" target="_blank" title="Report" data-testid="same-title">
        <strong>Report</strong>
      </Link>
      <Link
        href="#target"
        target="_blank"
        aria-label="Report"
        title=" Report "
        data-testid="explicit-same-title"
      >
        Report
      </Link>
      <Link
        href="#target"
        target="_blank"
        aria-label="Report"
        title="Report"
        data-testid="explicit-different-text"
      >
        Visible report
      </Link>
      <Link
        href="#target"
        target="_blank"
        aria-labelledby="report-name"
        title="Report"
        data-testid="idref-same-title"
      >
        Report
      </Link>
      <Link href="#target" target="_blank" title="Report" data-testid="image-same-title">
        <img alt="Report" />
      </Link>
      <Link href="#target" target="_blank" title="Reportsummary" data-testid="broken-line-title">
        Report
        <br />
        summary
      </Link>
      <Link href="#target" target="_blank" title="Title-only name" data-testid="title-name" />
      <Link
        href="#target"
        target="_blank"
        aria-describedby="missing"
        title="Tooltip fallback"
        data-testid="missing-description"
      >
        Report
      </Link>
      <Link
        href="#target"
        target="_blank"
        aria-labelledby="report-name"
        title="Named via IDREF"
        data-testid="idref-name"
      />
      <Link
        disabled
        target="_blank"
        aria-description="Not yet published"
        data-testid="disabled-name"
      >
        Future report
      </Link>
      <Link href="#target" external data-testid="same-tab-external">
        External same tab
      </Link>
    </section>
  );
}

export default function LinkFixture(): ReactElement {
  const [submits, setSubmits] = useState(0);
  return (
    <>
      <button type="button" data-testid="before-native">
        Before
      </button>{' '}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmits(submits + 1);
        }}
      >
        <input name="entry" type="hidden" value="keep" />
        <Link href="#target" data-testid="native">
          Jump to details
        </Link>{' '}
        <Link disabled href="#target" data-testid="unavailable">
          Unavailable
        </Link>{' '}
        <button type="button" data-testid="after-native">
          After
        </button>
        <output data-testid="submits">{submits}</output>
      </form>
      <section aria-label="Browser destinations">
        <Link href="#target" target="_blank" data-testid="popup">
          Open a new tab
        </Link>{' '}
        <Link href="/test/browser/index.html" download="" target="_blank" data-testid="download">
          Download fixture
        </Link>{' '}
        <Link
          href="/test/browser/index.html"
          download="unica-fixture.html"
          target="_blank"
          external
          data-testid="named-download"
        >
          Download named fixture
        </Link>{' '}
        <Link
          disabled
          href="/test/browser/index.html"
          download
          target="_blank"
          data-testid="disabled-download"
        >
          Pending file
        </Link>
      </section>
      <RouterSample />
      <DescriptionSample />
      <FixedLineSample />
      <section
        style={{
          fontSize: 24,
          fontWeight: 600,
          fontStyle: 'italic',
          lineHeight: '1.6',
          letterSpacing: '0.15px',
        }}
      >
        <p data-testid="wrap" style={{ inlineSize: 220 }}>
          <Link
            href="#target"
            iconLeft={FileGlyph}
            iconRight={ArrowGlyph}
            external
            data-testid="wrapped"
          >
            <span data-testid="first-word">Read</span> the important and accessible field{' '}
            <span data-testid="last-word">guide</span>
          </Link>
        </p>
        <p style={{ inlineSize: 220 }}>
          <Link href="#target" size="caption-s" data-testid="caption">
            Explicit size
          </Link>
        </p>
        <p
          data-testid="whole-word"
          style={{ font: '24px / 38.4px Arial', inlineSize: 200, blockSize: 160 }}
        >
          <Link href="#target" external>
            Research the <span>handbook</span>
          </Link>
        </p>
        <div style={{ font: '32px / 48px Arial' }}>
          <p data-testid="long-url" style={{ inlineSize: 209 }}>
            <Link href="#target" external>
              <bdi>
                https://example.com/research/understanding-accessibility-in-collaborative-workspaces
              </bdi>
            </Link>
          </p>
          <p data-testid="spaced-url" style={{ inlineSize: 160 }}>
            <Link href="#target" external>
              <bdi>
                {
                  'https://example.com/research/understanding-accessibility-in-collaborative-workspaces '
                }
              </bdi>
            </Link>
          </p>
          <p data-testid="plain-url" style={{ inlineSize: 160 }}>
            <Link href="#target" external>
              {
                'https://example.com/research/understanding-accessibility-in-collaborative-workspaces '
              }
            </Link>
          </p>
          <p data-testid="relative-url" style={{ inlineSize: 170 }}>
            <Link href="#target" external>
              /research/understanding-accessibility-in-collaborative-workspaces
            </Link>
          </p>
          <p data-testid="mail-address" style={{ inlineSize: 149 }}>
            <Link href="#target" external>
              mailto:understanding-accessibility-in-collaborative-workspaces@example.com
            </Link>
          </p>
          <p data-testid="ordinary-wrap" style={{ inlineSize: 170 }}>
            <Link href="#target" external>
              Research into <strong>collaborative workspaces</strong>{' '}
            </Link>
          </p>
          <p data-testid="whitespace-node" style={{ font: '24px / 38.4px Arial', inlineSize: 157 }}>
            <Link href="#target" external>
              <bdi>
                https://example.com/research/understanding-accessibility-in-collaborative-workspaces
              </bdi>
              <span> </span>
            </Link>
          </p>
          <p data-testid="empty-fragment" style={{ font: '24px / 38.4px Arial', inlineSize: 157 }}>
            <Link href="#target" external>
              <bdi>
                https://example.com/research/understanding-accessibility-in-collaborative-workspaces
              </bdi>
              <></>
            </Link>
          </p>
          <p data-testid="hidden-node" style={{ font: '24px / 38.4px Arial', inlineSize: 157 }}>
            <Link href="#target" external>
              <bdi>
                https://example.com/research/understanding-accessibility-in-collaborative-workspaces
              </bdi>
              <span hidden>Invisible note</span>
            </Link>
          </p>
          <p data-testid="numeric-label" style={{ inlineSize: 120 }}>
            <Link href="#target" external>
              Research into collaborative workspaces{104}
            </Link>
          </p>
        </div>
        <IconProvider adapter={() => null}>
          <div>
            <Link href="#target" iconLeft={NullGlyph} iconRight={NullGlyph} data-testid="no-glyph">
              Plain text
            </Link>
          </div>
          <div>
            <Link href="#target" data-testid="plain">
              Plain text
            </Link>
          </div>
          <div>
            <Link href="#target" target="_blank" iconRight={NullGlyph} data-testid="pinned-glyph">
              Plain text
            </Link>
          </div>
        </IconProvider>
      </section>
      <p id="target" tabIndex={-1} style={{ marginBlock: '500px' }}>
        Fragment destination
      </p>
    </>
  );
}
