import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { FileTextIcon, GitCommitIcon, LockSimpleIcon, TicketIcon } from '@phosphor-icons/react';
import { Avatar } from '../avatar/avatar.proto.js';
import { Badge, Icon, Link, Text, Title } from '@docouno/unica';
import { SkeletonText } from '../skeleton/skeleton.proto.js';
import { Study } from './tooltip.study.js';
import { HoverCard } from './tooltip.proto.js';
import { TeamPreview } from './hover-card.content.js';
import type { HintAlign, HintSide } from './tooltip.proto.js';
import { HintPreview } from './tooltip.preview.js';
import './hover-card.examples.css';

// Content compositions are examples of anatomy, not proposed entity-specific APIs.

function MemberPreview(): ReactElement {
  return (
    <>
      <div className="hover-demo-identity">
        <Avatar name="Design lead" alt="" src="/assets/avatar-person-light.png" size="m" />
        <div className="hover-demo-heading">
          <Title dir="auto" as="h3" size="body-m">
            Design lead
          </Title>
          <Text dir="auto" size="body-s" color="secondary">
            Product design · Studio
          </Text>
        </div>
      </div>
      <Text dir="auto" size="body-s" color="secondary">
        Working on the details that make everyday tools feel effortless.
      </Text>
      <div className="hover-demo-facts">
        <Badge status="success" size="s" dot>
          Available
        </Badge>
        <Text dir="auto" size="caption-l" color="secondary">
          Local time 10:42 · UTC+1
        </Text>
      </div>
    </>
  );
}

export function DocumentPreview({
  long = false,
  empty = false,
}: {
  readonly long?: boolean;
  readonly empty?: boolean;
}): ReactElement {
  return (
    <>
      <div className="hover-demo-kicker">
        <Icon usage="slot" className="hover-demo-glyph" icon={FileTextIcon} size="s" />
        <span>Runbook · Core Infrastructure</span>
      </div>
      <Title dir="auto" as="h3" size="body-m">
        {long
          ? 'Recover a production database after an interrupted regional migration'
          : 'Zero-Downtime PG Failover'}
      </Title>
      <Text dir="auto" size="body-s" color="secondary">
        {empty
          ? 'No summary yet.'
          : long
            ? 'A step-by-step recovery guide covering replica promotion, traffic draining, integrity checks and a safe return to normal operations. Verify the active region before making changes.'
            : 'Promote a healthy replica, drain traffic safely and verify recovery before restoring writes.'}
      </Text>
      <div className="hover-demo-tags">
        <Badge status="neutral" size="s">
          postgres
        </Badge>
        <Badge status="neutral" size="s">
          {long ? 'disaster-recovery' : 'production'}
        </Badge>
      </div>
      <div className="hover-demo-facts hover-demo-separated">
        <Badge status="success" size="s" dot>
          Verified
        </Badge>
        <Text dir="auto" size="caption-l" color="secondary">
          Updated 2h ago · 6 min read
        </Text>
      </div>
    </>
  );
}

function IssuePreview(): ReactElement {
  return (
    <>
      <div className="hover-demo-kicker">
        <Icon usage="slot" icon={TicketIcon} size="s" />
        <bdi dir="ltr">UI-128</bdi>
        <span>Interface</span>
      </div>
      <Title dir="auto" as="h3" size="body-m">
        Keep the inspector in view
      </Title>
      <Text dir="auto" size="body-s" color="secondary">
        Preserve the active document context when switching between related records.
      </Text>
      <div className="hover-demo-facts">
        <Badge status="info" size="s" dot>
          In progress
        </Badge>
        <Text dir="auto" size="caption-l" color="secondary">
          Design systems
        </Text>
      </div>
    </>
  );
}

function CommitPreview(): ReactElement {
  return (
    <>
      <div className="hover-demo-kicker">
        <Icon usage="slot" icon={GitCommitIcon} size="s" />
        <bdi dir="ltr">a91c7e2</bdi>
      </div>
      <Title dir="auto" as="h3" size="body-m">
        Preserve focus after saving a document
      </Title>
      <Text dir="auto" size="body-s" color="secondary">
        Return to the source action after the editor finishes saving.
      </Text>
      <div className="hover-demo-facts">
        <Text dir="auto" size="caption-l" color="secondary">
          3 files changed
        </Text>
        <Text dir="auto" size="caption-l" color="secondary">
          Committed 4h ago
        </Text>
      </div>
    </>
  );
}

export function HoverIdentityExamples(): ReactElement {
  return (
    <div className="hint-demo-stack">
      <Study label="Member · Image, identity and availability">
        <HoverCard>
          <MemberPreview />
        </HoverCard>
      </Study>
      <Study label="Team · Fallback avatar and ownership">
        <HoverCard>
          <TeamPreview />
        </HoverCard>
      </Study>
    </div>
  );
}

export function HoverEntityExamples(): ReactElement {
  return (
    <div className="hint-demo-stack">
      <Study label="Document · Summary and classification">
        <HoverCard>
          <DocumentPreview />
        </HoverCard>
      </Study>
      <Study label="Issue · Identifier and status">
        <HoverCard>
          <IssuePreview />
        </HoverCard>
      </Study>
      <Study label="Commit · Message and change summary">
        <HoverCard>
          <CommitPreview />
        </HoverCard>
      </Study>
    </div>
  );
}

type ContentState =
  'ready' | 'loading' | 'refreshing' | 'empty' | 'restricted' | 'missing' | 'error';

