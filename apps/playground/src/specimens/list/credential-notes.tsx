import { useId } from 'react';
import { Code, Link, Stack, Text } from '@docouno/unica';
import { List, ListItem } from '../../prototypes/list/list.proto.js';
import '@docouno/unica/styles.css';

export function CredentialNotes({ subject = {} } = {}) {
  const notesId = useId();
  return (
    <Text as="div" size="body-m" color="secondary" style={{ maxInlineSize: '50ch' }}>
      <Stack gap={16}>
        <Stack gap={8}>
          <Text>
            <bdi>Before rotating a credential:</bdi>
          </Text>
          <List {...subject} aria-label="Rotation prerequisites">
            <ListItem>
              <bdi>Confirm a second maintainer has access to the vault.</bdi>
            </ListItem>
            <ListItem>
              <bdi>Check the services using the credential:</bdi>
              <List {...subject}>
                <ListItem>
                  <bdi>Scheduled snapshots and nightly exports</bdi>
                </ListItem>
                <ListItem>
                  <bdi>
                    Regional workers that read <Code>EXPORT_TOKEN</Code>
                  </bdi>
                </ListItem>
              </List>
            </ListItem>
            <ListItem>
              <bdi>
                Read the <Link href={'#' + notesId}>handoff notes</Link> before replacing a key.
              </bdi>
            </ListItem>
          </List>
        </Stack>
        <Stack gap={8}>
          <Text>
            <bdi>Record the final checks in this order:</bdi>
          </Text>
          <List {...subject} as="ol" start={12} aria-label="Final checks">
            <ListItem>
              <bdi>Run one export using the new credential.</bdi>
            </ListItem>
            <ListItem>
              <bdi>Disable the old key after the export succeeds.</bdi>
            </ListItem>
            <ListItem>
              <bdi>Leave a note for the next on-call maintainer.</bdi>
            </ListItem>
          </List>
        </Stack>
        <Stack gap={8}>
          <Text>
            <bdi>Latest audit entries:</bdi>
          </Text>
          <List
            {...subject}
            as="ol"
            reversed
            start={10020}
            style={{ paddingInlineStart: '12ch' }}
            aria-label="Latest audit entries"
          >
            <ListItem>New credential tested</ListItem>
            <ListItem value={10015}>Rotation approved</ListItem>
            <ListItem>Maintainer notified</ListItem>
          </List>
        </Stack>
        <Stack gap={8} id={notesId}>
          <Text>Handoff notes</Text>
          <List {...subject} markers={false} aria-label="Handoff notes">
            <ListItem>
              <bdi>Keep the previous credential available until verification ends.</bdi>
            </ListItem>
            <ListItem>
              <bdi>Record the expiry date in the rotation log.</bdi>
            </ListItem>
          </List>
        </Stack>
      </Stack>
    </Text>
  );
}
