import { Button, Stack, Text } from '@docouno/unica';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@docouno/unica';
import { CopyIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import type { MenuContentProps, MenuProps } from '@docouno/unica';
import { useDocumentReceipt } from './use-document-receipt.js';
import '@docouno/unica/styles.css';

export function DocumentMenu({
  menuProps = {},
  triggerProps = {},
  contentProps = {},
  onCommand = (id) => console.log(id),
}: {
  readonly menuProps?: Partial<MenuProps> | undefined;
  readonly triggerProps?: Readonly<Record<`data-${string}`, string>> | undefined;
  readonly contentProps?: MenuContentProps | undefined;
  readonly onCommand?: ((id: string) => void) | undefined;
} = {}) {
  const { receipt, report, copyLink } = useDocumentReceipt();
  return (
    <Stack align="start" gap={8}>
      <Text size="body-s" weight="semibold" dir="auto">
        Failover guide bookmark
      </Text>
      <Menu {...menuProps}>
        <MenuTrigger asChild>
          <Button {...triggerProps}>Document actions</Button>
        </MenuTrigger>
        <MenuContent {...contentProps}>
          <MenuItem
            icon={PencilSimpleIcon}
            onClick={() => {
              onCommand('rename');
              report('Rename requested.');
            }}
          >
            Rename
          </MenuItem>
          <MenuItem
            icon={CopyIcon}
            onClick={() => {
              onCommand('copy');
              copyLink();
            }}
          >
            Copy link
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            tone="danger"
            onClick={() => {
              onCommand('archive');
              report('Archive requested.');
            }}
          >
            Archive
          </MenuItem>
        </MenuContent>
      </Menu>
      <Text size="caption-l" color="secondary" role="status" dir="auto">
        {receipt}
      </Text>
    </Stack>
  );
}
