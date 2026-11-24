import { Text, Title } from '@docouno/unica';
import type { ReactElement } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../prototypes/disclosure/disclosure.proto.js';
import type { PreviewProps } from '../../workbench/types.js';

function AccessGroup({ exclusive = false }: { readonly exclusive?: boolean }): ReactElement {
  return (
    <Accordion headingLevel={3} defaultValue={['review']} exclusive={exclusive}>
      <AccordionItem value="review">
        <AccordionTrigger>Review permissions</AccordionTrigger>
        <AccordionContent>
          <bdi>Editors can leave review comments.</bdi>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="publish">
        <AccordionTrigger>Publish permissions</AccordionTrigger>
        <AccordionContent>
          <bdi>Owners can publish revisions.</bdi>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function OpeningModes(): ReactElement {
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

export function TriggerStudy(): ReactElement {
  return (
    <div className="disclosure-study disclosure-study-grid">
      <div className="disclosure-study-sample">
        <Text className="disclosure-study-label" size="caption-l" color="muted">
          Available and unavailable triggers
        </Text>
        <Accordion headingLevel={3}>
          <AccordionItem value="scope">
            <AccordionTrigger>Access scope</AccordionTrigger>
            <AccordionContent>
              <bdi>Workspace members.</bdi>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="history" disabled>
            <AccordionTrigger>Access history</AccordionTrigger>
            <AccordionContent>
              <bdi>Activity from the last 30 days.</bdi>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <div className="disclosure-study-sample">
        <Text className="disclosure-study-label" size="caption-l" color="muted">
          Initially open, unavailable trigger
        </Text>
        <Accordion headingLevel={3} exclusive defaultValue={['scope']}>
          <AccordionItem value="scope" disabled>
            <AccordionTrigger>Access scope</AccordionTrigger>
            <AccordionContent>
              <bdi>Workspace members.</bdi>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="history">
            <AccordionTrigger>Access history</AccordionTrigger>
            <AccordionContent>
              <bdi>Activity from the last 30 days.</bdi>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

export function OverlayAccess({ ctx }: PreviewProps): ReactElement {
  return (
    <div
      className={
        ctx.surface === 'overlay'
          ? 'unica-overlay-surface disclosure-study-overlay'
          : 'disclosure-study-overlay'
      }
      data-surface={ctx.surface}
    >
      <Title as="h2" size="heading-s">
        Workspace access
      </Title>
      <AccessGroup />
    </div>
  );
}
