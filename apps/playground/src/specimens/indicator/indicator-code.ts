import type { CSSProperties } from 'react';
import { previewProps, previewText } from '../preview-code.js';
import type { IndicatorValues } from './indicator.spec.js';

const defaults = {
  width: 'auto',
  size: 'm',
  status: 'accent',
  withBorder: true,
  visible: true,
  position: 'top-end',
  overlap: 'rectangular',
  max: 99,
  showZero: false,
} as const;

export function indicatorPreview({
  children: host,
  dot,
  count,
  max,
  showZero,
  ...shared
}: IndicatorValues) {
  const hasCount = typeof count === 'number' && Number.isSafeInteger(count) && count >= 0;
  const hasCap = Number.isSafeInteger(max) && max > 0;
  const text = host === 'button' ? 'Notifications' : 'Sample collaborator';
  let activity = 'count unavailable';
  let detail = 'The unread total is unavailable.';
  if (dot) {
    activity = 'new activity';
    detail = 'There is new activity in your inbox.';
  } else if (hasCount) {
    activity = `${count} unread`;
    detail =
      count === 0
        ? 'Your inbox is up to date.'
        : `${count} unread ${count === 1 ? 'notification' : 'notifications'}.`;
  }
  const marker = dot
    ? { ...shared, dot: true as const }
    : hasCount && hasCap
      ? { ...shared, count, max, showZero }
      : shared;
  const layout: CSSProperties = shared.width === 'full' ? { inlineSize: '100%' } : {};
  if (host === 'button' && !dot && hasCount && hasCap) {
    const label = count > max ? `${max}+` : String(count);
    if (label.length > 1) {
      // Reserve the overhanging half of the counter at its logical corner.
      const side = shared.position.endsWith('start') ? 'paddingInlineStart' : 'paddingInlineEnd';
      layout.font = '600 var(--text-size-body-m) var(--font-family-base)';
      layout.fontVariantNumeric = 'tabular-nums';
      layout[side] = `calc(${label.length / 2}ch + var(--space-8))`;
    }
  }
  return { host, name: `${text}, ${activity}`, detail, marker, layout };
}

export function indicatorCode(values: IndicatorValues): string {
  const { host, name, detail, marker, layout } = indicatorPreview(values);
  const props = previewProps(marker, defaults);
  const style = Object.keys(layout).length ? ` style={${JSON.stringify(layout)}}` : '';
  if (host === 'avatar') {
    return `import { Avatar, Indicator, Stack } from '@docouno/unica';

<Stack align="center">
  <Indicator${props}>
    <Avatar size="l" src="/assets/avatar-portrait-wide.png" name="Account lead" alt=${previewText(name)} />
  </Indicator>
</Stack>`;
  }
  return `import { useId, useState } from 'react';
import { Button, Indicator, Stack, Text } from '@docouno/unica';

export function Notifications() {
  const detailId = useId();
  const [expanded, setExpanded] = useState(false);
  return (
    <Stack align="start" gap={16}${style}>
      <Indicator${props}>
        <Button
          type="button"
          variant="secondary"
          tone="neutral"
          aria-label=${previewText(name)}
          aria-expanded={expanded}
          aria-controls={detailId}
          onClick={() => setExpanded((open) => !open)}
        >
          Notifications
        </Button>
      </Indicator>
      <Text id={detailId} size="body-s" style={{ visibility: expanded ? 'visible' : 'hidden' }}>
        <bdi>${detail}</bdi>
      </Text>
    </Stack>
  );
}`;
}
