import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { Badge, Button, Divider, Flex, Stack, Text } from '@docouno/unica';
import type { BadgeStatus, GlyphSource } from '@docouno/unica';
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
import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { PreviewProps } from '../../workbench/types.js';
import './badge.examples.css';

const palette = [
  { status: 'neutral', label: 'Draft', icon: FileTextIcon },
  { status: 'accent', label: 'Beta', icon: SparkleIcon },
  { status: 'info', label: 'In review', icon: InfoIcon },
  { status: 'success', label: 'Verified', icon: CheckCircleIcon },
  { status: 'warning', label: 'Needs review', icon: WarningIcon },
  { status: 'danger', label: 'Blocked', icon: WarningCircleIcon },
] satisfies readonly { status: BadgeStatus; label: string; icon: GlyphSource }[];

export function PaletteExample({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={16}>
      {palette.map(({ status, label, icon }) => (
        <Stack gap={4} key={status}>
          <Text size="caption-l" color="muted">
            {status}
          </Text>
          <Flex align="baseline" wrap="wrap" gap={8}>
            <Badge {...ctx.subject} status={status}>
              {label}
            </Badge>
            <Badge {...ctx.subject} status={status} dot>
              {label}
            </Badge>
            <Badge {...ctx.subject} status={status} iconLeft={icon}>
              {label}
            </Badge>
          </Flex>
        </Stack>
      ))}
    </Stack>
  );
}

export function CountsExample({ ctx }: PreviewProps): ReactElement {
  const id = useId();
  return (
    <Stack gap={16}>
      {(['s', 'm', 'l'] as const).map((size) => (
        <Stack gap={4} key={size}>
          <Text size="caption-l" color="muted">
            {size.toUpperCase()}
          </Text>
          <Flex align="baseline" wrap="wrap" gap={8}>
            <Badge {...ctx.subject} size={size}>
              Private
            </Badge>
            <Badge {...ctx.subject} size={size} status="success" dot>
              Verified
            </Badge>
            <Badge {...ctx.subject} size={size} iconLeft={LockSimpleIcon}>
              Private
            </Badge>
            <Text size="body-s">
              <bdi>
                <Badge {...ctx.subject} size={size}>
                  4
                </Badge>{' '}
                comments
              </bdi>
            </Text>
          </Flex>
        </Stack>
      ))}
      <Divider />
      <Stack role="group" aria-labelledby={id} gap={8}>
        <Text id={id} size="body-s" weight="medium">
          Comment counts
        </Text>
        <Flex align="baseline" wrap="wrap" gap={8}>
          {[0, 4, 11, 99, '99+', 1204].map((count) => (
            <Badge {...ctx.subject} key={count}>
              {count}
            </Badge>
          ))}
        </Flex>
      </Stack>
    </Stack>
  );
}

const boundedLabels = [
  { label: 'Infrastructure and reliability engineering', width: 180, status: 'neutral' },
  { label: 'Review required before release', width: 148, status: 'warning', dot: true },
  {
    label: 'Restricted to workspace members',
    width: 148,
    status: 'neutral',
    iconLeft: LockSimpleIcon,
  },
  { label: 'Needs review', width: 72, status: 'warning', dot: true },
  { label: 'Restricted', width: 72, status: 'neutral', iconLeft: LockSimpleIcon },
] as const;

export function OverflowExample({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={16}>
      {boundedLabels.map(({ label, width, ...props }) => (
        <Stack align="start" key={label} gap={4}>
          <Badge {...ctx.subject} {...props} style={{ '--badge-max-width': width + 'px' }}>
            {label}
          </Badge>
          <Text size="body-s" color="secondary" aria-hidden="true">
            <bdi>{label}</bdi>
          </Text>
        </Stack>
      ))}
      <Divider />
      <Flex gap={8} align="baseline" wrap="wrap" style={{ maxInlineSize: '17.5rem' }}>
        <Badge {...ctx.subject} size="s">
          Documentation
        </Badge>
        <Badge {...ctx.subject} size="s">
          Infrastructure
        </Badge>
        <Badge {...ctx.subject} size="s" status="accent">
          v2.8.0-rc.1
        </Badge>
        <Badge {...ctx.subject} size="s" status="info">
          Awaiting approval
        </Badge>
      </Flex>
    </Stack>
  );
}

export function PinnedInteractionExample({ ctx }: PreviewProps): ReactElement {
  return (
    <Flex wrap="wrap" gap={16}>
      {(['Rest', 'Hover', 'Active', 'Focus', 'Disabled'] as const).map((state) => (
        <Stack align="start" gap={8} key={state}>
          <Text size="caption-l" color="muted">
            {state}
          </Text>
          <Badge
            {...ctx.subject}
            asChild
            status="info"
            data-badge-example-state={state.toLowerCase()}
          >
            <button type="button" inert disabled={state === 'Disabled'}>
              In review
            </button>
          </Badge>
        </Stack>
      ))}
    </Flex>
  );
}

export function InteractionExample({ ctx }: PreviewProps): ReactElement {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <Stack gap={12} data-example-disclosure="">
      <Flex align="baseline" wrap="wrap" gap={8}>
        <Badge {...ctx.subject} status="success" dot>
          Verified
        </Badge>
        <Badge {...ctx.subject} asChild>
          <a>No destination</a>
        </Badge>
        <Badge {...ctx.subject} asChild>
          <a href={'#' + id}>v2.8</a>
        </Badge>
        <Badge {...ctx.subject} asChild status="info" iconLeft={InfoIcon}>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={id + '-details'}
            onClick={() => setOpen((current) => !current)}
          >
            In review
          </button>
        </Badge>
      </Flex>
      <Text id={id + '-details'} hidden={!open} size="body-s">
        <bdi>Two reviewers are checking the latest changes.</bdi>
      </Text>
      <Text id={id} tabIndex={-1} size="body-s" className="badge-example-destination">
        <bdi>Version 2.8 adds workspace sharing and improves search.</bdi>
      </Text>
    </Stack>
  );
}

const phases = {
  unchecked: { label: 'Not checked', status: 'neutral', icon: FileTextIcon },
  checking: { label: 'Checking', status: 'info', icon: ClockIcon },
  verified: { label: 'Verified', status: 'success', icon: SealCheckIcon },
  review: { label: 'Needs review', status: 'warning', icon: WarningIcon },
  blocked: { label: 'Blocked', status: 'danger', icon: WarningCircleIcon },
} satisfies Record<string, { label: string; status: BadgeStatus; icon: GlyphSource }>;

export function ChangesExample({ ctx }: PreviewProps): ReactElement {
  const [phase, setPhase] = useState<keyof typeof phases>('unchecked');
  const outcome = ctx.story?.controls.outcome;
  useStoryAction(ctx, (action) => {
    if (
      action === 'complete' &&
      (outcome === 'verified' || outcome === 'review' || outcome === 'blocked')
    ) {
      setPhase((current) => (current === 'checking' ? outcome : current));
    }
  });
  const current = phases[phase];
  return (
    <Stack align="start" gap={12}>
      <Text size="body-s" weight="medium">
        Document check
      </Text>
      <div role="status" aria-atomic="true">
        <Badge {...ctx.subject} status={current.status} iconLeft={current.icon}>
          {current.label}
        </Badge>
      </div>
      <Button
        type="button"
        size="s"
        variant="secondary"
        tone="neutral"
        loading={phase === 'checking'}
        onClick={() => setPhase('checking')}
      >
        Check document
      </Button>
    </Stack>
  );
}
