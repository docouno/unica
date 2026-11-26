import type { ReactElement, ReactNode } from 'react';
import { BellIcon, EnvelopeSimpleIcon, GearIcon, TrayIcon } from '@phosphor-icons/react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Indicator,
  Stack,
  Text,
} from '@docouno/unica';
import type { IndicatorProps } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import './indicator.examples.css';

// A pinned control keeps its normal shape. Expose the meaning of the whole sample as one image.
function PinnedIndicator({
  label,
  ...props
}: IndicatorProps & { readonly label: string }): ReactElement {
  return <Indicator {...props} role="img" aria-label={label} />;
}

function Sample({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <Stack align="center" gap={12}>
      {children}
      <Text size="caption-l" align="center">
        {label}
      </Text>
    </Stack>
  );
}

export function IndicatorOverview({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={24} align="start" className="indicator-example-clearance">
      <Flex align="center" wrap="wrap" gap={24}>
        <PinnedIndicator {...ctx.subject} label="Notifications, 3 unread" count={3} size="s">
          <IconButton inert icon={BellIcon} aria-label="Notifications" />
        </PinnedIndicator>
        <span role="img" aria-label="Settings">
          <IconButton inert icon={GearIcon} variant="ghost" aria-label="Settings" />
        </span>
      </Flex>
      <Flex align="center" wrap="wrap" gap={12}>
        <Indicator {...ctx.subject} dot status="success" overlap="circular" position="bottom-end">
          <Avatar src="/assets/avatar-portrait-wide.png" alt="Collaborator" />
        </Indicator>
        <Text size="body-s">Available</Text>
      </Flex>
      <PinnedIndicator
        {...ctx.subject}
        label="Inbox, 12 unread"
        count={12}
        status="neutral"
        size="s"
      >
        <Button inert variant="secondary" tone="neutral" size="s">
          Inbox
        </Button>
      </PinnedIndicator>
    </Stack>
  );
}

export function IndicatorScale({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={24}>
      {(['s', 'm', 'l'] as const).map((size) => (
        <Stack key={size} gap={12}>
          <Text size="body-s" weight="medium">
            {size.toUpperCase()}
          </Text>
          <div className="indicator-example-samples indicator-example-scale">
            <Sample label="One digit">
              <PinnedIndicator
                {...ctx.subject}
                label="4 unread notifications"
                count={4}
                size={size}
              >
                <IconButton inert icon={BellIcon} size={size} aria-label="Notifications" />
              </PinnedIndicator>
            </Sample>
            <Sample label="Capped">
              <PinnedIndicator {...ctx.subject} label="Inbox, 105 unread" count={105} size={size}>
                <IconButton inert icon={TrayIcon} size={size} aria-label="Inbox" />
              </PinnedIndicator>
            </Sample>
            <Sample label="Available">
              <Indicator
                {...ctx.subject}
                dot
                size={size}
                status="success"
                overlap="circular"
                position="bottom-end"
              >
                <Avatar size={size} fallback="AL" alt="Collaborator AL" />
              </Indicator>
            </Sample>
          </div>
        </Stack>
      ))}
    </Stack>
  );
}

export function IndicatorCorners({ ctx }: PreviewProps): ReactElement {
  const dot = ctx.story?.controls.dot === true;
  const signal = dot ? { dot: true as const } : { count: 3 };
  return (
    <Stack gap={24}>
      {(['rectangular', 'circular'] as const).map((overlap) => (
        <Stack key={overlap} gap={12}>
          <Text size="body-s" weight="medium">
            {overlap === 'circular' ? 'Avatar contour' : 'Control corners'}
          </Text>
          <div className="indicator-example-samples">
            {(['top-start', 'top-end', 'bottom-start', 'bottom-end'] as const).map((position) => (
              <Sample key={position} label={position}>
                {overlap === 'circular' ? (
                  <Indicator
                    {...ctx.subject}
                    {...signal}
                    size="s"
                    overlap={overlap}
                    position={position}
                  >
                    <Avatar
                      size="l"
                      fallback="AL"
                      alt={dot ? 'Collaborator AL, new activity' : 'Collaborator AL, 3 updates'}
                    />
                  </Indicator>
                ) : (
                  <PinnedIndicator
                    {...ctx.subject}
                    {...signal}
                    size="s"
                    position={position}
                    label={dot ? 'Notifications, new activity' : 'Notifications, 3 unread'}
                  >
                    <IconButton inert icon={BellIcon} aria-label="Notifications" />
                  </PinnedIndicator>
                )}
              </Sample>
            ))}
          </div>
        </Stack>
      ))}
    </Stack>
  );
}

