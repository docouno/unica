import { useId, useState } from 'react';
import { Button, Flex, Stack, Text } from '@docouno/unica';
import { Avatar, AvatarGroup } from '../../prototypes/avatar/avatar.proto.js';

const contributors = [
  { id: 'editor', name: 'Content editor', src: '/assets/avatar-person-light.png' },
  { id: 'reviewer', name: 'Design reviewer', src: '/assets/avatar-person-dark.png' },
  { id: 'writer', name: 'Workspace writer' },
  { id: 'owner', name: 'Project owner' },
  { id: 'engineer', name: 'Platform engineer' },
  { id: 'researcher', name: 'Design researcher' },
  { id: 'maintainer', name: 'Library maintainer' },
];

export function ContributorDirectory({ max = 3 } = {}) {
  const listId = useId();
  const [open, setOpen] = useState(false);

  return (
    <Stack gap={12} style={{ inlineSize: 'min(100%, 22rem)' }}>
      <Flex align="center" wrap="wrap" gap={12}>
        <AvatarGroup label="Contributors" members={contributors} size="s" max={max} showNames />
        <Button
          size="s"
          variant="ghost"
          tone="neutral"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((previous) => !previous)}
          style={{ minInlineSize: 'min(100%, 9.25em)' }}
        >
          {open ? 'Hide members' : `View all ${contributors.length}`}
        </Button>
      </Flex>
      <ul
        id={listId}
        role="list"
        hidden={!open}
        aria-label="All contributors"
        style={{ listStyle: 'none', margin: 0, padding: 0 }}
      >
        {contributors.map(({ id, name, src }) => (
          <li key={id} style={{ paddingBlock: 'var(--space-4)' }}>
            <Flex align="center" gap={12}>
              <Avatar alt="" name={name} src={src} size="s" />
              <Text as="span" size="body-s">
                <bdi>{name}</bdi>
              </Text>
            </Flex>
          </li>
        ))}
      </ul>
    </Stack>
  );
}
