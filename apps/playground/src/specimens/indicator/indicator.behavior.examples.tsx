import { useId, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { BellIcon, BellSlashIcon, ChatCircleIcon, TrayIcon } from '@phosphor-icons/react';
import {
  Button,
  Divider,
  Flex,
  Grid,
  Icon,
  IconButton,
  Indicator,
  Stack,
  Text,
  VisuallyHidden,
} from '@docouno/unica';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { PreviewProps } from '../../workbench/types.js';

const samples = [
  { label: 'No data', count: null },
  { label: 'Invalid (−1)', count: -1 },
  { label: 'Zero hidden', count: 0 },
  { label: 'Zero shown', count: 0, showZero: true },
  { label: 'One digit', count: 9 },
  { label: 'Two digits', count: 10 },
  { label: 'At limit (99)', count: 99 },
  { label: 'Over limit (105)', count: 105 },
  { label: '12 with max 9', count: 12, max: 9 },
];

function Sample({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <Stack
      align="center"
      gap={8}
      style={{ paddingBlockStart: 'var(--space-16)', textAlign: 'center' }}
    >
      {children}
      <Text size="caption-l" color="secondary">
        <bdi>{label}</bdi>
      </Text>
    </Stack>
  );
}

const grid = { gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 6.5rem), 1fr))' };

function MuteNotifications(): ReactElement {
  return (
    <IconButton
      type="button"
      variant="ghost"
      tone="neutral"
      icon={BellSlashIcon}
      aria-label="Mute notifications"
      defaultPressed={false}
    />
  );
}

export function IndicatorData({ ctx }: PreviewProps): ReactElement {
  const [count, setCount] = useState<number | null>(3);
  const [markedRead, setMarkedRead] = useState(false);
  const controls = ctx.story?.controls;
  useStoryAction(ctx, (action) => {
    switch (action) {
      case 'increment':
        setCount((current) => (current ?? 0) + 1);
        break;
      case 'limit':
        setCount(99);
        break;
      case 'capped':
        setCount(105);
        break;
      case 'unavailable':
        setCount(null);
        break;
      default:
        return;
    }
    setMarkedRead(false);
  });
  const quantity = count === null ? 'Count unavailable' : `${count} unread`;
  return (
    <Stack gap={16}>
      <Stack align="start" gap={8}>
        <Grid
          gap={24}
          style={{
            gridTemplateColumns: 'repeat(2, max(44px, 3rem))',
            justifyItems: 'center',
            alignItems: 'center',
            minBlockSize: 'max(44px, 3rem)',
            marginBlockStart: 'var(--space-16)',
          }}
        >
          <Indicator
            {...ctx.subject}
            count={count}
            visible={controls?.visible !== false}
            showZero={controls?.showZero === true}
          >
            <IconButton
              type="button"
              icon={BellIcon}
              aria-label={`Mark notifications as read, ${quantity.toLowerCase()}`}
              hidden={controls?.hostVisible === false}
              onClick={() => {
                if (count !== 0) {
                  setCount(0);
                  setMarkedRead(true);
                }
              }}
            />
          </Indicator>
          <MuteNotifications />
        </Grid>
        <Text size="body-s">
          <bdi>{quantity}</bdi>
        </Text>
        <VisuallyHidden role="status">
          {markedRead ? 'All notifications marked as read.' : ''}
        </VisuallyHidden>
      </Stack>
      <Divider />
      <Grid gap={16} style={grid}>
        {samples.map((sample) => {
          const value = sample.count !== null && sample.count >= 0 ? sample.count : null;
          return (
            <Sample key={sample.label} label={sample.label}>
              <Indicator
                {...ctx.subject}
                count={value}
                showZero={sample.showZero}
                max={sample.max}
                size="s"
              >
                <span style={{ display: 'inline-flex', padding: 'var(--space-8)' }}>
                  <Icon
                    icon={BellIcon}
                    size="l"
                    aria-label={
                      value === null
                        ? 'Notifications, count unavailable'
                        : `Notifications, ${value} unread`
                    }
                  />
                </span>
              </Indicator>
            </Sample>
          );
        })}
      </Grid>
    </Stack>
  );
}

const details = {
  notifications: '12 notifications are waiting for review.',
  messages: 'A teammate sent a new message.',
  requests: '105 requests are waiting for review.',
  inbox: '3 unread messages are in your inbox.',
};

export function IndicatorHostStates({ ctx }: PreviewProps): ReactElement {
  const detailId = useId();
  const [open, setOpen] = useState<keyof typeof details | null>(null);
  function disclosure(key: keyof typeof details) {
    return {
      'aria-controls': detailId,
      'aria-expanded': open === key,
      onClick: () => setOpen((current) => (current === key ? null : key)),
    };
  }
  return (
    <Stack gap={16}>
      <Grid gap={16} style={grid}>
        <Sample label="Enabled">
          <Indicator {...ctx.subject} count={12} size="s">
            <IconButton
              type="button"
              icon={BellIcon}
              aria-label="Notifications, 12 unread"
              {...disclosure('notifications')}
            />
          </Indicator>
        </Sample>
        <Sample label="Disabled">
          <Indicator {...ctx.subject} count={12} size="s" status="neutral">
            <IconButton
              type="button"
              icon={BellIcon}
              aria-label="Notifications unavailable, 12 unread"
              disabled
            />
          </Indicator>
        </Sample>
        <Sample label="Refreshing">
          <Indicator {...ctx.subject} count={12} size="s">
            <IconButton
              type="button"
              icon={BellIcon}
              aria-label="Refreshing notifications, 12 unread"
              loading
            />
          </Indicator>
        </Sample>
        <Sample label="New message">
          <Indicator {...ctx.subject} dot>
            <IconButton
              type="button"
              icon={ChatCircleIcon}
              aria-label="Messages, new activity"
              {...disclosure('messages')}
            />
          </Indicator>
        </Sample>
        <Sample label="105 requests">
          <Indicator {...ctx.subject} count={105} status="neutral">
            <IconButton
              type="button"
              icon={TrayIcon}
              aria-label="Requests, 105 waiting"
              {...disclosure('requests')}
            />
          </Indicator>
        </Sample>
      </Grid>
      <Divider />
      <Flex align="center" wrap="wrap" gap={32} style={{ paddingBlockStart: 'var(--space-12)' }}>
        <Indicator {...ctx.subject} count={3} size="s">
          <Button
            type="button"
            variant="secondary"
            tone="neutral"
            size="s"
            aria-label="Inbox, 3 unread"
            {...disclosure('inbox')}
          >
            Inbox
          </Button>
        </Indicator>
        <MuteNotifications />
      </Flex>
      <Text id={detailId} hidden={open === null} size="body-s">
        {open === null ? null : details[open]}
      </Text>
    </Stack>
  );
}
