import { FormField } from '../../prototypes/form-field/form-field.proto.js';
import { useId } from 'react';
import type { ReactElement } from 'react';
import { defineComponent } from '../../workbench/types.js';
import { Button } from '../../prototypes/button/button.proto.js';
import { Card } from '../../prototypes/card/card.proto.js';
import { Checkbox, Input, Text } from '@docouno/unica';
import {
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
} from '../../prototypes/popover/popover.proto.js';
import { Table, TableScroll } from '../../prototypes/table/table.proto.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../prototypes/disclosure/disclosure.proto.js';
import '../../prototypes/disclosure/disclosure.examples.css';

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
  const id = useId();
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
            <FormField htmlFor={id} label="Reply-to address" size="s">
              <Input id={id} size="s" type="email" defaultValue="reviews@example.com" />
            </FormField>
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

export default defineComponent({
  id: 'collapsible',
  title: 'Collapsible',
  category: 'Surfaces & Structure',
  status: 'Proto',
  summary: 'Reveal one section inline with a disclosure row or an existing button.',
  props: {
    size: {
      kind: 'enum',
      group: 'Layout',
      default: 'm',
      description: 'Trigger and panel density.',
      choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    disabled: {
      kind: 'boolean',
      group: 'Behavior',
      default: false,
      description: 'Disable the disclosure trigger.',
    },
    defaultOpen: {
      kind: 'boolean',
      group: 'Behavior',
      default: false,
      description: 'Expand the panel when the example mounts.',
    },
    onOpenChange: {
      kind: 'action',
      group: 'Events',
      description: 'Reports whether the panel expands or collapses.',
      code: 'handleOpenChange',
    },
  },
  code: (
    values,
  ) => `<Collapsible${values.size === 'm' ? '' : ` size="${values.size}"`}${values.disabled ? ' disabled' : ''}${values.defaultOpen ? ' defaultOpen' : ''} onOpenChange={handleOpenChange}>
  <CollapsibleTrigger>Delivery details</CollapsibleTrigger>
  <CollapsibleContent>Shipping updates appear after dispatch.</CollapsibleContent>
</Collapsible>`,
  render: ({ values, ctx }) => (
    <Collapsible
      {...ctx.subject}
      key={String(values.defaultOpen)}
      size={values.size}
      disabled={values.disabled}
      defaultOpen={values.defaultOpen}
      onOpenChange={ctx.action('onOpenChange')}
    >
      <CollapsibleTrigger>Delivery details</CollapsibleTrigger>
      <CollapsibleContent>Shipping updates appear after dispatch.</CollapsibleContent>
    </Collapsible>
  ),
  matrixViews: [
    {
      id: 'sizes',
      title: 'Row sizes',
      rows: 'size',
      cols: 'defaultOpen',
      reference: () => <SizeStudy />,
    },
  ],
  cases: [
    {
      id: 'states',
      title: 'Trigger feedback',
      caption: 'Paint is pinned for comparison. The rows still toggle.',
      kind: 'behavior',
      render: () => <TriggerStates />,
    },
    {
      id: 'availability',
      title: 'Unavailable triggers',
      caption: 'The checkbox stays available when the open section’s trigger is disabled.',
      kind: 'behavior',
      render: () => <Availability />,
    },
    {
      id: 'wrapping',
      title: 'Long label in a narrow column',
      kind: 'content',
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
      kind: 'behavior',
      render: () => <FlushContent />,
    },
    {
      id: 'overlay',
      title: 'On a floating surface',
      surface: 'overlay',
      overlayStage: true,
      caption: 'The host panel is a static material preview. The disclosure inside it is live.',
      kind: 'surface',
      render: () => <OnOverlay />,
    },
  ],
  usage: [
    {
      id: 'custom',
      title: 'Existing button and a second trigger',
      caption: 'Edit the address, close from inside, then reopen to see the draft preserved.',
      code: `<Collapsible defaultOpen>
  <CollapsibleTrigger asChild><Button size="s">Delivery details</Button></CollapsibleTrigger>
  <CollapsibleContent padded={false}>
    <label htmlFor={replyId}>Reply-to address</label>
    <Input id={replyId} type="email" defaultValue="reviews@example.com" />
    <CollapsibleTrigger asChild><Button variant="ghost">Close details</Button></CollapsibleTrigger>
  </CollapsibleContent>
</Collapsible>`,
      render: () => <DeliveryDetails />,
    },
  ],
});
