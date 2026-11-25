import { useState } from 'react';
import {
  DotsThreeIcon,
  DownloadSimpleIcon,
  FileTextIcon,
  PencilSimpleIcon,
} from '@phosphor-icons/react';
import { Badge, Card, Flex, Icon, IconButton, Stack, Text } from '@docouno/unica';
import { Menu } from '../../prototypes/menu/menu.live.js';
import '@docouno/unica/styles.css';

export function DocumentToolbar({ menuProps = {}, triggerProps = {} } = {}) {
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
          <Menu
            {...menuProps}
            label="Document actions"
            items={[
              {
                id: 'rename',
                label: 'Rename document',
                icon: PencilSimpleIcon,
                run: () => setReceipt('Rename requested for Release checklist.'),
              },
              {
                id: 'export',
                label: 'Export PDF',
                icon: DownloadSimpleIcon,
                run: () => setReceipt('PDF export requested for Release checklist.'),
              },
            ]}
            trigger={(bindings) => (
              <IconButton
                {...bindings}
                {...triggerProps}
                icon={DotsThreeIcon}
                aria-label="Document actions"
              />
            )}
          />
        </Flex>
        <Text role="status" size="caption-l" color="secondary" dir="auto">
          {receipt}
        </Text>
      </Stack>
    </Card>
  );
}
