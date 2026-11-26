import { Card, Input, Text } from '@docouno/unica';
import { FileTextIcon, UsersIcon } from '@phosphor-icons/react';
import { useId } from 'react';
import type { ReactElement } from 'react';
import { FormField } from '@docouno/unica';
import { Tabs, TabsPanel, TabsList, TabsTrigger } from '@docouno/unica';
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
        mountStrategy={
          ctx.story?.controls.mountStrategy === 'lazy'
            ? 'lazy'
            : ctx.story?.controls.mountStrategy === 'unmount'
              ? 'unmount'
              : 'eager'
        }
        className="tabs-example-layout"
      >
        <TabsList aria-labelledby={heading}>
          <TabsTrigger value="overview" iconLeft={FileTextIcon}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="people" iconLeft={UsersIcon}>
            Recipients
          </TabsTrigger>
          <TabsTrigger value="audit" disabled>
            Audit
          </TabsTrigger>
        </TabsList>
        <div className="tabs-example-panels">
          <TabsPanel value="overview" tabIndex={-1}>
            <FormField controlId={`${heading}-report`} label="Report name">
              <Input id={`${heading}-report`} defaultValue="Weekly summary" />
            </FormField>
          </TabsPanel>
          <TabsPanel value="people">
            <Text size="body-s" color="secondary">
              <bdi>Weekly reports are sent to the workspace owners.</bdi>
            </Text>
          </TabsPanel>
          <TabsPanel value="audit">
            <Text size="body-s" color="secondary">
              <bdi>Audit is unavailable.</bdi>
            </Text>
          </TabsPanel>
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
            <TabsTrigger value="activity" count={8} countLabel="8 events">
              Activity
            </TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <div className="tabs-example-panels">
            <TabsPanel value="activity">
              <Text size="body-s" color="secondary">
                <bdi>Eight events since the last snapshot.</bdi>
              </Text>
            </TabsPanel>
            <TabsPanel value="details">
              <Text size="body-s" color="secondary">
                <bdi>Created today at 09:41.</bdi>
              </Text>
            </TabsPanel>
          </div>
        </Tabs>
      </section>
    </div>
  );
}
