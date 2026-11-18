import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import { Button } from '../button/button.proto.js';
import { Card } from '../card/card.proto.js';
import { Code } from '../code/code.proto.js';
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

const previewUrl = 'https://preview.example.com/releases/2.4';

function ReleasePreview(): ReactElement {
  const [copyLabel, setCopyLabel] = useState('Copy link');

  useEffect(() => {
    if (copyLabel !== 'Copied') {
      return;
    }
    const reset = window.setTimeout(() => setCopyLabel('Copy link'), 2000);
    return () => window.clearTimeout(reset);
  }, [copyLabel]);

  async function copyLink(): Promise<void> {
    await navigator.clipboard.writeText(previewUrl);
    setCopyLabel('Copied');
  }

  return (
    <Card className="disclosure-study-preview">
      <Title as="h2" size="heading-s">
        Release preview
      </Title>
      <Accordion headingLevel={3} size="s" defaultValue={['access']}>
        <AccordionItem value="link">
          <AccordionTrigger
            action={
              <Button
                variant="ghost"
                tone="neutral"
                size="s"
                className="disclosure-study-copy"
                onClick={() => {
                  copyLink().catch(() => setCopyLabel('Retry copy'));
                }}
              >
                <span aria-live="polite">{copyLabel}</span>
              </Button>
            }
          >
            Preview link
          </AccordionTrigger>
          <AccordionContent>
            <div className="disclosure-study-link">
              <span>
                <Code plate={false}>{previewUrl}</Code>
              </span>
              <span>
                <bdi>Available until Friday at 18:00 UTC.</bdi>
              </span>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="access">
          <AccordionTrigger>Who can open it</AccordionTrigger>
          <AccordionContent>
            <span dir="auto">Anyone with the link can view this preview.</span>
          </AccordionContent>
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
      caption: 'Copy link works while the section is closed.',
      render: () => <ReleasePreview />,
    },
  ],
});
