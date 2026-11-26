import { useState } from 'react';
import {
  DotsThreeIcon,
  DownloadSimpleIcon,
  FileTextIcon,
  PencilSimpleIcon,
} from '@phosphor-icons/react';
import { Badge, Card, Flex, Icon, IconButton, Stack, Text } from '@docouno/unica';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@docouno/unica';
import '@docouno/unica/styles.css';

import type { MenuContentProps } from '@docouno/unica';

export function DocumentToolbar({
  contentProps,
  triggerProps,
}: {
  readonly contentProps?: MenuContentProps | undefined;
  readonly triggerProps?: Readonly<Record<`data-${string}`, string>> | undefined;
} = {}) {
  const [receipt, setReceipt] = useState('');
  return (
    <Card size="s" data-surface="base" style={{ inlineSize: 'min(24rem, 100%)' }}>
      <Stack gap={8}>
        <Flex align="center" gap={8}>
          <Icon usage="slot" icon={FileTextIcon} size="m" color="secondary" />
          <Stack gap={4} align="start" style={{ flex: 1, minInlineSize: 0 }}>
            <Text size="body-s" weight="semibold" dir="auto">
              Release checklist
            </Text>
            <Badge size="s">Published</Badge>
          </Stack>
          <Menu>
            <MenuTrigger {...triggerProps} asChild>
              <IconButton icon={DotsThreeIcon} aria-label="Document actions" />
            </MenuTrigger>
            <MenuContent {...contentProps}>
              <MenuItem
                icon={PencilSimpleIcon}
                onClick={() => setReceipt('Rename requested for Release checklist.')}
              >
                Rename document
              </MenuItem>
              <MenuItem
                icon={DownloadSimpleIcon}
                onClick={() => setReceipt('PDF export requested for Release checklist.')}
              >
                Export PDF
              </MenuItem>
            </MenuContent>
          </Menu>
        </Flex>
        <Text role="status" size="caption-l" color="secondary" dir="auto">
          {receipt}
        </Text>
      </Stack>
    </Card>
  );
}
