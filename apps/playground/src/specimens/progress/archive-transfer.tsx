import { useState } from 'react';
import { Button, Flex, Progress, Stack, Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

const canceledNotice = (
  <Text size="body-s" role="status" tabIndex={-1} ref={(node) => node?.focus()}>
    <bdi>Upload canceled at 42 of 80 MB.</bdi>
  </Text>
);

export function ArchiveTransfer({ progressProps = {} } = {}) {
  const [phase, setPhase] = useState('uploading');
  const paused = phase === 'paused';

  if (phase === 'canceled') {
    return canceledNotice;
  }

  return (
    <Stack gap={12} style={{ inlineSize: '100%', maxInlineSize: 600 }}>
      <Progress
        {...progressProps}
        label={paused ? 'Upload paused' : 'Uploading archive'}
        value={42}
        max={80}
        valueLabel="42 of 80 MB"
        active={!paused}
        paused={paused}
        status={paused ? 'neutral' : 'accent'}
      />
      <Flex align="center" wrap="wrap" gap={12}>
        <Button
          variant="secondary"
          size="s"
          onClick={() => setPhase(paused ? 'uploading' : 'paused')}
        >
          {paused ? 'Resume' : 'Pause'}
        </Button>
        <Button variant="ghost" size="s" onClick={() => setPhase('canceled')}>
          Cancel
        </Button>
      </Flex>
    </Stack>
  );
}
