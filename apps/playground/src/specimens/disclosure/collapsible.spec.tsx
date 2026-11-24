import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../prototypes/disclosure/disclosure.proto.js';
import '../../prototypes/disclosure/disclosure.examples.css';
import { defineComponent } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { DeliveryDetails } from './collapsible-delivery.examples.js';
import deliverySource from './collapsible-delivery.examples.tsx?raw';
import {
  Availability,
  FlushContent,
  OnOverlay,
  TriggerStates,
  Wrapping,
} from './collapsible.examples.js';

export default defineComponent({
  id: 'collapsible',
  title: 'Collapsible',
  componentName: 'Collapsible',
  category: 'Surfaces & Structure',
  status: 'Proto',
  summary: 'Reveal one section inline with a disclosure row or an existing button.',
  props: {
    size: {
      kind: 'enum',
      group: 'Geometry',
      default: 'm',
      description: 'Sets the density of the trigger and panel.',
      choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    disabled: {
      kind: 'boolean',
      group: 'Availability',
      default: false,
      description: 'Disables the trigger. Controls inside an open panel remain available.',
    },
    defaultOpen: {
      kind: 'boolean',
      group: 'Interaction',
      default: false,
      description:
        'Opens the panel on mount. Changing this example setting starts a fresh disclosure.',
    },
    onOpenChange: {
      kind: 'action',
      group: 'Interaction',
      publicType: '(open: boolean) => void',
      description: 'Optional callback for the next expanded state. The example logs each change.',
      code: '(open) => console.log(open)',
    },
  },
  code: (
    _values,
    attributes,
  ) => `import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './prototypes/disclosure/disclosure.proto.js';

<Collapsible${attributes}>
  <CollapsibleTrigger>Tax</CollapsibleTrigger>
  <CollapsibleContent><bdi>5%</bdi></CollapsibleContent>
</Collapsible>`,
  render: withOverlaySurface(({ values, ctx }) => (
    <div
      data-example-disclosure=""
      style={
        ctx.tab === 'states'
          ? { inlineSize: '13rem', maxInlineSize: '100%' }
          : { inlineSize: 'min(100%, 28rem)', minBlockSize: '5rem' }
      }
    >
      <Collapsible
        {...ctx.subject}
        key={String(values.defaultOpen)}
        size={values.size}
        disabled={values.disabled}
        defaultOpen={values.defaultOpen}
        onOpenChange={ctx.action('onOpenChange')}
      >
        <CollapsibleTrigger>Tax</CollapsibleTrigger>
        <CollapsibleContent>
          <bdi>5%</bdi>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )),
  states: [
    {
      id: 'sizes',
      title: 'Row sizes',
      rows: 'size',
      cols: 'defaultOpen',
      caption: 'Compare the trigger height and the alignment of its label with the expanded body.',
    },
  ],
  cases: [
    {
      id: 'states',
      title: 'Trigger feedback',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Hover, hold or focus either trigger, then activate it to compare the open and closed feedback.',
      render: withOverlaySurface(TriggerStates, 'border-box'),
    },
    {
      id: 'availability',
      title: 'Unavailable triggers',
      kind: 'behavior',
      mode: 'live',
      caption:
        'The reason stays visible beside the closed section. In the open section, the checkbox remains available.',
      render: withOverlaySurface(Availability, 'border-box'),
    },
    {
      id: 'wrapping',
      title: 'Long label in a narrow column',
      kind: 'content',
      mode: 'live',
      caption:
        'The service name can wrap across lines. The chevron stays aligned with the first line.',
      render: withOverlaySurface(Wrapping, 'border-box'),
    },
    {
      id: 'flush',
      title: 'Full-width content',
      kind: 'content',
      mode: 'live',
      caption:
        'The table fills the unpadded panel. In a narrow column, focus the table scroll area and use the arrow keys to see every column.',
      render: withOverlaySurface(FlushContent, 'border-box'),
    },
    {
      id: 'overlay',
      title: 'On a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      mode: 'live',
      caption:
        'The host supplies the surface. Toggle Retry attempts to inspect the delivery report against it.',
      render: OnOverlay,
    },
  ],
  compositions: [
    {
      id: 'custom',
      title: 'Existing button and a second trigger',
      mode: 'live',
      caption:
        'Edit the reply-to address and use Close details. Focus returns to Delivery details, and reopening restores the draft.',
      code: deliverySource.replaceAll('../../prototypes/', './prototypes/'),
      render: withOverlaySurface(
        () => (
          <div data-example-disclosure="" style={{ inlineSize: 'min(100%, 34rem)' }}>
            <DeliveryDetails />
          </div>
        ),
        'border-box',
      ),
    },
  ],
});
