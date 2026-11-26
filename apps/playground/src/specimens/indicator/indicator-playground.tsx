import { Avatar, Button, Indicator, Stack, Text } from '@docouno/unica';
import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import type { PreviewProps } from '../../workbench/types.js';
import { indicatorPreview } from './indicator-code.js';
import type { IndicatorValues } from './indicator.spec.js';

interface PlaygroundProps extends PreviewProps {
  readonly values: IndicatorValues;
}

export function IndicatorPlayground({ ctx, values }: PlaygroundProps): ReactElement {
  const detailId = useId();
  const [expanded, setExpanded] = useState(false);
  const { host, name, detail, marker, layout } = indicatorPreview(values);
  return (
    <Stack
      align={host === 'avatar' ? 'center' : 'start'}
      gap={16}
      style={layout}
      data-indicator-preview=""
    >
      <Indicator {...ctx.subject} {...marker}>
        {host === 'avatar' ? (
          <Avatar size="l" src="/assets/avatar-portrait-wide.png" name="Account lead" alt={name} />
        ) : (
          <Button
            type="button"
            variant="secondary"
            tone="neutral"
            aria-label={name}
            aria-expanded={expanded}
            aria-controls={detailId}
            onClick={() => setExpanded((open) => !open)}
          >
            Notifications
          </Button>
        )}
      </Indicator>
      {host === 'button' && (
        <Text id={detailId} size="body-s" style={{ visibility: expanded ? 'visible' : 'hidden' }}>
          <bdi>{detail}</bdi>
        </Text>
      )}
    </Stack>
  );
}
