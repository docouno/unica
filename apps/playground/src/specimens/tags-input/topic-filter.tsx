import { useState } from 'react';
import { Card, Stack, Text } from '@docouno/unica';
import { TagsInput } from '../../prototypes/tags-input/tags-input.proto.js';
import '@docouno/unica/styles.css';

const notes = [
  { title: 'Interview guide', topics: ['Research', 'Interviews'] },
  { title: 'Type specimens', topics: ['Design'] },
  { title: 'Usability findings', topics: ['Research', 'Design'] },
];

export function TopicFilter({ fieldProps = {} } = {}) {
  const [topics, setTopics] = useState(['Research']);
  const matches = notes.filter(
    (note) =>
      topics.length === 0 ||
      topics.some((topic) =>
        note.topics.some((label) => label.toLowerCase() === topic.toLowerCase()),
      ),
  );
  return (
    <Stack gap={16} style={{ inlineSize: 'min(100%, 30rem)' }}>
      <TagsInput
        {...fieldProps}
        label="Filter notes by topic"
        values={topics}
        onValuesChange={(next) => setTopics([...next])}
        description="Add any matching topic to include its notes. Remove all topics to see every note."
      />
      <Card variant="subtle" size="s">
        <Stack gap={12}>
          <Text size="body-s" weight="semibold" role="status">
            <bdi>
              {matches.length} {matches.length === 1 ? 'matching note' : 'matching notes'}
            </bdi>
          </Text>
          {matches.length > 0 && (
            <Stack role="list" aria-label="Matching notes" gap={12}>
              {matches.map((note) => (
                <Stack role="listitem" gap={4} key={note.title}>
                  <Text size="body-s">{note.title}</Text>
                  <Text size="caption-l" color="secondary">
                    <bdi>{note.topics.join(' · ')}</bdi>
                  </Text>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
