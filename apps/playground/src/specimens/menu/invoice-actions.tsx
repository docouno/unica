import { useState } from 'react';
import { DotsThreeIcon, FileTextIcon } from '@phosphor-icons/react';
import { Card, Flex, Icon, IconButton, Text } from '@docouno/unica';
import { ContextMenu } from '../../prototypes/menu/context-menu.proto.js';
import '@docouno/unica/styles.css';
import { invoiceCommands } from './invoice-commands.js';

export function InvoiceActions({
  menuProps = {},
  targetProps = {},
  triggerLabel = 'File actions',
  longPress = false,
  onRequest = (command = '') => console.log(command),
} = {}) {
  const [receipt, setReceipt] = useState('');
  return (
    <ContextMenu
      onInvoke={(context) => console.log(context)}
      {...menuProps}
      label="Invoice draft actions"
      longPress={longPress}
      items={invoiceCommands.map((item) =>
        !('label' in item) || ('disabled' in item && item.disabled)
          ? item
          : {
              ...item,
              run: () => {
                onRequest(item.id);
                setReceipt(`${item.label} requested for Invoice draft.`);
              },
            },
      )}
      trigger={(bindings) => (
        <IconButton
          {...bindings}
          size="s"
          variant="ghost"
          icon={DotsThreeIcon}
          aria-label={triggerLabel}
        />
      )}
      target={(bindings, trigger, panel) => (
        <Card
          {...bindings}
          {...targetProps}
          size="s"
          data-surface="base"
          data-touch-hold={longPress || undefined}
          style={{
            inlineSize: 'min(25rem, 100%)',
            outlineWidth: 2,
            outlineColor: 'var(--focus-ring-color)',
            outlineOffset: 2,
            userSelect: longPress ? 'none' : undefined,
            WebkitTouchCallout: longPress ? 'none' : undefined,
            borderColor:
              bindings['data-context-open'] === 'point' ? 'var(--border-strong)' : undefined,
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
            {trigger}
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
          {panel}
        </Card>
      )}
    />
  );
}
