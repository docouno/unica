import { Card, Input, Text } from '@docouno/unica';
import { FileTextIcon, UsersIcon } from '@phosphor-icons/react';
import { useId } from 'react';
import type { ReactElement } from 'react';
import { FormField } from '@docouno/unica';
import { Tabs, TabsContent, TabsList, TabsTab } from '../../prototypes/tabs/tabs.proto.js';
import type { PreviewProps } from '../../workbench/types.js';

export function ManualExample({ ctx }: PreviewProps): ReactElement {
  const heading = useId();
  return (
    <Card className="tabs-manual-card" data-example-disclosure="">
      <Text id={heading} size="body-s" weight="medium">
        Report settings
      </Text>
      <Tabs
        {...ctx.subject}
        defaultValue="overview"
        activationMode="manual"
        className="tabs-example-layout"
      >
        <TabsList aria-labelledby={heading}>
          <TabsTab value="overview" iconLeft={FileTextIcon}>
            Overview
          </TabsTab>
          <TabsTab value="people" iconLeft={UsersIcon}>
            Recipients
          </TabsTab>
          <TabsTab value="audit" disabled>
            Audit
          </TabsTab>
        </TabsList>
        <div className="tabs-example-panels">
          <TabsContent value="overview" tabIndex={-1}>
            <FormField controlId={`${heading}-report`} label="Report name">
              <Input id={`${heading}-report`} defaultValue="Weekly summary" />
            </FormField>
          </TabsContent>
          <TabsContent value="people">
            <Text size="body-s" color="secondary">
              <bdi>Weekly reports are sent to the workspace owners.</bdi>
            </Text>
          </TabsContent>
          <TabsContent value="audit">
            <Text size="body-s" color="secondary">
              <bdi>Audit is unavailable.</bdi>
            </Text>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}

export function OverlayExample({ ctx }: PreviewProps): ReactElement {
  const heading = useId();
  return (
    <div className="tabs-overlay-stage">
      <section
        className="unica-overlay-surface tabs-overlay-example"
        data-surface="overlay"
        aria-labelledby={heading}
      >
        <Text id={heading} size="body-m" weight="medium">
          Snapshot
        </Text>
        <Tabs {...ctx.subject} size="s" defaultValue="activity" className="tabs-example-layout">
          <TabsList aria-label="Snapshot panels">
            <TabsTab value="activity" count={8} countLabel="8 events">
              Activity
            </TabsTab>
            <TabsTab value="details">Details</TabsTab>
          </TabsList>
          <div className="tabs-example-panels">
            <TabsContent value="activity">
              <Text size="body-s" color="secondary">
                <bdi>Eight events since the last snapshot.</bdi>
              </Text>
            </TabsContent>
            <TabsContent value="details">
              <Text size="body-s" color="secondary">
                <bdi>Created today at 09:41.</bdi>
              </Text>
            </TabsContent>
          </div>
        </Tabs>
      </section>
    </div>
  );
}
