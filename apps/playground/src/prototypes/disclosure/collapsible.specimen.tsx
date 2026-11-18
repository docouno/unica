import { useId } from 'react';
import type { ReactElement } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import { Checkbox } from '../binary-controls/binary-controls.proto.js';
import { Button } from '../button/button.proto.js';
import { Card } from '../card/card.proto.js';
import { Input } from '../input/input.proto.js';
import {
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
} from '../popover/popover.proto.js';
import { Table, TableScroll } from '../table/table.proto.js';
import { Text } from '../text/text.proto.js';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './disclosure.proto.js';
import './disclosure.examples.css';

function SizeStudy(): ReactElement {
  return (
    <div className="disclosure-study disclosure-study-grid" data-study="sizes">
      {(['s', 'm', 'l'] as const).map((size) => (
        <div className="disclosure-study-sample" key={size}>
          <Text className="disclosure-study-label" size="caption-l" color="muted">
            {size.toUpperCase()}
          </Text>
          <Collapsible size={size} defaultOpen>
            <CollapsibleTrigger>Delivery window</CollapsibleTrigger>
            <CollapsibleContent>09:00–17:00 UTC</CollapsibleContent>
          </Collapsible>
        </div>
      ))}
    </div>
  );
}

function TriggerStates(): ReactElement {
  return (
    <div className="disclosure-study disclosure-study-grid">
      {(
        [
          { state: 'rest', label: 'Rest', open: false },
          { state: 'hover', label: 'Hover', open: false },
          { state: 'active', label: 'Held press', open: true },
          { state: 'focus', label: 'Keyboard focus', open: true },
        ] as const
      ).map(({ state, label, open }) => (
        <div className="disclosure-study-sample" key={state}>
          <Text className="disclosure-study-label" size="caption-l" color="muted">
            {label}
          </Text>
          <Collapsible defaultOpen={open}>
            <CollapsibleTrigger previewState={state}>Delivery window</CollapsibleTrigger>
            <CollapsibleContent>Weekdays, 09:00–17:00 UTC.</CollapsibleContent>
          </Collapsible>
        </div>
      ))}
    </div>
  );
}

function Availability(): ReactElement {
  const reasonId = useId();
  return (
    <div className="disclosure-study disclosure-study-grid">
      <div className="disclosure-study-sample">
        <Text className="disclosure-study-label" size="caption-l" color="muted">
          Unavailable · closed
        </Text>
        <Collapsible disabled>
          <CollapsibleTrigger aria-describedby={reasonId}>Provider diagnostics</CollapsibleTrigger>
          <Text
            id={reasonId}
            className="disclosure-study-reason"
            size="caption-l"
            color="secondary"
          >
            Connect a provider to see diagnostics.
          </Text>
          <CollapsibleContent>Recent request failures and retry history.</CollapsibleContent>
        </Collapsible>
      </div>
      <div className="disclosure-study-sample">
        <Text className="disclosure-study-label" size="caption-l" color="muted">
          Unavailable · open
        </Text>
        <Collapsible defaultOpen disabled>
          <CollapsibleTrigger>Local diagnostics</CollapsibleTrigger>
          <CollapsibleContent>
            <Checkbox size="s" label="Include timestamps" defaultChecked />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

function FlushContent(): ReactElement {
  return (
    <Card className="disclosure-study-card">
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Recent deliveries</CollapsibleTrigger>
        <CollapsibleContent padded={false}>
          <TableScroll aria-label="Recent deliveries">
            <Table aria-label="Recent deliveries">
              <thead>
                <tr>
                  <th scope="col">Destination</th>
                  <th scope="col">Result</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Review queue</td>
                  <td>Delivered</td>
                </tr>
                <tr>
                  <td>Audit archive</td>
                  <td>Queued</td>
                </tr>
              </tbody>
            </Table>
          </TableScroll>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function DeliveryDetails(): ReactElement {
  return (
    <Card className="disclosure-study-card">
      <Text size="body-s" color="secondary">
        Send the digest to workspace owners every Monday.
      </Text>
      <Collapsible defaultOpen>
        <CollapsibleTrigger asChild>
          <Button variant="secondary" tone="neutral" size="s">
            Delivery details
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent padded={false}>
          <div className="disclosure-study-body">
            <Input
              label="Reply-to address"
              size="s"
              type="email"
              defaultValue="reviews@example.com"
            />
            <CollapsibleTrigger asChild>
              <Button className="disclosure-study-dismiss" variant="ghost" tone="neutral" size="s">
                Close details
              </Button>
            </CollapsibleTrigger>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function OnOverlay(): ReactElement {
  return (
    <PopoverContent role="presentation" className="disclosure-study-overlay">
      <PopoverHeader>
        <PopoverTitle>Delivery report</PopoverTitle>
      </PopoverHeader>
      <PopoverBody>
        <Collapsible size="s" defaultOpen>
          <CollapsibleTrigger>Retry attempts</CollapsibleTrigger>
          <CollapsibleContent>Delivered on the second attempt at 09:04 UTC.</CollapsibleContent>
        </Collapsible>
      </PopoverBody>
    </PopoverContent>
  );
}

export default defineSpecimen({
  id: 'collapsible',
  title: 'Collapsible',
  group: 'Structure',
  summary: 'Reveal one section inline with a disclosure row or an existing button.',
  sections: [
    {
      id: 'sizes',
      title: 'Row sizes',
      kind: 'matrix',
      render: () => <SizeStudy />,
    },
    {
      id: 'states',
      title: 'Trigger feedback',
      kind: 'states',
      caption: 'Paint is pinned for comparison. The rows still toggle.',
      render: () => <TriggerStates />,
    },
    {
      id: 'availability',
      title: 'Unavailable triggers',
      kind: 'states',
      caption: 'The checkbox stays available when the open section’s trigger is disabled.',
      render: () => <Availability />,
    },
    {
      id: 'wrapping',
      title: 'Long label in a narrow column',
      kind: 'states',
      render: () => (
        <div className="disclosure-study-narrow">
          <Collapsible size="s" defaultOpen>
            <CollapsibleTrigger>
              Delivery checks for regionalIncidentNotificationDeliveryService
            </CollapsibleTrigger>
            <CollapsibleContent>Retries stop after the third attempt.</CollapsibleContent>
          </Collapsible>
        </div>
      ),
    },
    {
      id: 'flush',
      title: 'Full-width content',
      kind: 'matrix',
      render: () => <FlushContent />,
    },
    {
      id: 'overlay',
      title: 'On a floating surface',
      kind: 'states',
      surface: 'overlay',
      overlayStage: true,
      caption: 'The host panel is a static material preview. The disclosure inside it is live.',
      render: () => <OnOverlay />,
    },
    {
      id: 'custom',
      title: 'Existing button and a second trigger',
      kind: 'context',
      caption: 'Edit the address, close from inside, then reopen to see the draft preserved.',
      render: () => <DeliveryDetails />,
    },
  ],
});
