import { useState } from 'react';
import { Badge, Card, Flex, Stack, Text } from '@docouno/unica';
import { Select } from '../../prototypes/select/select.proto.js';
import '@docouno/unica/styles.css';

const channels = [
  { value: 'email', label: 'Email' },
  { value: 'chat', label: 'Chat' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'legacy', label: 'Legacy import', disabled: true },
];
const activity = [
  { channel: 'chat', title: 'Design review updated' },
  { channel: 'email', title: 'Release notes published' },
  { channel: 'webhook', title: 'Build completed' },
  { channel: 'legacy', title: 'Archive imported' },
];
export function ChannelActivity({ selectProps = {} } = {}) {
  const [selected, setSelected] = useState(['email', 'legacy']);
  const entries = activity.filter(({ channel }) => selected.includes(channel));
  return (
    <Stack gap={12} style={{ inlineSize: 'min(100%, 28rem)' }}>
      <Select
        {...selectProps}
        multiple
        searchable
        label="Activity sources"
        options={channels}
        values={selected}
        onValuesChange={(values) => setSelected([...values])}
        placeholder="Choose sources"
      />
      <Card size="s" variant="subtle">
        <Stack gap={12}>
          <Text size="body-s" role="status">
            <bdi>
              {entries.length} {entries.length === 1 ? 'event' : 'events'}
            </bdi>
          </Text>
          {entries.length > 0 && (
            <Stack role="list" aria-label="Activity" gap={8}>
              {entries.map(({ channel, title }) => (
                <Flex role="listitem" key={channel} wrap="wrap" align="center" gap={8}>
                  <Badge size="s">{channels.find(({ value }) => value === channel)?.label}</Badge>
                  <Text size="body-s">{title}</Text>
                </Flex>
              ))}
            </Stack>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