export function HoverContentStates(): ReactElement {
  const [state, setState] = useState<ContentState>('loading');
  const ready = state === 'ready' || state === 'refreshing' || state === 'empty';
  return (
    <div className="hint-demo-stack">
      <div className="hint-demo-options">
        <label>
          Preview content
          <select value={state} onChange={(event) => setState(event.target.value as ContentState)}>
            {(
              ['ready', 'loading', 'refreshing', 'empty', 'restricted', 'missing', 'error'] as const
            ).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <HoverCard>
        {ready ? (
          <>
            <DocumentPreview empty={state === 'empty'} />
            {state === 'refreshing' && (
              <Text dir="auto" size="caption-l" color="secondary">
                Updating preview…
              </Text>
            )}
          </>
        ) : state === 'loading' ? (
          <>
            <div className="hover-demo-kicker">
              <Icon usage="slot" className="hover-demo-glyph" icon={FileTextIcon} size="s" />
              <span>Document preview</span>
            </div>
            <Title dir="auto" as="h3" size="body-m">
              Zero-Downtime PG Failover
            </Title>
            <div className="hover-demo-loading">
              <SkeletonText size="body-s" lines={2} />
              <Text dir="auto" size="caption-l" color="secondary">
                Loading preview…
              </Text>
            </div>
          </>
        ) : (
          <div className="hover-demo-unavailable">
            {state === 'restricted' && (
              <Icon
                usage="slot"
                className="hover-demo-glyph"
                icon={LockSimpleIcon}
                size="m"
                color="secondary"
              />
            )}
            <Title dir="auto" as="h3" size="body-m">
              {state === 'restricted'
                ? 'Private document'
                : state === 'missing'
                  ? 'Document not found'
                  : 'Preview unavailable'}
            </Title>
            <Text dir="auto" size="body-s" color="secondary">
              {state === 'restricted'
                ? 'Preview details are hidden. Open the link to check your access.'
                : state === 'missing'
                  ? 'This document may have moved or been removed.'
                  : 'The preview could not be loaded. You can still open the document.'}
            </Text>
          </div>
        )}
      </HoverCard>
    </div>
  );
}

export function HoverOverflowExamples(): ReactElement {
  return (
    <div className="hint-demo-stack">
      <Study label="Long title, summary and metadata · No clipped names">
        <HoverCard>
          <DocumentPreview long />
        </HoverCard>
      </Study>
      <Study label="Unbroken identifier · Isolated LTR text">
        <HoverCard>
          <div className="hover-demo-kicker">
            <Icon usage="slot" icon={GitCommitIcon} size="s" />
            <span>Commit</span>
          </div>
          <Title dir="auto" as="h3" size="body-m">
            Rebuild the regional search index
          </Title>
          <Text dir="auto" size="body-s" color="secondary">
            <bdi dir="ltr">release/production-eu-central-search-rebuild-2026</bdi>
          </Text>
          <Text dir="auto" size="caption-l" color="secondary">
            Missing author metadata is omitted.
          </Text>
        </HoverCard>
      </Study>
      <Study label="Limited height · Scroll escape for pointer reading">
        <HoverCard className="hover-demo-constrained">
          <DocumentPreview long />
        </HoverCard>
      </Study>
    </div>
  );
}

export function HoverLiveExamples(): ReactElement {
  const destination = `preview-destination-${useId()}`;
  const [side, setSide] = useState<HintSide>('bottom');
  const [align, setAlign] = useState<HintAlign>('start');
  const [anchor, setAnchor] = useState('center');
  return (
    <div className="hint-demo-stack">
      <div className="hint-demo-options">
        <label>
          Side
          <select value={side} onChange={(event) => setSide(event.target.value as HintSide)}>
            {['top', 'bottom', 'start', 'end'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Align
          <select value={align} onChange={(event) => setAlign(event.target.value as HintAlign)}>
            {['start', 'center', 'end'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Source
          <select value={anchor} onChange={(event) => setAnchor(event.target.value)}>
            {['center', 'top-start', 'bottom-end'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="hint-demo-stage hover-demo-stage" data-anchor={anchor} data-hint-bounds>
        <span className="hint-demo-stage-label hint-demo-label">
          Hover or Tab · Select text · Escape to dismiss
        </span>
        <div className="hint-demo-anchor">
          <HintPreview
            family="hover-card"
            side={side}
            align={align}
            trigger={(bindings) => (
              <Link {...bindings} href={`#${destination}`}>
                Database reliability
              </Link>
            )}
          >
            <TeamPreview />
          </HintPreview>
        </div>
        <Link className="hint-demo-after" href={`#${destination}`}>
          Continue to destination
        </Link>
      </div>
      <div id={destination} className="hover-demo-destination">
        <Text dir="auto" size="body-s" weight="medium">
          Database reliability
        </Text>
        <Text dir="auto" size="body-s" color="secondary">
          Destination sample. The original link remains the way to open full details.
        </Text>
      </div>
    </div>
  );
}

export function HoverContextExamples(): ReactElement {
  return (
    <div className="hint-demo-stack">
      <p className="hint-demo-copy">
        Maintained by <Link href="#maintainer">Database reliability</Link>.
      </p>
      <HoverCard>
        <TeamPreview />
      </HoverCard>
      <Text dir="auto" size="caption-l" color="secondary">
        The card is pinned open. Hover or Tab to the source to inspect the live link.
      </Text>
    </div>
  );
}
