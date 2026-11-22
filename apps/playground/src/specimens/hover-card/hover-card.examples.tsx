import {
  Badge,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Icon,
  Link,
  SkeletonText,
  Text,
  Title,
} from '@docouno/unica';
import { FileTextIcon, GitCommitIcon, LockSimpleIcon, TicketIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { TeamPreview } from '../../examples/hover-card-content.js';
import { OverlayExampleFrame } from '../../examples/OverlayExampleFrame.js';
import { OverlayPlacementStudy } from '../../examples/overlay-studies.js';
import { Avatar } from '../../prototypes/avatar/avatar.proto.js';
import type { PreviewContext } from '../../workbench/types.js';

type ExampleProps = { readonly ctx: PreviewContext };

const collection = '?item=03-document-collection';
const reader = '?item=04-document-reader';

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

function DocumentPreview({
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

type ContentState =
  'ready' | 'loading' | 'refreshing' | 'empty' | 'restricted' | 'missing' | 'error';

export function HoverContentStates({ ctx }: ExampleProps): ReactElement {
  const [state, setState] = useState<ContentState>('loading');
  const ready = state === 'ready' || state === 'refreshing' || state === 'empty';
  return (
    <div className="hint-study-stack">
      <div className="hint-study-controls">
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
      <PinnedCard ctx={ctx} title="Preview content" source="Document details" href={reader}>
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
      </PinnedCard>
    </div>
  );
}

function PinnedCard({
  ctx,
  title,
  source,
  href = collection,
  limitHeight = false,
  children,
}: {
  readonly ctx: PreviewContext;
  readonly title: string;
  readonly source: string;
  readonly href?: string;
  readonly limitHeight?: boolean;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <OverlayExampleFrame ctx={ctx} title={title} height={limitHeight ? 278 : 342}>
      <div className="hint-study-anchor" data-position="top-start">
        <HoverCard defaultOpen>
          <HoverCardTrigger asChild>
            <Link href={href} target="_top">
              {source}
            </Link>
          </HoverCardTrigger>
          <HoverCardContent {...ctx.subject} style={limitHeight ? { maxBlockSize: 200 } : {}}>
            {children}
          </HoverCardContent>
        </HoverCard>
      </div>
    </OverlayExampleFrame>
  );
}

export function HoverIdentityExamples({ ctx }: ExampleProps): ReactElement {
  const [example, setExample] = useState('member');
  return (
    <div className="hint-study-stack">
      <div className="hint-study-controls">
        <label>
          Identity
          <select value={example} onChange={(event) => setExample(event.currentTarget.value)}>
            <option value="member">Member</option>
            <option value="team">Team</option>
          </select>
        </label>
      </div>
      <PinnedCard
        ctx={ctx}
        title="Member and team hover cards"
        source={example === 'member' ? 'Design lead' : 'Database reliability'}
      >
        {example === 'member' ? <MemberPreview /> : <TeamPreview />}
      </PinnedCard>
    </div>
  );
}

export function HoverEntityExamples({ ctx }: ExampleProps): ReactElement {
  const [example, setExample] = useState('document');
  const source =
    example === 'document'
      ? 'PG Failover'
      : example === 'issue'
        ? 'Issue UI-128'
        : 'Commit a91c7e2';
  return (
    <div className="hint-study-stack">
      <div className="hint-study-controls">
        <label>
          Entity
          <select value={example} onChange={(event) => setExample(event.currentTarget.value)}>
            <option value="document">Document</option>
            <option value="issue">Issue</option>
            <option value="commit">Commit</option>
          </select>
        </label>
      </div>
      <PinnedCard ctx={ctx} title="Entity hover cards" source={source} href={reader}>
        {example === 'document' ? (
          <DocumentPreview />
        ) : example === 'issue' ? (
          <IssuePreview />
        ) : (
          <CommitPreview />
        )}
      </PinnedCard>
    </div>
  );
}

export function HoverOverflowExamples({ ctx }: ExampleProps): ReactElement {
  const [example, setExample] = useState('limited');
  return (
    <div className="hint-study-stack">
      <div className="hint-study-controls">
        <label>
          Reading space
          <select value={example} onChange={(event) => setExample(event.currentTarget.value)}>
            <option value="limited">Limited height (200 px)</option>
            <option value="long">Long title and summary</option>
            <option value="identifier">Unbroken identifier</option>
          </select>
        </label>
      </div>
      <PinnedCard
        ctx={ctx}
        title="Hover card overflow example"
        source={example === 'identifier' ? 'Search index rebuild' : 'Regional recovery runbook'}
        limitHeight={example === 'limited'}
        href={reader}
      >
        {example === 'identifier' ? (
          <>
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
          </>
        ) : (
          <DocumentPreview long />
        )}
      </PinnedCard>
    </div>
  );
}

export function HoverLiveExamples({ ctx }: ExampleProps): ReactElement {
  return (
    <OverlayPlacementStudy
      ctx={ctx}
      title="Live team preview"
      height={560}
      initialSide="bottom"
      initialAlign="start"
    >
      {(side, align) => (
        <HoverCard>
          <HoverCardTrigger asChild>
            <Link {...ctx.subject} href={collection} target="_top">
              Database reliability
            </Link>
          </HoverCardTrigger>
          <HoverCardContent {...ctx.subject} side={side} align={align}>
            <TeamPreview />
          </HoverCardContent>
        </HoverCard>
      )}
    </OverlayPlacementStudy>
  );
}

export function HoverContextExamples({ ctx }: ExampleProps): ReactElement {
  return (
    <OverlayExampleFrame ctx={ctx} title="Hover card on an inline link" height={308}>
      <div className="hint-study-anchor" data-position="top-start">
        <div className="hint-study-copy">
          Maintained by{' '}
          <HoverCard defaultOpen>
            <HoverCardTrigger asChild>
              <Link href={collection} target="_top">
                Database reliability
              </Link>
            </HoverCardTrigger>
            <HoverCardContent {...ctx.subject}>
              <TeamPreview />
            </HoverCardContent>
          </HoverCard>
          .
        </div>
      </div>
    </OverlayExampleFrame>
  );
}
