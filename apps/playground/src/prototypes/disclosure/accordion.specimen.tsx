import type { ReactElement } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import { Checkbox, Switch } from '../binary-controls/binary-controls.proto.js';
import { Card } from '../card/card.proto.js';
import {
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
} from '../popover/popover.proto.js';
import { Text } from '../text/text.proto.js';
import { Title } from '../title/title.proto.js';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './disclosure.proto.js';
import './disclosure.examples.css';

function SizeStudy(): ReactElement {
  return (
    <div className="disclosure-study disclosure-study-grid" data-study="sizes">
      {(['s', 'm', 'l'] as const).map((size) => (
        <div className="disclosure-study-sample" key={size}>
          <Text className="disclosure-study-label" size="caption-l" color="muted">
            {size.toUpperCase()}
          </Text>
          <Accordion headingLevel={3} size={size} defaultValue={['scope']}>
            <AccordionItem value="scope">
              <AccordionTrigger>Access scope</AccordionTrigger>
              <AccordionContent>Workspace members.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="history">
              <AccordionTrigger>Access history</AccordionTrigger>
              <AccordionContent>Activity from the last 30 days.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      ))}
    </div>
  );
}

function AccessGroup({
  exclusive = false,
  dividers = true,
}: {
  readonly exclusive?: boolean;
  readonly dividers?: boolean;
}): ReactElement {
  return (
    <Accordion headingLevel={3} defaultValue={['review']} exclusive={exclusive} dividers={dividers}>
      <AccordionItem value="review">
        <AccordionTrigger>Review permissions</AccordionTrigger>
        <AccordionContent>Editors can leave review comments.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="publish">
        <AccordionTrigger>Publish permissions</AccordionTrigger>
        <AccordionContent>Owners can publish revisions.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function OpeningModes(): ReactElement {
  return (
    <div className="disclosure-study disclosure-study-grid">
      <div className="disclosure-study-sample">
        <Text className="disclosure-study-label" size="caption-l" color="muted">
          Several sections
        </Text>
        <AccessGroup />
      </div>
      <div className="disclosure-study-sample">
        <Text className="disclosure-study-label" size="caption-l" color="muted">
          One section at a time
        </Text>
        <AccessGroup exclusive />
      </div>
    </div>
  );
}

function TriggerStudy(): ReactElement {
  return (
    <div className="disclosure-study disclosure-study-grid">
      <div className="disclosure-study-sample">
        <Text className="disclosure-study-label" size="caption-l" color="muted">
          Keyboard focus
        </Text>
        <Accordion headingLevel={3}>
          <AccordionItem value="scope">
            <AccordionTrigger previewState="focus">Access scope</AccordionTrigger>
            <AccordionContent>Workspace members.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="history" disabled>
            <AccordionTrigger>Access history</AccordionTrigger>
            <AccordionContent>Activity from the last 30 days.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <div className="disclosure-study-sample">
        <Text className="disclosure-study-label" size="caption-l" color="muted">
          Unavailable item starts open
        </Text>
        <Accordion headingLevel={3} exclusive defaultValue={['scope']}>
          <AccordionItem value="scope" disabled>
            <AccordionTrigger>Access scope</AccordionTrigger>
            <AccordionContent>Workspace members.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="history">
            <AccordionTrigger>Access history</AccordionTrigger>
            <AccordionContent>Activity from the last 30 days.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

function Settings(): ReactElement {
  return (
    <Card className="disclosure-study-card">
      <Title as="h2" size="heading-s">
        Notifications
      </Title>
      <Accordion headingLevel={3} size="s" defaultValue={['digest']}>
        <AccordionItem value="digest">
          <AccordionTrigger action={<Switch size="s" aria-label="Weekly digest" defaultChecked />}>
            Weekly digest for subscribed workspace owners
          </AccordionTrigger>
          <AccordionContent>
            <Checkbox size="s" label="Include unresolved reviews" defaultChecked />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="activity">
          <AccordionTrigger action={<Switch size="s" aria-label="Activity alerts" />}>
            Activity alerts
          </AccordionTrigger>
          <AccordionContent>Send a notification when someone mentions you.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="deliveries">
          <AccordionTrigger>Delivery history</AccordionTrigger>
          <AccordionContent>Last digest sent on Monday at 09:00 UTC.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

function OnOverlay(): ReactElement {
  return (
    <PopoverContent role="presentation" className="disclosure-study-overlay">
      <PopoverHeader>
        <PopoverTitle as="h2">Workspace access</PopoverTitle>
      </PopoverHeader>
      <PopoverBody>
        <AccessGroup />
      </PopoverBody>
    </PopoverContent>
  );
}

export default defineSpecimen({
  id: 'accordion',
  title: 'Accordion',
  group: 'Structure',
  summary: 'Group related section headings and reveal their contents in place.',
  sections: [
    {
      id: 'sizes',
      title: 'Group sizes',
      kind: 'matrix',
      render: () => <SizeStudy />,
    },
    {
      id: 'modes',
      title: 'Opening modes',
      kind: 'matrix',
      caption: 'Both groups can close completely. The first also lets you compare open sections.',
      render: () => <OpeningModes />,
    },
    {
      id: 'states',
      title: 'Focus and availability',
      kind: 'states',
      caption:
        'The focus ring is pinned in the first group. Opening Access history in the exclusive group closes the unavailable item.',
      render: () => <TriggerStudy />,
    },
    {
      id: 'dividers',
      title: 'Without dividers',
      kind: 'matrix',
      render: () => (
        <div className="disclosure-study-narrow">
          <AccessGroup dividers={false} />
        </div>
      ),
    },
    {
      id: 'overlay',
      title: 'On a floating surface',
      kind: 'states',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'The host panel is a static material preview. The disclosure rows inside it are live.',
      render: () => <OnOverlay />,
    },
    {
      id: 'actions',
      title: 'Independent header actions',
      kind: 'context',
      caption:
        'Switches control notifications. Headings open details, with the same chevron column on every row.',
      render: () => <Settings />,
    },
  ],
});
