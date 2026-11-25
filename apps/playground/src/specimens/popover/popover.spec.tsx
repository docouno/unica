import { Button, Popover, PopoverContent, PopoverTrigger } from '@docouno/unica';
import { placementAlignments, placementSides } from '../../examples/overlay-placement-options.js';
import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PreviewContext, PropSchema } from '../../workbench/types.js';
import {
  ContentExamples,
  FormExamples,
  OverflowExamples,
  PlacementExamples,
  StateExamples,
} from './popover.examples.js';
import { PageSettings } from './page-settings.js';
import settingsSource from './page-settings.tsx?raw';
import { ReleaseDetails } from './release-details.js';
import detailsSource from './release-details.tsx?raw';

const props = {
  size: {
    kind: 'enum',
    group: 'Geometry',
    default: 'm',
    description: 'Panel width ceiling and internal spacing.',
    choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
  },
  side: {
    kind: 'enum',
    group: 'Geometry',
    default: 'bottom',
    description: 'Preferred side of the trigger. Start and end follow the writing direction.',
    choices: [{ value: 'bottom' }, { value: 'top' }, { value: 'start' }, { value: 'end' }],
  },
  align: {
    kind: 'enum',
    group: 'Geometry',
    default: 'center',
    description: 'Alignment along the chosen side.',
    choices: [{ value: 'start' }, { value: 'center' }, { value: 'end' }],
  },
  open: {
    kind: 'enum',
    group: 'Interaction',
    default: 'unset',
    demo: true,
    description:
      'In a single-theme Playground, omit the boolean open prop or hold it at true or false. Events shows requests. Multiple themes start closed and open from their triggers.',
    choices: [
      { value: 'unset', label: 'Unset' },
      { value: 'true', label: 'True' },
      { value: 'false', label: 'False' },
    ],
  },
  defaultOpen: {
    kind: 'boolean',
    group: 'Interaction',
    default: false,
    description: 'Open on the initial mount when open is unset. Changing it remounts this example.',
  },
  asChild: {
    kind: 'boolean',
    group: 'Role',
    default: true,
    description:
      'This example sets asChild to true to compose Button. PopoverTrigger defaults to false and renders a native button.',
  },
  disabled: {
    kind: 'boolean',
    group: 'Availability',
    default: false,
    description: 'Disable the trigger and make it unavailable as an anchor.',
  },
  'aria-label': {
    kind: 'enum',
    group: 'Semantics',
    default: '',
    description: 'Give the dialog an explicit accessible name.',
    publicType: 'string',
    choices: [{ value: '', label: 'Use the title', omit: true }, { value: 'Publication settings' }],
  },
  title: {
    kind: 'enum',
    demo: true,
    group: 'Content',
    default: 'show',
    description:
      'Show PopoverTitle or omit that part when an explicit accessible name is supplied.',
    choices: [
      { value: 'show', label: 'Show' },
      { value: 'hide', label: 'Omit' },
    ],
  },
  description: {
    kind: 'enum',
    demo: true,
    group: 'Content',
    default: 'show',
    description: 'Show or omit the optional PopoverDescription part.',
    choices: [
      { value: 'show', label: 'Show' },
      { value: 'hide', label: 'Omit' },
    ],
  },
  onOpenChange: {
    kind: 'action',
    group: 'Interaction',
    description: 'Report requests to open or close, and completed native dismissals.',
    code: '(open) => console.log(open)',
    publicType: '(open: boolean) => void',
  },
} as const satisfies PropSchema;
type Values = ComponentValues<typeof props>;

const editableSettings = settingsSource.replace(
  'export function PageSettings',
  'function PageSettings',
);

function contentProps(values: Values) {
  return {
    size: values.size,
    side: values.side,
    align: values.align,
    ...(values['aria-label'] ? { 'aria-label': values['aria-label'] } : {}),
  };
}

function Subject({ values, ctx }: { readonly values: Values; readonly ctx: PreviewContext }) {
  if (ctx.tab === 'states') {
    return (
      <Popover open={false}>
        {values.asChild ? (
          <PopoverTrigger
            {...ctx.subject}
            asChild
            disabled={values.disabled}
            inert
            aria-hidden="true"
          >
            <Button variant="secondary">Page settings</Button>
          </PopoverTrigger>
        ) : (
          <PopoverTrigger {...ctx.subject} disabled={values.disabled} inert aria-hidden="true">
            Page settings
          </PopoverTrigger>
        )}
        <PopoverContent aria-label="Page settings" />
      </Popover>
    );
  }
  const controlled = !ctx.comparing && values.open !== 'unset';
  const initialOpen = !ctx.comparing && values.defaultOpen;
  return (
    <PageSettings
      mountKey={controlled ? 'controlled' : String(initialOpen)}
      rootProps={{
        ...(controlled ? { open: values.open === 'true' } : { defaultOpen: initialOpen }),
        onOpenChange: ctx.action('onOpenChange'),
      }}
      contentProps={contentProps(values)}
      asChild={values.asChild}
      disabled={values.disabled}
      showTitle={values.title === 'show'}
      showDescription={values.description === 'show'}
      subject={ctx.subject}
      formProps={ctx.form}
    />
  );
}

