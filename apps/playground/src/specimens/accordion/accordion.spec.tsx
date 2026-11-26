import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@docouno/unica';
import '../shared/disclosure.examples.css';
import { defineComponent } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { HeaderActions } from './accordion-actions.examples.js';
import actionsSource from './accordion-actions.examples.tsx?raw';
import { OpeningModes, OverlayAccess, TriggerStudy } from './accordion.examples.js';

const initialSections = {
  closed: [],
  fee: ['fee'],
  both: ['fee', 'tax'],
} as const;

export default defineComponent({
  id: 'accordion',
  title: 'Accordion',
  componentName: 'Accordion',
  category: 'Surfaces & Structure',
  status: 'UI',
  summary: 'Group related section headings and reveal their contents in place.',
  props: {
    headingLevel: {
      kind: 'slot',
      publicType: '2 | 3 | 4 | 5 | 6',
      group: 'Structure',
      default: '3',
      description: 'Set the native heading level for every section.',
      choices: [
        { value: '2', code: '2' },
        { value: '3', code: '3' },
        { value: '4', code: '4' },
        { value: '5', code: '5' },
        { value: '6', code: '6' },
      ],
    },
    value: {
      kind: 'slot',
      publicType: 'readonly string[]',
      group: 'Interaction',
      default: 'omitted',
      description: 'Hold the group at a controlled value. The example logs rejected proposals.',
      choices: [
        { value: 'omitted', label: 'Uncontrolled', omit: true },
        { value: 'closed', label: 'All closed', code: '[]' },
        { value: 'fee', label: 'First open', code: "['fee']" },
        { value: 'both', label: 'Both open', code: "['fee', 'tax']" },
      ],
    },
    lazyMount: {
      kind: 'boolean',
      group: 'Interaction',
      default: false,
      description: 'Mount each section body on its first open.',
    },
    unmountOnExit: {
      kind: 'boolean',
      group: 'Interaction',
      default: false,
      description: 'Remove each section body after its closing transition.',
    },
    size: {
      kind: 'enum',
      group: 'Geometry',
      default: 'm',
      description: 'Trigger and panel density.',
      choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    exclusive: {
      kind: 'boolean',
      group: 'Interaction',
      default: false,
      description: 'Keep at most one item expanded.',
    },
    dividers: {
      kind: 'boolean',
      group: 'Geometry',
      default: true,
      description: 'Draw separators between adjacent items.',
    },
    defaultValue: {
      kind: 'slot',
      publicType: 'readonly string[]',
      group: 'Interaction',
      default: 'closed',
      description:
        'Item values expanded when the group first appears. Changing this example setting starts a fresh group.',
      choices: [
        { value: 'closed', label: 'All closed', code: '[]' },
        { value: 'fee', label: 'First open', code: "['fee']" },
        { value: 'both', label: 'Both open', code: "['fee', 'tax']" },
      ],
    },
    onValueChange: {
      kind: 'action',
      publicType: '(value: readonly string[]) => void',
      group: 'Interaction',
      description: 'Receive the expanded item values when a user toggles a heading.',
      code: '(expanded) => console.log(expanded)',
    },
  },
  constraints: [
    ...(['closed', 'fee', 'both'] as const).map((value) => ({
      kind: 'precedence' as const,
      when: { value },
      affects: ['defaultValue'],
      reason: 'The controlled value determines the expanded sections.',
    })),
    {
      kind: 'precedence',
      when: { unmountOnExit: true },
      affects: ['lazyMount'],
      reason: 'Unmount on exit also waits for the first open before mounting.',
    },
    {
      kind: 'precedence',
      when: { exclusive: true },
      affects: [{ key: 'defaultValue', value: 'both' }],
      reason: 'An exclusive group starts with the first of the requested items expanded.',
    },
  ],
  render: withOverlaySurface(({ values, ctx }) => (
    <div
      className="accordion-study-host"
      data-example-disclosure=""
      data-matrix={ctx.tab === 'states' || undefined}
    >
      <Accordion
        key={`${values.value}-${values.defaultValue}`}
        {...ctx.subject}
        headingLevel={Number(values.headingLevel) as 2 | 3 | 4 | 5 | 6}
        value={values.value === 'omitted' ? undefined : initialSections[values.value]}
        lazyMount={values.lazyMount}
        unmountOnExit={values.unmountOnExit}
        size={values.size}
        exclusive={values.exclusive}
        dividers={values.dividers}
        defaultValue={initialSections[values.defaultValue]}
        onValueChange={ctx.action('onValueChange')}
      >
        <AccordionItem value="fee">
          <AccordionTrigger>Fee</AccordionTrigger>
          <AccordionContent>
            <bdi>£15</bdi>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="tax">
          <AccordionTrigger>Tax</AccordionTrigger>
          <AccordionContent>
            <bdi>£3</bdi>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )),
  code: (
    values,
  ) => `import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@docouno/unica';

<Accordion headingLevel={${values.headingLevel}}${values.size === 'm' ? '' : ` size="${values.size}"`}${values.exclusive ? ' exclusive' : ''}${values.dividers ? '' : ' dividers={false}'}${values.value === 'omitted' ? '' : ` value={${JSON.stringify(initialSections[values.value])}}`}${values.defaultValue === 'closed' ? '' : ` defaultValue={${JSON.stringify(initialSections[values.defaultValue])}}`}${values.lazyMount ? ' lazyMount' : ''}${values.unmountOnExit ? ' unmountOnExit' : ''} onValueChange={(expanded) => console.log(expanded)}>
  <AccordionItem value="fee">
    <AccordionTrigger>Fee</AccordionTrigger>
    <AccordionContent><bdi>£15</bdi></AccordionContent>
  </AccordionItem>
  <AccordionItem value="tax">
    <AccordionTrigger>Tax</AccordionTrigger>
    <AccordionContent><bdi>£3</bdi></AccordionContent>
  </AccordionItem>
</Accordion>`,
  states: [
    {
      id: 'sizes',
      title: 'Group sizes',
      rows: 'size',
      cols: 'defaultValue',
      caption: 'Compare trigger density with the same sections closed and expanded.',
    },
    {
      id: 'modes',
      title: 'Opening modes',
      rows: 'exclusive',
      cols: 'defaultValue',
      caption:
        'With two initial values, the exclusive group opens only the first section. Toggle the headings to change the selection.',
    },
    {
      id: 'dividers',
      title: 'Section dividers',
      rows: 'dividers',
      cols: 'size',
      fixed: { defaultValue: 'fee' },
      caption: 'The divider follows the open panel and separates it from the next heading.',
    },
  ],
  cases: [
    {
      id: 'opening-modes',
      title: 'Independent and exclusive sections',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Open Publish permissions in each group to compare replacement with independent expansion. Both groups allow every section to close.',
      render: withOverlaySurface(OpeningModes, 'border-box'),
    },
    {
      id: 'states',
      title: 'Focus and availability',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Tab through the available headings. In the exclusive group, opening Access history closes the previously expanded, unavailable section.',
      render: withOverlaySurface(TriggerStudy, 'border-box'),
    },
    {
      id: 'overlay',
      title: 'On a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      mode: 'live',
      caption:
        'The host panel provides the material. Expand either permission heading to inspect the rows against it.',
      render: OverlayAccess,
    },
  ],
  compositions: [
    {
      id: 'actions',
      title: 'Independent header actions',
      mode: 'live',
      caption:
        'Copy a link from a closed section, fold a reviewed file, or favorite a query while leaving its disclosure state intact.',
      code: actionsSource,
      render: withOverlaySurface(
        ({ ctx }) => <HeaderActions accordionProps={ctx.subject} />,
        'border-box',
      ),
    },
  ],
});
