import { Button, Stack, Text } from '@docouno/unica';
import { Menu } from '../../prototypes/menu/menu.live.js';
import { documentCommands } from './document-commands.js';
import { useDocumentReceipt } from './use-document-receipt.js';
import '@docouno/unica/styles.css';

export function DocumentMenu({
  menuProps = {},
  triggerProps = {},
  onCommand = (id = '') => console.log(id),
} = {}) {
  const { receipt, report, copyLink } = useDocumentReceipt();
  return (
    <Stack align="start" gap={8}>
      <Text size="body-s" weight="semibold" dir="auto">
        Failover guide bookmark
      </Text>
      <Menu
        {...menuProps}
        label="Document actions"
        trigger={(bindings) => (
          <Button {...bindings} {...triggerProps}>
            Document actions
          </Button>
        )}
        items={documentCommands.map((entry) =>
          'label' in entry
            ? {
                ...entry,
                run: () => {
                  onCommand(entry.id);
                  if (entry.id === 'copy') {
                    copyLink();
                  } else {
                    report(`${entry.label} requested.`);
                  }
                },
              }
            : entry,
        )}
      />
      <Text size="caption-l" color="secondary" role="status" dir="auto">
        {receipt}
      </Text>
    </Stack>
  );
}
