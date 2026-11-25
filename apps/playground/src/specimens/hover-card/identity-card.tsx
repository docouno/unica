import { UsersIcon } from '@phosphor-icons/react';
import {
  Badge,
  Flex,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Link,
  Stack,
  Text,
  Title,
} from '@docouno/unica';
import { Avatar } from '../../prototypes/avatar/avatar.proto.js';
import '@docouno/unica/styles.css';

function DirectoryIdentity({ team = false } = {}) {
  const name = team ? 'Python triage team' : 'Debian project leader';
  return (
    <>
      <Flex align="start" gap={12}>
        <Avatar
          name={name}
          alt=""
          size="m"
          fallback={team ? <UsersIcon size="1em" /> : undefined}
        />
        <Stack gap={2} style={{ minInlineSize: 0 }}>
          <Title dir="auto" as="h3" size="body-m">
            {name}
          </Title>
          <Text dir="auto" size="body-s" color="secondary">
            {team ? 'Issue triage · Python project' : 'Project representative · Debian'}
          </Text>
        </Stack>
      </Flex>
      <Text dir="auto" size="body-s" color="secondary">
        {team
          ? 'Reviews incoming issues and pull requests, applies labels and helps contributors find the right reviewers.'
          : 'Coordinates work across the project and represents Debian in its relationships with other organizations.'}
      </Text>
      <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
        <Badge status={team ? 'accent' : 'neutral'} size="s" dot>
          {team ? 'By invitation' : 'Elected'}
        </Badge>
        <Text dir="auto" size="caption-l" color="secondary">
          {team ? 'Manages backports' : 'One-year term'}
        </Text>
      </Flex>
    </>
  );
}

export function TeamPreview() {
  return <DirectoryIdentity team />;
}

export function IdentityCard({
  identity = 'member',
  inline = false,
  linkProps = {},
  subject = {},
} = {}) {
  const team = inline || identity === 'team';
  const trigger = (
    <HoverCardTrigger asChild>
      <Link
        {...subject}
        href={
          team
            ? 'https://devguide.python.org/triage/triage-team/'
            : 'https://www.debian.org/devel/leader'
        }
        {...linkProps}
      >
        {team ? 'Python triage team' : 'Debian project leader'}
      </Link>
    </HoverCardTrigger>
  );
  return (
    <HoverCard defaultOpen>
      {inline ? (
        <Text as="p" dir="auto" size="body-s" color="secondary">
          Incoming issues are reviewed by the {trigger}.
        </Text>
      ) : (
        trigger
      )}
      <HoverCardContent {...subject}>
        {team ? <TeamPreview /> : <DirectoryIdentity />}
      </HoverCardContent>
    </HoverCard>
  );
}
