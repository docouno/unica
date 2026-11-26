import {
  Card,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  Text,
  Title,
} from '@docouno/unica';
import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { Table, TableScroll } from '../../prototypes/table/table.proto.js';
import type { PreviewProps } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';
import '../shared/disclosure.examples.css';

export function TriggerStates({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="disclosure-study disclosure-study-grid" data-example-disclosure="">
      {[false, true].map((defaultOpen) => (
        <div className="disclosure-study-sample" key={String(defaultOpen)}>
          <Text size="caption-l" color="muted">
            {defaultOpen ? 'Initially open' : 'Initially closed'}
          </Text>
          <Collapsible {...ctx.subject} defaultOpen={defaultOpen}>
            <CollapsibleTrigger>Delivery window</CollapsibleTrigger>
            <CollapsibleContent>
              <bdi>Weekdays, 09:00–17:00 UTC.</bdi>
            </CollapsibleContent>
          </Collapsible>
        </div>
      ))}
    </div>
  );
}

export function Availability({ ctx }: PreviewProps): ReactElement {
  const reasonId = useId();
  return (
    <div className="disclosure-study disclosure-study-grid">
      <div className="disclosure-study-sample">
        <Text size="caption-l" color="muted">
          <bdi>Unavailable · closed</bdi>
        </Text>
        <Collapsible {...ctx.subject} disabled>
          <CollapsibleTrigger aria-describedby={reasonId}>Provider diagnostics</CollapsibleTrigger>
          <Text
            id={reasonId}
            className="disclosure-study-reason"
            size="caption-l"
            color="secondary"
          >
            <bdi>Connect a provider to see diagnostics.</bdi>
          </Text>
          <CollapsibleContent>
            <bdi>Recent request failures and retry history.</bdi>
          </CollapsibleContent>
        </Collapsible>
      </div>
      <div className="disclosure-study-sample">
        <Text size="caption-l" color="muted">
          <bdi>Unavailable · open</bdi>
        </Text>
        <Collapsible {...ctx.subject} defaultOpen disabled>
          <CollapsibleTrigger>Local diagnostics</CollapsibleTrigger>
          <CollapsibleContent>
            <Checkbox size="s" label="Include timestamps" defaultChecked />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

export function Wrapping({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="disclosure-study-narrow" data-example-disclosure="">
      <Collapsible {...ctx.subject} size="s" defaultOpen>
        <CollapsibleTrigger>
          Delivery checks for regionalIncidentNotificationDeliveryService
        </CollapsibleTrigger>
        <CollapsibleContent>
          <bdi>Retries stop after the third attempt.</bdi>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function FlushContent({ ctx }: PreviewProps): ReactElement {
  return (
    <Card className="disclosure-study-card" data-example-disclosure="">
      <Collapsible {...ctx.subject} defaultOpen>
        <CollapsibleTrigger>Recent deliveries</CollapsibleTrigger>
        <CollapsibleContent padded={false}>
          <TableScroll aria-label="Scroll recent deliveries">
            <Table aria-label="Recent deliveries" style={{ whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th scope="col">Destination</th>
                  <th scope="col">Result</th>
                  <th scope="col">
                    <bdi>Updated (UTC)</bdi>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Review queue</th>
                  <td>Delivered</td>
                  <td>
                    <bdi>09:04</bdi>
                  </td>
                </tr>
                <tr>
                  <th scope="row">Audit archive</th>
                  <td>Queued</td>
                  <td>
                    <bdi>09:07</bdi>
                  </td>
                </tr>
              </tbody>
            </Table>
          </TableScroll>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function OnOverlay({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="disclosure-study-narrow" data-example-disclosure="">
      <ExampleSurface surface={ctx.surface}>
        <Title as="h2" size="heading-s">
          Delivery report
        </Title>
        <Collapsible {...ctx.subject} size="s" defaultOpen>
          <CollapsibleTrigger>Retry attempts</CollapsibleTrigger>
          <CollapsibleContent>
            <bdi>Delivered on the second attempt at 09:04 UTC.</bdi>
          </CollapsibleContent>
        </Collapsible>
      </ExampleSurface>
    </div>
  );
}

export function DraftLifecycle({ ctx }: PreviewProps): ReactElement {
  const [open, setOpen] = useState(false);
  const mount = ctx.story?.controls.mount;
  return (
    <div className="disclosure-study-narrow" data-example-disclosure="">
      <Collapsible
        {...ctx.subject}
        open={open}
        lazyMount={mount === 'lazy'}
        unmountOnExit={mount === 'discard'}
        onOpenChange={(next) => {
          ctx.action('onOpenChange')(next);
          if (ctx.story?.controls.accept !== false) {
            setOpen(next);
          }
        }}
      >
        <CollapsibleTrigger>Delivery notes</CollapsibleTrigger>
        <CollapsibleContent>
          <Input aria-label="Delivery note" defaultValue="Notify the review queue" />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
