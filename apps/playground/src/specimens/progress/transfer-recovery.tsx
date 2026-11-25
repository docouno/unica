import { useState } from 'react';
import { WarningCircleIcon } from '@phosphor-icons/react';
import { Button, Flex, Icon, Progress, Stack, Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

const dismissedNotice = (
  <Text size="body-s" role="status" tabIndex={-1} ref={(node) => node?.focus()}>
    <bdi>Transfer status dismissed.</bdi>
  </Text>
);

export function TransferRecovery({ progressProps = {} } = {}) {
  const [phase, setPhase] = useState('interrupted');
  const reconnecting = phase === 'reconnecting';

  if (phase === 'dismissed') {
    return dismissedNotice;
  }

  return (
    <Stack gap={12} style={{ inlineSize: '100%', maxInlineSize: 600 }}>
      <Progress
        {...progressProps}
        label={reconnecting ? 'Reconnecting transfer' : 'Archive transfer'}
        value={reconnecting ? null : 64}
        status={reconnecting ? 'accent' : 'danger'}
      />
      <Flex align="start" gap={8}>
        {!reconnecting && <Icon usage="slot" icon={WarningCircleIcon} size="s" color="danger" />}
        <Text size="caption-l" color="muted" role="status">
          <bdi>
            {reconnecting
              ? 'Reconnecting. The last confirmed upload was 64%.'
              : 'Connection interrupted at 64%. Retry resumes from the last confirmed chunk.'}
          </bdi>
        </Text>
      </Flex>
      <Flex align="center" wrap="wrap" gap={12}>
        <Button
          variant="secondary"
          size="s"
          loading={reconnecting}
          onClick={() => setPhase('reconnecting')}
        >
          Retry transfer
        </Button>
        <Button variant="ghost" size="s" onClick={() => setPhase('dismissed')}>
          Dismiss
        </Button>
      </Flex>
    </Stack>
  );
}
