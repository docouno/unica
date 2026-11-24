import { useId } from 'react';
import { Stack, Text, Title } from '@docouno/unica';
import '@docouno/unica/styles.css';
import { Tabs, TabsContent, TabsList, TabsTab } from '../../prototypes/tabs/tabs.proto.js';

export function DocumentViews({ tabsProps = {} } = {}) {
  const titleId = useId();

  return (
    <Stack gap={8} style={{ inlineSize: 'min(100%, 24rem)' }}>
      <Title id={titleId} as="h3" size="heading-s">
        Release checklist
      </Title>
      <Tabs {...tabsProps} defaultValue="activity">
        <Stack gap={12}>
          <TabsList aria-labelledby={titleId}>
            <TabsTab value="activity">Activity</TabsTab>
            <TabsTab value="details">Details</TabsTab>
          </TabsList>
          <TabsContent value="activity">
            <Stack gap={4}>
              <Text size="body-s" weight="semibold">
                Rollback steps updated
              </Text>
              <Text size="body-s" color="secondary">
                Saved in revision 8
              </Text>
            </Stack>
          </TabsContent>
          <TabsContent value="details">
            <Stack gap={4}>
              <Text size="body-s" weight="semibold">
                Workspace access
              </Text>
              <Text size="body-s" color="secondary">
                <bdi>Members can view this document.</bdi>
              </Text>
            </Stack>
          </TabsContent>
        </Stack>
      </Tabs>
    </Stack>
  );
}
