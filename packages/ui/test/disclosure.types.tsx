import { createRef } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../src/index.js';
import type { AccordionProps, CollapsibleProps } from '../src/server.js';

const div = createRef<HTMLDivElement>();
const button = createRef<HTMLButtonElement>();
const group: AccordionProps = { headingLevel: 4, value: ['a'] as const, ref: div };
const section: CollapsibleProps = { open: undefined, lazyMount: true, ref: div };
export const accordion = (
  <Accordion {...group}>
    <AccordionItem ref={div} value="a">
      <AccordionTrigger ref={button} action={<button>Copy</button>}>
        A
      </AccordionTrigger>
      <AccordionContent ref={div} padded={false}>
        Details
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);
export const collapsible = (
  <Collapsible {...section}>
    <CollapsibleTrigger ref={button} asChild>
      <button>Open</button>
    </CollapsibleTrigger>
    <CollapsibleContent ref={div}>Details</CollapsibleContent>
  </Collapsible>
);

// @ts-expect-error Accordion values are collections of stable string keys.
export const scalar = <Accordion headingLevel={2} value="a" />;
// @ts-expect-error Accordion requires a native heading level from 2 to 6.
export const outline = <Accordion headingLevel={1} />;
// @ts-expect-error The content label depends on the generated AccordionTrigger ID.
export const replacedId = <AccordionTrigger id="custom" />;
// @ts-expect-error The panel owns inert and visibility.
export const inert = <CollapsibleContent inert />;
// @ts-expect-error Trigger buttons own their native commands.
export const invoker = <CollapsibleTrigger popoverTarget="other" />;
// @ts-expect-error The trigger host is a button.
export const ref = <CollapsibleTrigger ref={div} />;

// @ts-expect-error A composed disclosure Button does not accept toggle state on its wrapper.
export const toggleWrapper = <CollapsibleTrigger asChild defaultPressed={false} />;
