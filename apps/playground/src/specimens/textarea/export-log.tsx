import { useId } from 'react';
import { InfoIcon } from '@phosphor-icons/react';
import { Flex, Icon, Stack, Text, Textarea } from '@docouno/unica';
import '@docouno/unica/styles.css';

const log =
  '09:41:02  Export completed with all source links preserved and every attachment checked successfully.\n09:41:03  Archive checksum verified.\n09:41:04  Ready for download.';

export function ExportLog({ fieldProps = {} } = {}) {
  const id = useId();
  return (
    <Stack gap={8} style={{ inlineSize: 'min(100%, 36rem)' }}>
      <Text as="label" size="body-s" weight="medium" htmlFor={id}>
        Preserved log lines
      </Text>
      <Textarea
        {...fieldProps}
        id={id}
        wrap="off"
        dir="ltr"
        rows={3}
        status="info"
        defaultValue={log}
        aria-describedby={id + '-message'}
      />
      <Flex id={id + '-message'} align="start" gap={8}>
        <Icon icon={InfoIcon} size="s" color="info" />
        <Text size="caption-l" color="info">
          <bdi>Timestamps use UTC. Each line records one export event.</bdi>
        </Text>
      </Flex>
    </Stack>
  );
}
