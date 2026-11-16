import { useId, useState } from 'react';
import type { CSSProperties, ReactElement } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  FileTextIcon,
  InfoIcon,
  LockSimpleIcon,
  SealCheckIcon,
  SparkleIcon,
  WarningCircleIcon,
  WarningIcon,
} from '@phosphor-icons/react';
import { defineSpecimen } from '../../workbench/types.js';
import { Badge } from './badge.proto.js';
import type { BadgeStatus } from './badge.proto.js';
import type { GlyphComponent } from '../icon/icon.proto.js';
import { Text } from '../text/text.proto.js';
import { Title } from '../title/title.proto.js';
import './badge.examples.css';

const statuses: readonly {
  status: BadgeStatus;
  label: string;
  icon: GlyphComponent;
}[] = [
  { status: 'neutral', label: 'Draft', icon: FileTextIcon },
  { status: 'accent', label: 'Beta', icon: SparkleIcon },
  { status: 'info', label: 'In review', icon: InfoIcon },
  { status: 'success', label: 'Verified', icon: CheckCircleIcon },
  { status: 'warning', label: 'Needs review', icon: WarningIcon },
  { status: 'danger', label: 'Blocked', icon: WarningCircleIcon },
];
const sizes = ['s', 'm', 'l'] as const;
const bounded = (width: string): CSSProperties => ({ '--badge-max-width': width }) as CSSProperties;

