import { FileTextIcon, GitCommitIcon, TicketIcon } from '@phosphor-icons/react';
import {
  Badge,
  Divider,
  Flex,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Icon,
  Link,
  Text,
  Title,
} from '@docouno/unica';
import '@docouno/unica/styles.css';

export function DocumentPreview({ long = false, empty = false } = {}) {
  return (
    <>
      <Flex align="start" gap={8}>
        <Icon usage="slot" icon={FileTextIcon} size="s" color="secondary" />
        <Text dir="auto" size="caption-l" color="secondary">
          Documentation · PostgreSQL
        </Text>
      </Flex>
      <Title dir="auto" as="h3" size="body-m">
        {long ? 'High Availability, Load Balancing, and Replication' : 'Failover'}
      </Title>
      <Text dir="auto" size="body-s" color="secondary">
        {empty
          ? 'No summary yet.'
          : long
            ? 'Compare replication strategies and how primary and standby servers share work. The chapter covers log shipping, failover and the ways a hot standby can serve queries while recovery continues.'
            : 'Learn what happens when a standby takes over and how to prepare a replacement standby after failover.'}
      </Text>
      <Flex wrap="wrap" gap={4}>
        <Badge size="s">PostgreSQL 17</Badge>
        <Badge size="s">{long ? 'Replication' : 'Standby'}</Badge>
      </Flex>
      <Divider decorative />
      <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
        <Badge status="info" size="s" dot>
          Reference
        </Badge>
        <Text dir="auto" size="caption-l" color="secondary">
          {long ? 'Chapter 26' : 'Section 26.3'}
        </Text>
      </Flex>
    </>
  );
}

const commit = 'bb917d83b16231ad5193731f0405fbc53122d68b';

export function EntityCard({
  entity = 'document',
  long = false,
  identifier = false,
  limited = false,
  linkProps = {},
  subject = {},
} = {}) {
  const issue = entity === 'issue';
  const revision = entity === 'commit';
  const href = issue
    ? 'https://github.com/python/cpython/issues/142956'
    : revision
      ? 'https://github.com/python/cpython/commit/' + commit
      : long
        ? 'https://www.postgresql.org/docs/17/high-availability.html'
        : 'https://www.postgresql.org/docs/17/warm-standby-failover.html';
  const label = issue
    ? 'CPython issue 142956'
    : revision
      ? 'Commit bb917d8'
      : long
        ? 'PostgreSQL high availability'
        : 'PostgreSQL failover';
  return (
    <HoverCard defaultOpen>
      <HoverCardTrigger asChild>
        <Link {...subject} href={href} {...linkProps}>
          {label}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent {...subject} style={limited ? { maxBlockSize: 200 } : undefined}>
        {issue || revision ? (
          <>
            <Flex align="start" gap={8}>
              <Icon
                usage="slot"
                icon={issue ? TicketIcon : GitCommitIcon}
                size="s"
                color="secondary"
              />
              <Text dir="auto" size="caption-l" color="secondary">
                {issue ? 'Issue 142956' : 'Commit bb917d8'} · CPython
              </Text>
            </Flex>
            <Title dir="auto" as="h3" size="body-m">
              {issue ? 'TOML 1.1' : 'Support TOML 1.1.0 in tomllib'}
            </Title>
            <Text dir="auto" size="body-s" color="secondary">
              {identifier ? (
                <bdi dir="ltr">{commit}</bdi>
              ) : issue ? (
                'Track support for TOML 1.1 in the Python standard library.'
              ) : (
                'Update the parser and its tests for the TOML 1.1.0 specification.'
              )}
            </Text>
            <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
              <Badge status={issue ? 'info' : 'neutral'} size="s" dot>
                {issue ? 'Enhancement' : 'Commit'}
              </Badge>
              <Text dir="auto" size="caption-l" color="secondary">
                {issue ? 'Standard library' : '18 files changed'}
              </Text>
            </Flex>
          </>
        ) : (
          <DocumentPreview long={long} />
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
