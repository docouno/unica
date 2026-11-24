import { useId, useState } from 'react';
import { Button, Indicator, Stack, Text } from '@docouno/unica';

const notifications = [
  'Your export is ready.',
  'A file was shared with you.',
  'Your backup is complete.',
];

export function UnreadNotifications({ indicatorProps = {} } = {}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(notifications.length);

  return (
    <Stack align="start" gap={12} style={{ inlineSize: 'min(100%, 18rem)' }}>
      <Indicator {...indicatorProps} count={unread} size="s">
        <Button
          type="button"
          variant="secondary"
          tone="neutral"
          size="s"
          aria-label={`Notifications, ${unread} unread`}
          aria-controls={listId}
          aria-expanded={open}
          onClick={() => {
            setOpen((previous) => !previous);
            setUnread(0);
          }}
        >
          Notifications
        </Button>
      </Indicator>
      <ul
        id={listId}
        aria-label="Notifications"
        hidden={!open}
        style={{ margin: 0, paddingInlineStart: '1.25em' }}
      >
        {notifications.map((message) => (
          <li key={message}>
            <Text as="span" size="body-s">
              <bdi>{message}</bdi>
            </Text>
          </li>
        ))}
      </ul>
    </Stack>
  );
}
