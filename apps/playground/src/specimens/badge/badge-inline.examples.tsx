import { Badge, Divider, Flex, Stack, Text, Title } from '@docouno/unica';
import { LockSimpleIcon } from '@phosphor-icons/react';

export function InlineExample({ badgeProps = {} } = {}) {
  return (
    <Stack gap={16} style={{ inlineSize: 'min(100%, 42ch)' }}>
      <Text>
        <bdi>
          The document is{' '}
          <Badge {...badgeProps} size="s" status="success">
            Verified
          </Badge>{' '}
          and ready to share.
        </bdi>
      </Text>
      <Text>
        <bdi>
          The service is{' '}
          <Badge {...badgeProps} size="s" status="success" dot>
            Online
          </Badge>{' '}
          in every region.
        </bdi>
      </Text>
      <Text>
        <bdi>
          This record is{' '}
          <Badge {...badgeProps} size="s" iconLeft={LockSimpleIcon}>
            Private
          </Badge>{' '}
          to your workspace.
        </bdi>
      </Text>
      <Title as="h3" size="heading-m">
        <bdi>
          Release notes{' '}
          <Badge {...badgeProps} status="accent">
            Beta
          </Badge>
        </bdi>
      </Title>
      <Divider />
      <Flex align="baseline" justify="space-between" gap={8} wrap="wrap">
        <Text size="body-s" weight="medium">
          API reference
        </Text>
        <Flex align="baseline" gap={8} wrap="wrap">
          <Badge {...badgeProps} size="s">
            v2.8
          </Badge>
          <Badge {...badgeProps} size="s" status="success">
            Published
          </Badge>
        </Flex>
      </Flex>
      <Flex align="baseline" justify="space-between" gap={8} wrap="wrap">
        <Text size="body-s" weight="medium">
          Migration guide
        </Text>
        <Badge {...badgeProps} size="s" status="warning">
          Needs review
        </Badge>
      </Flex>
    </Stack>
  );
}
