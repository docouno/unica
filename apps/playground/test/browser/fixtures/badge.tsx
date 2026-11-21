import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import { Badge, UnicaProvider } from '@docouno/unica';
import type { BadgeStatus } from '@docouno/unica';
import { CheckCircleIcon, InfoIcon } from '@phosphor-icons/react';
import { useState } from 'react';

const statuses: readonly BadgeStatus[] = [
  'neutral',
  'accent',
  'info',
  'success',
  'warning',
  'danger',
];
const longLabel = 'Restricted to workspace members';

function Palette({ surface }: { surface: 'base' | 'overlay' }) {
  return (
    <section
      data-testid={surface}
      data-surface={surface}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, max-content)',
        gap: 6,
        padding: 12,
        background: surface === 'overlay' ? 'var(--bg-overlay)' : 'var(--bg-canvas)',
        backdropFilter: surface === 'overlay' ? 'var(--overlay-backdrop)' : undefined,
      }}
    >
      {statuses.map((status) => (
        <div key={status} style={{ display: 'flex', gap: 8 }}>
          <Badge status={status} dot data-testid={status + '-dot'}>
            {status}
          </Badge>
          <Badge asChild status={status} iconLeft={InfoIcon}>
            <button data-testid={status + '-action'}>{status}</button>
          </Badge>
        </div>
      ))}
    </section>
  );
}

function Geometry() {
  const probe = <span data-baseline="" style={{ display: 'inline-block', width: 0, height: 0 }} />;
  return (
    <section
      data-testid="geometry"
      style={{ font: 'var(--text-size-body-m)/var(--text-size-body-m-lh) var(--font-family-base)' }}
    >
      <UnicaProvider overrides={{ Icon: { size: 'l' } }}>
        {(['s', 'm', 'l'] as const).map((size) => (
          <div key={size}>
            <Badge size={size} dot data-testid={size + '-dot'}>
              Ready
            </Badge>{' '}
            <Badge size={size} iconLeft={InfoIcon} data-testid={size + '-glyph'}>
              Ready
            </Badge>{' '}
            <Badge size={size} data-testid={size + '-count'}>
              {0}
            </Badge>
          </div>
        ))}
      </UnicaProvider>
      <p data-testid="inline" style={{ margin: 0 }}>
        Before {probe}
        <Badge size="s" status="info" dot>
          Ready{probe}
        </Badge>
        {probe} after
      </p>
      <p data-testid="plain" style={{ margin: 0 }}>
        Before {probe}Ready{probe} after
      </p>
      <Badge asChild dot style={{ '--badge-max-width': '72px' }}>
        <a href="#version">{longLabel}</a>
      </Badge>
      <Badge iconLeft={InfoIcon} data-testid="wide-glyph" style={{ '--badge-max-width': '148px' }}>
        {longLabel}
      </Badge>
      <div data-testid="wrap" style={{ display: 'flex', flexWrap: 'wrap', width: 165, gap: 4 }}>
        <Badge status="info">Approved</Badge>
        <Badge>Documentation status</Badge>
        <Badge>Operational notices</Badge>
      </div>
    </section>
  );
}

function Actions() {
  const [hidden, setHidden] = useState(true);
  const [details, setDetails] = useState(0);
  const [changed, setChanged] = useState(false);
  return (
    <section data-testid="actions">
      <button type="button">First stop</button>
      <Badge
        data-testid="passive"
        dot
        status="danger"
        data-status="archived"
        data-ticket={42}
        data-unica-mark-status="success"
        data-unica-badge-size="l"
        data-unica-badge-numeric
      >
        Passive
      </Badge>
      <Badge asChild>
        <a data-testid="no-href">No destination</a>
      </Badge>
      <Badge asChild status="danger" dot>
        <button disabled>Unavailable</button>
      </Badge>
      <fieldset disabled style={{ display: 'inline' }}>
        <Badge asChild iconLeft={InfoIcon} status="warning">
          <button>Fieldset disabled</button>
        </Badge>
      </fieldset>
      <Badge hidden={hidden} data-testid="hidden-passive">
        Hidden label
      </Badge>
      <Badge asChild hidden={hidden} data-testid="hidden-action">
        <button>Hidden action</button>
      </Badge>
      <Badge asChild>
        <a href="#version">Version 2</a>
      </Badge>
      <span tabIndex={-1} id="version">
        About v2
      </span>
      <Badge
        asChild
        iconLeft={changed ? CheckCircleIcon : InfoIcon}
        size="s"
        status={changed ? 'success' : 'danger'}
        data-testid="details"
        data-status="outer"
        data-ticket={42}
        data-unica-mark-status="warning"
        data-unica-badge-size="l"
        data-unica-badge-numeric
      >
        <button
          data-status="archived"
          data-size="app-defined"
          data-unica-mark-status="warning"
          data-unica-badge-size="l"
          data-unica-badge-numeric
          aria-expanded={details % 2 !== 0}
          aria-controls="detail-panel"
          onClick={() => setDetails((value) => value + 1)}
        >
          {changed ? 'Verified' : 'Review details'}
        </button>
      </Badge>
      <span id="detail-panel" hidden={details % 2 === 0}>
        Two reviewers
      </span>
      <output data-testid="activation-count">{details}</output>
      <button type="button" onClick={() => setHidden(false)}>
        Reveal badges
      </button>
      <button type="button" onClick={() => setChanged(true)}>
        Verify
      </button>
    </section>
  );
}

function FormActions() {
  const [submits, setSubmits] = useState(0);
  return (
    <form
      aria-label="Submit options"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmits((value) => value + 1);
      }}
    >
      <input name="title" aria-label="Title" defaultValue="Draft" />
      <Badge asChild>
        <button>Omitted type</button>
      </Badge>
      <Badge asChild>
        <button type={undefined}>Undefined type</button>
      </Badge>
      <Badge asChild>
        <button type="submit" name="action" value="approve">
          Approve
        </button>
      </Badge>
      <Badge asChild>
        <button type="reset">Reset</button>
      </Badge>
      <output data-testid="submit-count">{submits}</output>
    </form>
  );
}

export default function BadgeFixture() {
  return (
    <>
      <Actions />
      <FormActions />
      <Geometry />
      <Palette surface="base" />
      <div style={{ background: 'linear-gradient(135deg, var(--accent-solid), var(--bg-canvas))' }}>
        <Palette surface="overlay" />
      </div>
    </>
  );
}
