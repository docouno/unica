import { useId, useRef, useState } from 'react';
import { CopyIcon, DotsThreeIcon, FileTextIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import { Card, Flex, Icon, IconButton, Input, Link, Stack, Text } from '@docouno/unica';
import { FormField } from '@docouno/unica';
import {
  ContextMenu,
  ContextMenuTrigger,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from '@docouno/unica';
import '@docouno/unica/styles.css';
import type { MenuContentProps } from '@docouno/unica';

export function ReleaseNotesActions({
  allowSelection = false,
  contentProps = {},
  targetProps = {},
}: {
  readonly allowSelection?: boolean | undefined;
  readonly contentProps?: MenuContentProps | undefined;
  readonly targetProps?: Readonly<Record<`data-${string}`, string>> | undefined;
} = {}) {
  const noteId = useId();
  const [selection, setSelection] = useState('');
  const [receipt, setReceipt] = useState('');
  const latestAction = useRef(0);
  const copySelection = () => {
    const action = ++latestAction.current;
    const finish = (copied = false) => {
      if (latestAction.current === action) {
        setReceipt(copied ? `Copied: ${selection}` : `Could not copy: ${selection}`);
      }
    };
    if (!navigator.clipboard) {
      finish();
      return;
    }
    navigator.clipboard.writeText(selection).then(
      () => finish(true),
      () => finish(),
    );
  };
  return (
    <ContextMenu
      size="s"
      shouldOpen={({ native, source, selection }) =>
        !native || Boolean(allowSelection && selection && source.closest('[data-document-excerpt]'))
      }
      onInvoke={(context) => setSelection(context.selection)}
    >
      <ContextMenuTrigger>
        <Card
          {...targetProps}
          size="s"
          data-surface="base"
          style={{ inlineSize: 'min(25rem, 100%)' }}
          role="group"
          aria-label="Release notes"
        >
          <Stack gap={12}>
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
                React 19 release notes
              </Text>
              <MenuTrigger asChild>
                <IconButton
                  size="s"
                  variant="ghost"
                  icon={DotsThreeIcon}
                  aria-label="Release notes actions"
                />
              </MenuTrigger>
            </Flex>
            <Text data-document-excerpt="" size="body-s" color="secondary" dir="auto">
              Select part of this sentence and right-click it.
            </Text>
            <FormField controlId={noteId} label="Revision note" size="s">
              <div data-native-context-region="">
                <Input id={noteId} size="s" defaultValue="Fixes in this release" />
              </div>
            </FormField>
            <Link href="https://react.dev/blog/2024/12/05/react-19">Open the source document</Link>
          </Stack>
          <Text
            size="caption-l"
            color="secondary"
            role="status"
            dir="auto"
            style={{ marginBlockStart: receipt ? 'var(--space-8)' : 0, overflowWrap: 'anywhere' }}
          >
            {receipt}
          </Text>
          <MenuContent align="end" {...contentProps}>
            <MenuItem icon={CopyIcon} disabled={!selection} onClick={copySelection}>
              Copy selected text
            </MenuItem>
            <MenuItem
              icon={PencilSimpleIcon}
              onClick={() => {
                latestAction.current++;
                setReceipt('Rename requested for release notes.');
              }}
            >
              Rename document
            </MenuItem>
          </MenuContent>
        </Card>
      </ContextMenuTrigger>
    </ContextMenu>
  );
}