function SurfaceSignals({
  ctx,
  withBorder = true,
  showPresence = true,
}: PreviewProps & {
  readonly withBorder?: boolean;
  readonly showPresence?: boolean;
}): ReactElement {
  return (
    <Flex align="center" wrap="wrap" gap={24} className="indicator-example-clearance">
      <PinnedIndicator
        {...ctx.subject}
        label="Notifications, 12 unread"
        count={12}
        size="s"
        withBorder={withBorder}
      >
        <IconButton inert icon={BellIcon} aria-label="Notifications" />
      </PinnedIndicator>
      {showPresence && (
        <Flex align="center" gap={12}>
          <Indicator
            {...ctx.subject}
            dot
            status="success"
            overlap="circular"
            position="bottom-end"
            withBorder={withBorder}
          >
            <Avatar src="/assets/avatar-portrait-wide.png" alt="Collaborator" />
          </Indicator>
          <Text size="caption-l">Available</Text>
        </Flex>
      )}
      <PinnedIndicator
        {...ctx.subject}
        label="Inbox, 3 unread"
        count={3}
        size="s"
        withBorder={withBorder}
      >
        <Button inert size="s">
          Inbox
        </Button>
      </PinnedIndicator>
    </Flex>
  );
}

export function IndicatorSurfaces({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={16}>
      {(['shell', 'canvas', 'surface'] as const).map((ground) => (
        <Stack key={ground} gap={16} className="indicator-example-ground" data-ground={ground}>
          <Text size="body-s" weight="medium">
            {ground}
          </Text>
          {[true, false].map((withBorder) => (
            <Stack key={String(withBorder)} gap={4}>
              <Text size="caption-l">{withBorder ? 'With separator' : 'Without separator'}</Text>
              <SurfaceSignals ctx={ctx} withBorder={withBorder} />
            </Stack>
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

export function IndicatorOverlay({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack
      gap={16}
      data-surface="overlay"
      className="unica-overlay-surface indicator-example-overlay"
    >
      <Text size="body-s" weight="medium">
        Activity &amp; availability
      </Text>
      <SurfaceSignals ctx={ctx} showPresence={false} />
      {(
        [
          {
            label: 'Available',
            status: 'success',
            src: '/assets/avatar-portrait-tall.png',
            alt: 'Collaborator',
          },
          { label: 'Away', status: 'warning', fallback: 'AL', alt: 'Collaborator AL' },
          { label: 'Offline', status: 'neutral', fallback: 'RK', alt: 'Collaborator RK' },
        ] as const
      ).map(({ label, status, ...avatar }) => (
        <Flex key={label} align="center" gap={16}>
          <Indicator
            {...ctx.subject}
            dot
            status={status}
            visible={label !== 'Offline'}
            overlap="circular"
            position="bottom-end"
          >
            <Avatar {...avatar} />
          </Indicator>
          <Text size="body-s">{label}</Text>
        </Flex>
      ))}
    </Stack>
  );
}

export function IndicatorBoundaries({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={24}>
      <Box paddingBlock={12} paddingInline={24}>
        <PinnedIndicator
          {...ctx.subject}
          label="Review all incoming collaboration requests, 105 unread"
          count={105}
          size="s"
          width="full"
        >
          <Button inert variant="secondary" tone="neutral">
            Review all incoming collaboration requests
          </Button>
        </PinnedIndicator>
      </Box>
      <Flex className="indicator-example-contained" align="center" justify="space-between" gap={12}>
        <Text size="body-s">Incoming requests</Text>
        <Badge size="s">
          <bdi dir="ltr">99+</bdi>
        </Badge>
      </Flex>
      <Box padding={8}>
        <Indicator {...ctx.subject} dot size="s" withBorder={false}>
          <Icon icon={EnvelopeSimpleIcon} size="l" aria-label="Unread message" />
        </Indicator>
      </Box>
      <Flex justify="space-around" wrap="wrap" gap={24} className="indicator-example-clearance">
        {(['ltr', 'rtl'] as const).map((direction) => (
          <div key={direction} dir={direction}>
            <Sample label={direction.toUpperCase()}>
              <PinnedIndicator
                {...ctx.subject}
                label="Notifications, 105 unread"
                count={105}
                size="s"
              >
                <IconButton inert icon={BellIcon} aria-label="Notifications" />
              </PinnedIndicator>
            </Sample>
          </div>
        ))}
      </Flex>
    </Stack>
  );
}
