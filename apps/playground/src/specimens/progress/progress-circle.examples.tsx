import { Fragment } from 'react';
import type { ReactElement } from 'react';
import { Flex, Grid, ProgressCircle, Spinner, Stack, Text } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import './progress.examples.css';

const sizes = [
  { size: 's', label: 'S · 14px' },
  { size: 'm', label: 'M · 16px' },
  { size: 'l', label: 'L · 20px' },
  { size: 'inherit', label: 'Inherit · 1em' },
] as const;

export function ProgressCircleScale({ ctx }: PreviewProps): ReactElement {
  return (
    <Grid
      gap={12}
      style={{
        gridTemplateColumns: 'repeat(3, max-content)',
        justifyContent: 'start',
        alignItems: 'center',
        fontSize: 'var(--text-size-body-l)',
      }}
    >
      {sizes.map(({ size, label }) => (
        <Fragment key={size}>
          <Text as="span" size={size === 'inherit' ? 'body-l' : 'body-s'}>
            <bdi>{label}</bdi>
          </Text>
          <Spinner size={size} tone="accent" aria-label="Waiting for transfer" />
          <ProgressCircle
            {...ctx.subject}
            size={size}
            tone="accent"
            value={64}
            aria-label="Archive transfer"
          />
        </Fragment>
      ))}
    </Grid>
  );
}

export function ProgressCircleBoundaries({ ctx }: PreviewProps): ReactElement {
  return (
    <Flex align="center" wrap="wrap" gap={16}>
      {[0, 12.5, 37.5, 64, 100].map((value) => (
        <Stack key={value} align="center" gap={8}>
          <ProgressCircle
            {...ctx.subject}
            size="l"
            tone="accent"
            value={value}
            aria-label="Archive transfer"
          />
          <Text as="span" size="caption-l" tabularNums aria-hidden="true">
            <bdi dir="ltr">{value}%</bdi>
          </Text>
        </Stack>
      ))}
    </Flex>
  );
}

export function ProgressCircleHandoff({ ctx }: PreviewProps): ReactElement {
  const controls = ctx.story?.controls;
  const value =
    controls?.known === true && typeof controls.value === 'number' ? controls.value : null;
  const phase =
    value === null ? 'Preparing archive' : value === 100 ? 'Archive sent' : 'Sending archive';
  return (
    <Flex align="center" gap={8}>
      <ProgressCircle {...ctx.subject} size="m" tone="accent" value={value} aria-label={phase} />
      <Text as="span" size="body-s" dir="auto" aria-hidden="true">
        {phase}
        {value === null ? (
          '…'
        ) : (
          <>
            {' '}
            · <bdi dir="ltr">{value}%</bdi>
          </>
        )}
      </Text>
    </Flex>
  );
}

const firstLine = {
  marginBlockStart: 'calc((var(--text-size-body-s-lh) - var(--size-m-icon)) / 2)',
};

export function ProgressCircleOverlay({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={16} className="unica-overlay-surface activity-example-panel" data-surface="overlay">
      <Flex align="start" gap={8}>
        <ProgressCircle
          {...ctx.subject}
          size="m"
          style={firstLine}
          tone="accent"
          value={42}
          max={80}
          aria-label="Uploading archive"
          aria-valuetext="42 of 80 MB"
        />
        <Text as="span" size="body-s">
          <bdi dir="ltr">
            <span aria-hidden="true">Uploading archive · </span>
            <span style={{ display: 'inline-block' }}>42 of 80 MB</span>
          </bdi>
        </Text>
      </Flex>
      <Flex align="start" gap={8} style={{ color: 'var(--fg-muted)' }}>
        <ProgressCircle
          {...ctx.subject}
          size="m"
          style={firstLine}
          value={null}
          aria-label="Preparing documents"
        />
        <Text as="span" size="body-s" color="muted" dir="auto" aria-hidden="true">
          Preparing documents…
        </Text>
      </Flex>
    </Stack>
  );
}
