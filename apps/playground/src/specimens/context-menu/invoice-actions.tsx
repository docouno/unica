import { useState } from 'react';
import { DotsThreeIcon, FileTextIcon } from '@phosphor-icons/react';
import { Card, Flex, Icon, IconButton, Text } from '@docouno/unica';
import {
  ContextMenu,
  ContextMenuTrigger,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from '@docouno/unica';
import '@docouno/unica/styles.css';
import { CopyIcon, DownloadSimpleIcon, PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import type { ContextMenuProps, MenuContentProps } from '@docouno/unica';
import './context-menu.examples.css';

export function InvoiceActions({
  menuProps = {},
  targetProps = {},
  contentProps = {},
  triggerLabel = 'File actions',
  longPress = false,
  onRequest = (command) => console.log(command),
}: {
  readonly menuProps?: Partial<ContextMenuProps> | undefined;
  readonly targetProps?: Readonly<Record<`data-${string}`, string>> | undefined;
  readonly contentProps?: MenuContentProps | undefined;
  readonly triggerLabel?: string | undefined;
  readonly longPress?: boolean | undefined;
  readonly onRequest?: ((command: string) => void) | undefined;
} = {}) {
  const [receipt, setReceipt] = useState('');
  const report = (command: string, label: string): void => {
    onRequest(command);
    setReceipt(`${label} requested for Invoice draft.`);
  };
  return (
    <ContextMenu size="s" longPress={longPress} {...menuProps}>
      <ContextMenuTrigger>
        <Card
          {...targetProps}
          size="s"
          data-surface="base"
          className="context-study-target"
          data-touch-hold={longPress || undefined}
          style={{
            inlineSize: 'min(25rem, 100%)',
            outlineWidth: 2,
            outlineColor: 'var(--focus-ring-color)',
            outlineOffset: 2,
            userSelect: longPress ? 'none' : undefined,
            WebkitTouchCallout: longPress ? 'none' : undefined,
          }}
          role="group"
          aria-label="Invoice draft"
          tabIndex={0}
        >
          <Flex align="center" gap={8} style={{ minInlineSize: 0 }}>
            <Icon
              usage="slot"
              icon={FileTextIcon}
              size="m"
              color="secondary"
              style={{
                flex: 'none',
                inlineSize: 28,
                blockSize: 28,
                padding: 4,
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--neutral-soft-bg)',
              }}
            />
            <Text
              size="body-s"
              weight="semibold"
              style={{ flex: 1, minInlineSize: 0, overflowWrap: 'anywhere' }}
            >
              Invoice draft
            </Text>
            <MenuTrigger asChild>
              <IconButton size="s" variant="ghost" icon={DotsThreeIcon} aria-label={triggerLabel} />
            </MenuTrigger>
          </Flex>
          <Text
            size="caption-l"
            color="secondary"
            role="status"
            dir="auto"
            style={{ marginBlockStart: receipt ? 'var(--space-8)' : 0, overflowWrap: 'anywhere' }}
          >
            {receipt}
          </Text>
          <MenuContent aria-label="Invoice draft actions" align="end" {...contentProps}>
            <MenuItem
              icon={PencilSimpleIcon}
              shortcut="F2"
              onClick={() => report('rename', 'Rename')}
            >
              Rename
            </MenuItem>
            <MenuItem icon={CopyIcon} onClick={() => report('copy', 'Copy file link')}>
              Copy file link
            </MenuItem>
            <MenuItem icon={DownloadSimpleIcon} disabled description="Publish the draft first">
              Export PDF
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              icon={TrashIcon}
              tone="danger"
              onClick={() => report('trash', 'Move to trash')}
            >
              Move to trash
            </MenuItem>
          </MenuContent>
        </Card>
      </ContextMenuTrigger>
    </ContextMenu>
  );
}
