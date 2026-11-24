import { Spinner, Stack, Text } from '@docouno/unica';
import type { ReactElement } from 'react';
import type { PreviewProps } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';
import './progress.examples.css';

export function SpinnerTextScale({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={12} className="activity-static">
      <Text size="body-s">
        <Spinner {...ctx.subject} /> <bdi>Loading preview…</bdi>
      </Text>
      <Text size="body-l">
        <Spinner {...ctx.subject} /> <bdi>Preparing workspace…</bdi>
      </Text>
    </Stack>
  );
}

export function SpinnerForeground({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={12} className="activity-static">
      <Text size="body-s" color="accent">
        <Spinner {...ctx.subject} size="m" /> <bdi>Opening workspace…</bdi>
      </Text>
      <Text size="body-s" color="accent">
        <Spinner {...ctx.subject} size="m" tone="muted" /> <bdi>Refreshing suggestions…</bdi>
      </Text>
    </Stack>
  );
}

export function SpinnerMotion({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={12}>
      <Text size="body-s">
        <Spinner {...ctx.subject} size="m" tone="muted" /> <bdi>Loading preview…</bdi>
      </Text>
      <Text size="body-s">
        <Spinner {...ctx.subject} size="m" tone="muted" className="activity-static" />{' '}
        <bdi>Loading preview… (still frame)</bdi>
      </Text>
    </Stack>
  );
}

export function SpinnerOverlay({ ctx }: PreviewProps): ReactElement {
  return (
    <ExampleSurface surface={ctx.surface} sizing="border-box">
      <Text size="body-s">
        <Spinner {...ctx.subject} size="m" tone="muted" />{' '}
        <bdi>Looking for matching documents…</bdi>
      </Text>
    </ExampleSurface>
  );
}