function exampleCode(values: Values): string {
  const controls = {
    rootProps:
      values.open === 'unset'
        ? { defaultOpen: values.defaultOpen }
        : { open: values.open === 'true' },
    contentProps: contentProps(values),
    asChild: values.asChild,
    disabled: values.disabled,
    showTitle: values.title === 'show',
    showDescription: values.description === 'show',
  };
  return `${editableSettings}

export function EditPageName() {
  return <PageSettings {...${JSON.stringify(controls)}} />;
}`;
}

export default defineComponent({
  id: 'popover',
  title: 'Popover',
  category: 'Overlays',
  status: 'UI',
  summary: 'A non-modal panel for nearby information, immediate settings, or a short form.',
  form: 'inline',
  props,
  constraints: [
    {
      kind: 'precedence',
      when: { open: 'true' },
      affects: [{ key: 'defaultOpen', value: true }],
      reason: 'The controlled open prop determines the initial state.',
    },
    {
      kind: 'precedence',
      when: { open: 'false' },
      affects: [{ key: 'defaultOpen', value: true }],
      reason: 'The controlled open prop determines the initial state.',
    },
    {
      kind: 'precedence',
      when: { 'aria-label': 'Publication settings' },
      affects: [{ key: 'title', value: 'show' }],
      reason:
        'The explicit aria-label supplies the accessible name while the heading stays visible.',
    },
    {
      kind: 'forbidden',
      when: { 'aria-label': '' },
      affects: [{ key: 'title', value: 'hide' }],
      reason: 'Give the dialog an accessible name through its title or aria-label.',
    },
  ],
  code: exampleCode,
  render: Subject,
  states: [
    {
      id: 'sizes',
      title: 'Panel sizes',
      rows: 'size',
      caption:
        'These triggers stay closed. Choose S, M or L in Playground and open Page settings to inspect the panel size.',
    },
    {
      id: 'placement',
      title: 'Preferred placement',
      rows: 'side',
      cols: 'align',
      caption:
        'These triggers stay closed. In Anchoring and focus, choose a side and alignment, then open the panel to compare all twelve placements.',
    },
  ],
  cases: [
    {
      id: 'placements',
      title: 'Anchoring and focus',
      surface: 'overlay',
      caption:
        'Move the source and open Page settings to compare its preferred side with the space available. Escape returns to the trigger. Tab from Display name closes the panel and continues to Page note.',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      controls: {
        side: { kind: 'enum', label: 'Side', default: 'bottom', choices: placementSides },
        align: {
          kind: 'enum',
          label: 'Alignment',
          default: 'center',
          choices: placementAlignments,
        },
        anchor: {
          kind: 'enum',
          label: 'Anchor',
          default: 'center',
          choices: [
            { value: 'center', label: 'Center' },
            { value: 'top-start', label: 'Top start' },
            { value: 'bottom-end', label: 'Bottom end' },
          ],
        },
      },
      render: PlacementExamples,
    },
    {
      id: 'states',
      title: 'Immediate settings and availability',
      surface: 'overlay',
      caption: 'Edit the display name and reopen the panel to check that your change persisted.',
      kind: 'behavior',
      overlayStage: true,
      mode: 'live',
      reset: true,
      render: StateExamples,
    },
    {
      id: 'content',
      title: 'Content states',
      caption:
        'Choose an activity state before opening the panel. After a failed load, Try again shows the recent updates.',
      kind: 'behavior',
      overlayStage: true,
      mode: 'live',
      reset: true,
      controls: {
        activity: {
          kind: 'enum',
          label: 'Activity state',
          default: 'ready',
          choices: [
            { value: 'ready', label: 'Ready' },
            { value: 'loading', label: 'Loading' },
            { value: 'empty', label: 'Empty' },
            { value: 'error', label: 'Load failed' },
          ],
        },
      },
      render: ContentExamples,
    },
    {
      id: 'overflow',
      title: 'Long content and body scrolling',
      caption:
        'Open Long text to inspect a wrapped address, or View history to scroll six revisions with the title and footer in view.',
      kind: 'content',
      overlayStage: true,
      mode: 'live',
      reset: true,
      render: OverflowExamples,
    },
    {
      id: 'form',
      title: 'Edit, save, and retry',
      surface: 'overlay',
      caption:
        'Fail the next save applies to one valid submission. Try again saves the retained draft. Cancel or dismiss the panel to discard uncommitted edits.',
      kind: 'behavior',
      overlayStage: true,
      mode: 'live',
      reset: true,
      controls: { failNext: { kind: 'boolean', label: 'Fail the next save', default: false } },
      render: FormExamples,
    },
  ],
  compositions: [
    {
      id: 'details',
      title: 'Show release details',
      mode: 'live',
      reset: true,
      caption:
        'Open the release details for the publication time and audience. Close or Escape returns to its trigger.',
      code: detailsSource,
      render: ({ ctx }) => <ReleaseDetails subject={ctx.subject} />,
    },
  ],
});