function Palette(): ReactElement {
  return (
    <div className="badge-example-stack">
      {statuses.map(({ status, label, icon }) => (
        <div className="badge-example-matrix-row" key={status}>
          <span className="badge-example-caption">{status}</span>
          <div className="badge-example-row">
            <Badge status={status}>{label}</Badge>
            <Badge status={status} dot>
              {label}
            </Badge>
            <Badge status={status} iconLeft={icon}>
              {label}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function Scale(): ReactElement {
  return (
    <div className="badge-example-stack">
      {sizes.map((size, index) => (
        <div className="badge-example-matrix-row" key={size}>
          <span className="badge-example-caption">
            {size.toUpperCase()} · {20 + index * 4}px
          </span>
          <div className="badge-example-row">
            <Badge size={size}>Private</Badge>
            <Badge size={size} status="success" dot>
              Verified
            </Badge>
            <Badge size={size} status="neutral" iconLeft={LockSimpleIcon}>
              Private
            </Badge>
            <span className="badge-example-row">
              <Badge size={size}>4</Badge>
              <Text as="span" size="caption-l" color="secondary">
                comments
              </Text>
            </span>
          </div>
        </div>
      ))}
      <div className="badge-example-rule" />
      <div className="badge-example-row" role="group" aria-label="Inline counts">
        {[0, 4, 11, 99, '99+', '1204'].map((count) => (
          <Badge key={count}>{count}</Badge>
        ))}
      </div>
      <Text size="caption-l" color="secondary">
        Zero is a value. The application chooses when to hide it or cap a count.
      </Text>
    </div>
  );
}

function Inline(): ReactElement {
  return (
    <div className="badge-example-stack">
      <Text className="badge-example-prose">
        The document is{' '}
        <Badge size="s" status="success">
          Verified
        </Badge>{' '}
        and ready to share.
      </Text>
      <Text className="badge-example-prose">
        The service is{' '}
        <Badge size="s" status="success" dot>
          Online
        </Badge>{' '}
        in every region.
      </Text>
      <Text className="badge-example-prose">
        This record is{' '}
        <Badge size="s" iconLeft={LockSimpleIcon}>
          Private
        </Badge>{' '}
        to your workspace.
      </Text>
      <Title as="h3" size="heading-m" className="badge-example-prose">
        Release notes <Badge status="accent">Beta</Badge>
      </Title>
      <div className="badge-example-rule" />
      <div className="badge-example-record">
        <Text size="body-s" weight="medium">
          API reference
        </Text>
        <div className="badge-example-row">
          <Badge size="s">v2.8</Badge>
          <Badge size="s" status="success">
            Published
          </Badge>
        </div>
      </div>
      <div className="badge-example-record">
        <Text size="body-s" weight="medium">
          Migration guide
        </Text>
        <Badge size="s" status="warning">
          Needs review
        </Badge>
      </div>
      <Text size="caption-l" color="secondary">
        S fits running text and dense rows. M is the default; L is for prominent metadata.
      </Text>
    </div>
  );
}

function Overflow(): ReactElement {
  return (
    <div className="badge-example-stack">
      <div className="badge-example-record">
        <Text size="body-s">Category</Text>
        <Badge style={bounded('180px')}>Infrastructure and reliability engineering</Badge>
      </div>
      <Text size="caption-l" color="secondary">
        Infrastructure and reliability engineering
      </Text>
      <div className="badge-example-row">
        <Badge status="warning" dot style={bounded('148px')}>
          Review required before release
        </Badge>
        <Badge status="neutral" iconLeft={LockSimpleIcon} style={bounded('148px')}>
          Restricted to workspace members
        </Badge>
      </div>
      <Text size="caption-l" color="secondary">
        Review required before release · Restricted to workspace members
      </Text>
      <div className="badge-example-row">
        <Badge status="warning" dot style={bounded('72px')}>
          Needs review
        </Badge>
        <Badge iconLeft={LockSimpleIcon} style={bounded('72px')}>
          Restricted
        </Badge>
      </div>
      <div className="badge-example-wrap">
        <Badge size="s">Documentation</Badge>
        <Badge size="s">Infrastructure</Badge>
        <Badge size="s" status="accent">
          v2.8.0-rc.1
        </Badge>
        <Badge size="s" status="info">
          Awaiting approval
        </Badge>
      </div>
      <Text size="caption-l" color="secondary">
        Labels stay on one line; groups wrap between badges. Keep essential statuses short. A
        shortened label needs its full meaning nearby.
      </Text>
    </div>
  );
}

function Interaction(): ReactElement {
  const id = useId();
  const [details, setDetails] = useState(false);
  return (
    <div className="badge-example-stack">
      <div className="badge-example-state-grid">
        {(['rest', 'hover', 'active', 'focus', 'disabled'] as const).map((state) => (
          <div className="badge-example-state" key={state}>
            <span className="badge-example-caption">{state}</span>
            <Badge
              as="button"
              status="info"
              disabled={state === 'disabled'}
              previewState={state === 'rest' || state === 'disabled' ? undefined : state}
            >
              In review
            </Badge>
          </div>
        ))}
      </div>
      <Text size="caption-l" color="secondary">
        Pinned button states above. Underlined labels can be inspected; passive badges have no hover
        or focus treatment.
      </Text>
      <div className="badge-example-row">
        <Badge status="success" dot>
          Verified
        </Badge>
        <Badge as="a">No destination</Badge>
        <Badge as="a" href={`#${id}`} status="neutral">
          v2.8
        </Badge>
        <Badge
          as="button"
          status="info"
          iconLeft={InfoIcon}
          aria-expanded={details}
          aria-controls={`${id}-details`}
          onClick={() => setDetails(!details)}
        >
          In review
        </Badge>
      </div>
      <div id={`${id}-details`} hidden={!details} className="badge-example-detail">
        <Text size="body-s">Two reviewers are checking the latest changes.</Text>
        <Text size="caption-l" color="secondary">
          The trigger keeps focus. Activate it again to close these details.
        </Text>
      </div>
      <Text id={id} tabIndex={-1} size="body-s" className="badge-example-destination">
        Version 2.8 adds workspace sharing and improves search.
      </Text>
      <Text size="caption-l" color="secondary">
        Try Tab, Enter and Space. The version is a real in-page link; the review marker opens
        details. For a standalone touch action, use a larger surrounding control.
      </Text>
    </div>
  );
}

const lifecycle: readonly { label: string; status: BadgeStatus; icon: GlyphComponent }[] = [
  { label: 'Not checked', status: 'neutral', icon: FileTextIcon },
  { label: 'Checking', status: 'info', icon: ClockIcon },
  { label: 'Verified', status: 'success', icon: SealCheckIcon },
  { label: 'Needs review', status: 'warning', icon: WarningIcon },
  { label: 'Blocked', status: 'danger', icon: WarningCircleIcon },
];
function Changes(): ReactElement {
  const [step, setStep] = useState(0);
  const current = lifecycle[step]!;
  return (
    <div className="badge-example-stack">
      <div className="badge-example-record">
        <Text size="body-s" weight="medium">
          Document check
        </Text>
        <span
          className="badge-example-status-slot"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <Badge status={current.status} iconLeft={current.icon}>
            {current.label}
          </Badge>
        </span>
      </div>
      <div className="badge-example-row">
        <button
          type="button"
          className="badge-example-control"
          onClick={() => setStep((step + 1) % lifecycle.length)}
        >
          Next status
        </button>
        <button
          type="button"
          className="badge-example-control"
          onClick={() => setStep(0)}
          disabled={step === 0}
        >
          Reset
        </button>
      </div>
      <Text size="caption-l" color="secondary">
        Manual state preview. Updates are immediate, with no pulse, spin or crossfade. Only this
        result region announces changes; ordinary badges stay silent.
      </Text>
    </div>
  );
}

export default defineSpecimen({
  id: 'badge',
  title: 'Badge',
  group: 'Status',
  summary: 'Quiet metadata, clear status. One marker, six semantic tones, three compact sizes.',
  sections: [
    {
      id: 'palette',
      title: 'Meaning & anatomy',
      kind: 'matrix',
      caption: 'Text, signal or glyph. Color supports the words; it never replaces them.',
      render: () => <Palette />,
    },
    { id: 'scale', title: 'Sizes & inline counts', kind: 'matrix', render: () => <Scale /> },
    { id: 'inline', title: 'In the reading flow', kind: 'context', render: () => <Inline /> },
    {
      id: 'overflow',
      title: 'Long labels & narrow spaces',
      kind: 'states',
      render: () => <Overflow />,
    },
    {
      id: 'interaction',
      title: 'Inspectable metadata',
      kind: 'states',
      render: () => <Interaction />,
    },
    { id: 'changes', title: 'Changing status', kind: 'states', render: () => <Changes /> },
  ],
});
