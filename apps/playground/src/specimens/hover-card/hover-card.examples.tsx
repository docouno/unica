import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { FileTextIcon, LockSimpleIcon } from '@phosphor-icons/react';
import {
  Flex,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Icon,
  Link,
  SkeletonText,
  Stack,
  Text,
  Title,
} from '@docouno/unica';
import { OverlayExampleFrame } from '../../examples/OverlayExampleFrame.js';
import { placementAlignments, placementSides } from '../../examples/overlay-placement-options.js';
import type { PreviewProps } from '../../workbench/types.js';
import { DocumentPreview, EntityCard } from './entity-card.js';
import { IdentityCard, TeamPreview } from './identity-card.js';
import '../../examples/overlay-studies.css';

function Frame({
  ctx,
  title,
  height,
  position = 'top-start',
  children,
}: PreviewProps & { title: string; height: number; position?: string; children: ReactNode }) {
  return (
    <OverlayExampleFrame ctx={ctx} title={title} height={height}>
      <div className="hint-study-anchor" data-position={position}>
        {children}
      </div>
    </OverlayExampleFrame>
  );
}

export function HoverContentStates({ ctx }: PreviewProps) {
  const state = ctx.story?.controls.content ?? 'loading';
  const available = state === 'ready' || state === 'empty' || state === 'refreshing';
  return (
    <Frame ctx={ctx} title="Preview content" height={342}>
      <HoverCard defaultOpen>
        <HoverCardTrigger asChild>
          <Link
            {...ctx.subject}
            href="https://www.postgresql.org/docs/17/warm-standby-failover.html"
            target="_top"
          >
            PostgreSQL failover
          </Link>
        </HoverCardTrigger>
        <HoverCardContent {...ctx.subject}>
          {available ? (
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
              <Flex align="start" gap={8}>
                <Icon usage="slot" icon={FileTextIcon} size="s" color="secondary" />
                <Text dir="auto" size="caption-l" color="secondary">
                  Document preview
                </Text>
              </Flex>
              <Title dir="auto" as="h3" size="body-m">
                Failover
              </Title>
              <Stack gap={12} style={{ minBlockSize: 88 }}>
                <SkeletonText size="body-s" lines={2} />
                <Text dir="auto" size="caption-l" color="secondary">
                  Loading preview…
                </Text>
              </Stack>
            </>
          ) : (
            <Stack gap={8} style={{ minBlockSize: 88, justifyContent: 'center' }}>
              {state === 'restricted' && (
                <Icon usage="slot" icon={LockSimpleIcon} size="m" color="secondary" />
              )}
              <Title dir="auto" as="h3" size="body-m">
                {state === 'restricted'
                  ? 'Restricted preview'
                  : state === 'missing'
                    ? 'Preview record not found'
                    : 'Preview unavailable'}
              </Title>
              <Text dir="auto" size="body-s" color="secondary">
                {state === 'restricted'
                  ? 'The preview provider withheld these details. Open the guide to read the source.'
                  : state === 'missing'
                    ? 'This document has no record in the preview catalog.'
                    : 'The preview could not be loaded. You can still open the document.'}
              </Text>
            </Stack>
          )}
        </HoverCardContent>
      </HoverCard>
    </Frame>
  );
}

export function HoverOverflowExamples({ ctx }: PreviewProps) {
  const mode = ctx.story?.controls.reading ?? 'limited';
  return (
    <Frame ctx={ctx} title="Hover card overflow example" height={mode === 'limited' ? 278 : 342}>
      <EntityCard
        linkProps={{ target: '_top' }}
        subject={ctx.subject}
        entity={mode === 'identifier' ? 'commit' : 'document'}
        long={mode !== 'identifier'}
        limited={mode === 'limited'}
        identifier={mode === 'identifier'}
      />
    </Frame>
  );
}

function LiveTeamLink({ ctx }: PreviewProps) {
  const [open, setOpen] = useState(false);
  const source = useRef<HTMLAnchorElement>(null);
  const controls = ctx.story?.controls;
  const side = placementSides.find((value) => value === controls?.side) ?? 'bottom';
  const align = placementAlignments.find((value) => value === controls?.align) ?? 'start';
  useEffect(() => {
    const frame = source.current?.ownerDocument.defaultView?.frameElement;
    if (!open || !frame) {
      return;
    }
    const host = frame.ownerDocument;
    // A cold hover leaves keyboard focus in the surrounding document.
    const dismiss = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape' ||
        event.isComposing ||
        event.defaultPrevented ||
        !frame.matches(':hover')
      ) {
        return;
      }
      const select = host.activeElement?.closest('select');
      if (select && (!CSS.supports('selector(:open)') || select.matches(':open'))) {
        return;
      }
      setOpen(false);
    };
    host.addEventListener('keydown', dismiss);
    return () => host.removeEventListener('keydown', dismiss);
  }, [open]);
  return (
    <HoverCard open={open} onOpenChange={setOpen}>
      <HoverCardTrigger asChild>
        <Link
          ref={source}
          {...ctx.subject}
          href="https://devguide.python.org/triage/triage-team/"
          target="_top"
        >
          Python triage team
        </Link>
      </HoverCardTrigger>
      <HoverCardContent {...ctx.subject} side={side} align={align}>
        <TeamPreview />
      </HoverCardContent>
    </HoverCard>
  );
}

export function HoverLiveExamples({ ctx }: PreviewProps) {
  return (
    <Frame
      ctx={ctx}
      title="Live team preview"
      height={560}
      position={String(ctx.story?.controls.position ?? 'center')}
    >
      <LiveTeamLink ctx={ctx} />
    </Frame>
  );
}
export function HoverIdentityExamples({ ctx }: PreviewProps) {
  return (
    <Frame ctx={ctx} title="Member and team hover cards" height={342}>
      <IdentityCard
        linkProps={{ target: '_top' }}
        subject={ctx.subject}
        identity={String(ctx.story?.controls.identity ?? 'member')}
      />
    </Frame>
  );
}
export function HoverEntityExamples({ ctx }: PreviewProps) {
  return (
    <Frame ctx={ctx} title="Entity hover cards" height={342}>
      <EntityCard
        linkProps={{ target: '_top' }}
        subject={ctx.subject}
        entity={String(ctx.story?.controls.entity ?? 'document')}
      />
    </Frame>
  );
}
export function HoverContextExamples({ ctx }: PreviewProps) {
  return (
    <Frame ctx={ctx} title="Hover card on an inline link" height={308}>
      <IdentityCard linkProps={{ target: '_top' }} subject={ctx.subject} inline />
    </Frame>
  );
}
