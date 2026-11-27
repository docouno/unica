import { useState } from 'react';
import { Badge, Dropzone, Flex, Stack, Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function BatchSummary({ intakeProps = {} } = {}) {
  const [summary, setSummary] = useState({ count: 0, bytes: 0 });
  return (
    <Stack gap={12}>
      <Dropzone
        {...intakeProps}
        multiple
        accept=""
        description={<bdi>Choose local files to measure this batch.</bdi>}
        onIntake={({ accepted }) => {
          setSummary({
            count: accepted.length,
            bytes: accepted.reduce((sum, file) => sum + file.size, 0),
          });
        }}
      />
      <Flex role="status" align="center" gap={8} wrap="wrap">
        <Badge size="s">
          <bdi>
            {summary.count} {summary.count === 1 ? 'file' : 'files'}
          </bdi>
        </Badge>
        <Text as="span" size="body-s" color="secondary">
          <bdi>
            {summary.bytes.toLocaleString('en')} {summary.bytes === 1 ? 'byte' : 'bytes'} in this
            batch
          </bdi>
        </Text>
      </Flex>
    </Stack>
  );
}
