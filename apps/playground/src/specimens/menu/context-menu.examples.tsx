import type { ReactElement } from 'react';
import { CursorIcon, DotsThreeIcon, FileTextIcon } from '@phosphor-icons/react';
import { Card, Flex, Icon, IconButton, Text } from '@docouno/unica';
import { MenuRows, MenuSurface } from '../../prototypes/menu/menu.proto.js';
import type { PreviewProps } from '../../workbench/types.js';
import { InvoiceActions } from './invoice-actions.js';
import { invoiceCommands } from './invoice-commands.js';

import './context-menu.examples.css';

export function Placement({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="context-study-matrix">
      {(['point', 'button'] as const).map((mode) => (
        <div key={mode} className="context-study-pin" data-origin={mode}>
          <Text size="caption-l" color="secondary">
            {mode === 'point' ? 'Pointer anchor · pinned' : 'Actions button · pinned'}
          </Text>
          <Card
            {...ctx.subject}
            className="context-study-target"
            size="s"
            data-surface="base"
            data-context-open={mode === 'point' ? 'point' : undefined}
            inert
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

              <IconButton
                size="s"
                variant="ghost"
                icon={DotsThreeIcon}
                aria-label="File actions"
                aria-expanded="true"
              />
            </Flex>
          </Card>
          <div className="context-study-pin-menu">
            {mode === 'point' && (
              <Icon icon={CursorIcon} directional className="context-study-cursor" />
            )}
            <MenuSurface {...ctx.subject} role="group" aria-label="Invoice draft actions" size="s">
              <MenuRows items={invoiceCommands} preview />
            </MenuSurface>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Invocations({ ctx, touch = false }: PreviewProps & { readonly touch?: boolean }) {
  return (
    <div className="context-study-live" data-menu-boundary>
      <InvoiceActions
        targetProps={ctx.subject}
        menuProps={{ size: 's', align: 'end', panelAttributes: ctx.subject }}
        triggerLabel="Actions for Invoice draft"
        longPress={touch}
      />
    </div>
  );
}
