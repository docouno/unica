import { useState } from 'react';
import { Card, Flex, Stack, Text } from '@docouno/unica';
import { Select } from '../../prototypes/select/select.proto.js';
import '@docouno/unica/styles.css';

const orders = [
  { value: 'title', label: 'Title A–Z' },
  { value: 'recent', label: 'Recently updated' },
];
const documents = [
  { title: 'Release plan', updated: '2026-09-14' },
  { title: 'Design review', updated: '2026-09-16' },
  { title: 'API reference', updated: '2026-09-12' },
];

export function DocumentOrder({ selectProps = {} } = {}) {
  const [order, setOrder] = useState('title');
  const sorted = [...documents];
  if (order === 'title') {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (order === 'recent') {
    sorted.sort((a, b) => b.updated.localeCompare(a.updated));
  }
  return (
    <Stack gap={12} style={{ inlineSize: 'min(100%, 28rem)' }}>
      <Select
        {...selectProps}
        label="Document order"
        options={orders}
        value={order || null}
        onValueChange={(next) => setOrder(next ?? '')}
        clearable
        placeholder="Original order"
      />
      <Card size="s" variant="subtle">
        <Stack role="list" aria-label="Documents" gap={12}>
          {sorted.map(({ title, updated }) => (
            <Flex
              key={title}
              role="listitem"
              wrap="wrap"
              justify="space-between"
              align="center"
              gap={8}
            >
              <Text size="body-s">{title}</Text>
              <Text size="caption-l" color="secondary">
                <time dateTime={updated} dir="ltr">
                  {updated}
                </time>
              </Text>
            </Flex>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}
