import { CalendarBlankIcon, LockSimpleIcon, UsersIcon } from '@phosphor-icons/react';
import { Button, Stack, Text, Title } from '@docouno/unica';
import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { TagGroup } from '../../prototypes/tag/tag.proto.js';
import type { TagGroupItem, TagSize } from '../../prototypes/tag/tag.proto.js';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { PreviewProps } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';

const labels: readonly TagGroupItem[] = [
  { id: 'design', label: 'Design systems', removeLabel: 'Remove Design systems' },
  { id: 'api', label: 'API', removeLabel: 'Remove API' },
  { id: 'web', label: 'Web platform', removeLabel: 'Remove Web platform' },
  { id: 'a11y', label: 'Accessibility', removeLabel: 'Remove Accessibility' },
  { id: 'docs', label: 'Documentation', removeLabel: 'Remove Documentation' },
  { id: 'security', label: 'Security', removeLabel: 'Remove Security' },
];
const mixedLabels = labels.map((item) =>
  item.id === 'web' ? { ...item, disabled: true, iconLeft: LockSimpleIcon } : item,
);

function Collection({
  ctx,
  size,
  locked = false,
}: PreviewProps & {
  readonly size: TagSize;
  readonly locked?: boolean;
}): ReactElement {
  const [items, setItems] = useState(locked ? labels : mixedLabels);
  const name = locked ? 'Locked labels' : `${size.toUpperCase()} labels`;
  return (
    <Stack gap={8}>
      <Text size="caption-l" color="secondary">
        <bdi>{locked ? 'Removal locked' : `${size.toUpperCase()} · ${items.length} labels`}</bdi>
      </Text>
      <TagGroup
        {...ctx.subject}
        label={name}
        items={items}
        size={size}
        disabled={locked}
        maxVisible={3}
        defaultExpanded={!locked && size === 'l'}
        onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))}
      />
      {locked && (
        <Text size="body-s" color="secondary">
          <bdi>These labels are required by the workspace.</bdi>
        </Text>
      )}
    </Stack>
  );
}

export function Groups({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={24}>
      {(['s', 'm', 'l'] as const).map((size) => (
        <Collection key={size} ctx={ctx} size={size} />
      ))}
    </Stack>
  );
}

export function Locked({ ctx }: PreviewProps): ReactElement {
  return <Collection ctx={ctx} size="m" locked />;
}

const appliedLabels: readonly TagGroupItem[] = [
  {
    id: 'date',
    label: 'This month',
    removeLabel: 'Remove This month',
    iconLeft: CalendarBlankIcon,
  },
  { id: 'team', label: 'Platform team', removeLabel: 'Remove Platform team', iconLeft: UsersIcon },
  { id: 'review', label: 'Needs review', removeLabel: 'Remove Needs review' },
];
interface AppliedLabels {
  readonly items: readonly TagGroupItem[];
  readonly pending?: TagGroupItem;
  readonly rejection?: string;
  readonly removed?: string;
}

function removeLabel(items: readonly TagGroupItem[], removed: TagGroupItem): AppliedLabels {
  return { items: items.filter((item) => item.id !== removed.id), removed: removed.label };
}

export function RemovalFlow({ ctx }: PreviewProps): ReactElement {
  const [state, setState] = useState<AppliedLabels>({ items: appliedLabels });
  const group = useRef<HTMLDivElement>(null);
  const reapply = useRef<HTMLButtonElement>(null);
  const focusFirst = useRef(false);
  const deferred = ctx.story?.controls.deferred === true;

  useStoryAction(ctx, (action) => {
    if (action !== 'confirm' && action !== 'reject') {
      return;
    }
    setState((current) => {
      if (!current.pending) {
        return current;
      }
      return action === 'confirm'
        ? removeLabel(current.items, current.pending)
        : { items: current.items, rejection: current.pending.label };
    });
  });

  useLayoutEffect(() => {
    if (focusFirst.current) {
      focusFirst.current = false;
      if (document.activeElement === document.body || document.activeElement === reapply.current) {
        group.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
      }
    }
  }, [state.items]);

  return (
    <Stack gap={12}>
      <Text size="body-s" weight="medium">
        Applied labels
      </Text>
      <TagGroup
        {...ctx.subject}
        ref={group}
        label="Applied labels"
        items={
          state.pending
            ? state.items.map((item) => ({
                ...item,
                pending: item.id === state.pending?.id,
                disabled: item.id !== state.pending?.id,
              }))
            : state.items
        }
        emptyMessage="No labels applied"
        emptyFocusRef={reapply}
        onRemove={(id) =>
          setState((current) => {
            const item = current.items.find((entry) => entry.id === id);
            if (!item || current.pending) {
              return current;
            }
            return deferred
              ? { items: current.items, pending: item }
              : removeLabel(current.items, item);
          })
        }
      />
      <Text size="body-s" color="secondary" role="status">
        <bdi>
          {state.pending && `Waiting to remove ${state.pending.label}…`}
          {state.rejection && `Could not remove ${state.rejection}. Try again.`}
          {state.removed && <span aria-hidden="true">{state.removed} removed.</span>}
        </bdi>
      </Text>
      <Button
        ref={reapply}
        hidden={state.items.length !== 0}
        type="button"
        size="s"
        variant="secondary"
        tone="neutral"
        style={{ alignSelf: 'start' }}
        onKeyDown={(event) => {
          if (event.repeat && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
          }
        }}
        onClick={(event) => {
          focusFirst.current = event.currentTarget.matches(':focus');
          setState({ items: appliedLabels });
        }}
      >
        Reapply labels
      </Button>
    </Stack>
  );
}

const assignedGroups: readonly TagGroupItem[] = [
  { id: 'editor', label: 'Editors', removeLabel: 'Remove Editors', iconLeft: UsersIcon },
  { id: 'guest', label: 'External guests', removeLabel: 'Remove External guests', status: 'info' },
  {
    id: 'policy',
    label: 'Workspace policy',
    removeLabel: 'Remove Workspace policy',
    iconLeft: LockSimpleIcon,
    disabled: true,
  },
];

export function OverlayLabels({ ctx }: PreviewProps): ReactElement {
  const [items, setItems] = useState(assignedGroups);
  return (
    <div style={{ inlineSize: 'min(100%, 32rem)' }}>
      <ExampleSurface surface={ctx.surface} sizing="border-box" gap={12}>
        <Title as="h2" size="heading-s">
          Assigned groups
        </Title>
        <TagGroup
          {...ctx.subject}
          items={items}
          label="Assigned groups"
          onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))}
        />
        <Text size="body-s" color="secondary">
          <bdi>Workspace policy is required for all members.</bdi>
        </Text>
      </ExampleSurface>
    </div>
  );
}
