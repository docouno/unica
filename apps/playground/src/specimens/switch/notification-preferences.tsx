import { useId } from 'react';
import { Flex, Stack, Switch, SwitchGroup, Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function NotificationPreferences({ subjectProps = {} } = {}) {
  const id = useId();
  return (
    <Flex wrap="wrap" align="start" gap={24} style={{ inlineSize: '100%' }}>
      <Stack gap={8} style={{ flex: '1 1 16rem' }}>
        <Text id={id + '-group'} size="body-s" weight="medium">
          Notification preferences
        </Text>
        <SwitchGroup aria-labelledby={id + '-group'} defaultValue={['mentions']}>
          <div {...subjectProps} style={{ inlineSize: 'fit-content', maxInlineSize: '100%' }}>
            <Switch
              value="mentions"
              label="Mentions"
              description={<bdi>When someone mentions you directly.</bdi>}
            />
          </div>
          <Switch
            value="comments"
            label="Replies"
            description={<bdi>When a conversation receives a reply.</bdi>}
          />
          <Switch
            value="updates"
            label="Followed items"
            description={<bdi>When a followed item changes.</bdi>}
          />
        </SwitchGroup>
      </Stack>
      <Flex align="start" justify="space-between" gap={16} style={{ flex: '1 1 16rem' }}>
        <Stack gap={4} style={{ paddingBlockStart: 'var(--space-8)' }}>
          <Text as="label" htmlFor={id} id={id + '-label'} size="body-s" weight="medium">
            Show reading progress
          </Text>
          <Text id={id + '-help'} size="caption-l" color="secondary">
            <bdi>Resume from the last section you read.</bdi>
          </Text>
        </Stack>
        <Switch
          id={id}
          style={{ flexShrink: 0 }}
          defaultChecked
          aria-labelledby={id + '-label'}
          aria-describedby={id + '-help'}
        />
      </Flex>
    </Flex>
  );
}
