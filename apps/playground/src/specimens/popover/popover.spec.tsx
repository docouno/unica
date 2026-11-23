import {
  Button,
  Input,
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Text,
} from '@docouno/unica';
import { useState } from 'react';
import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PreviewContext, PropSchema } from '../../workbench/types.js';
import {
  ContentExamples,
  DetailsExample,
  FormExamples,
  OverflowExamples,
  PlacementExamples,
  StateExamples,
} from './popover.examples.js';

const props = {
  size: {
    kind: 'enum',
    group: 'PopoverContent',
    default: 'm',
    description: 'Panel width ceiling and internal spacing.',
    choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
  },
  side: {
    kind: 'enum',
    group: 'PopoverContent',
    default: 'bottom',
    description: 'Preferred side of the trigger. Start and end follow the writing direction.',
    choices: [{ value: 'bottom' }, { value: 'top' }, { value: 'start' }, { value: 'end' }],
  },
  align: {
    kind: 'enum',
    group: 'PopoverContent',
    default: 'center',
    description: 'Alignment along the chosen side.',
    choices: [{ value: 'start' }, { value: 'center' }, { value: 'end' }],
  },
  open: {
    kind: 'enum',
    group: 'Popover',
    default: 'unset',
    description: 'Hold the controlled prop at this value. Check opening requests in Events.',
    choices: [
      { value: 'unset', label: 'Unset' },
      { value: 'true', label: 'True' },
      { value: 'false', label: 'False' },
    ],
  },
  defaultOpen: {
    kind: 'boolean',
    group: 'Popover',
    default: false,
    description: 'Open on the initial mount when open is unset. Changing it remounts this example.',
  },
  asChild: {
    kind: 'boolean',
    group: 'PopoverTrigger',
    default: true,
    description:
      'Compose the library Button as the trigger. Turn this off to inspect the native trigger.',
  },
  disabled: {
    kind: 'boolean',
    group: 'PopoverTrigger',
    default: false,
    description: 'Disable the trigger and make it unavailable as an anchor.',
  },
  'aria-label': {
    kind: 'enum',
    group: 'PopoverContent',
    default: '',
    description: 'Give the dialog an explicit accessible name.',
    choices: [{ value: '', label: 'Use the title' }, { value: 'Publication settings' }],
  },
  title: {
    kind: 'slot',
    group: 'PopoverTitle',
    default: 'show',
    description: 'Supply a heading or use an explicit accessible name.',
    choices: [
      { value: 'show', label: 'Show' },
      { value: 'hide', label: 'Omit' },
    ],
  },
  description: {
    kind: 'slot',
    group: 'PopoverDescription',
    default: 'show',
    description: 'Supply a short supporting description.',
    choices: [
      { value: 'show', label: 'Show' },
      { value: 'hide', label: 'Omit' },
    ],
  },
  onOpenChange: {
    kind: 'action',
    group: 'Popover',
    description: 'Report requests to open or close, and completed native dismissals.',
    code: 'handleOpenChange',
  },
} as const satisfies PropSchema;
type Values = ComponentValues<typeof props>;

const label = 'Page settings';
const description = 'Change the display name for this workspace.';

function OpenStateNote() {
  return (
    <Text size="caption-l" color="secondary">
      Open and defaultOpen can start the panel in a single-theme Playground.
    </Text>
  );
}

function Subject({ values, ctx }: { readonly values: Values; readonly ctx: PreviewContext }) {
  const [name, setName] = useState('Release notes');

  if (ctx.tab === 'matrix') {
    return (
      <Button
        {...ctx.subject}
        variant="secondary"
        inert
        aria-hidden="true"
        disabled={values.disabled}
      >
        {label}
      </Button>
    );
  }

  const controlled = !ctx.comparing && values.open !== 'unset';
  const initialOpen = !ctx.comparing && values.defaultOpen;
  const formId = `${ctx.id}-page-settings`;
  const trigger = values.asChild ? (
    <PopoverTrigger {...ctx.subject} asChild disabled={values.disabled}>
      <Button variant="secondary">{label}</Button>
    </PopoverTrigger>
  ) : (
    <PopoverTrigger {...ctx.subject} disabled={values.disabled}>
      {label}
    </PopoverTrigger>
  );

  return (
    <div className="popover-demo-stack">
      {ctx.comparing && (values.open !== 'unset' || values.defaultOpen) && <OpenStateNote />}
      <div className="popover-demo-actions">
        <Popover
          key={controlled ? 'controlled' : String(initialOpen)}
          open={controlled ? values.open === 'true' : undefined}
          defaultOpen={initialOpen}
          onOpenChange={ctx.action('onOpenChange')}
        >
          {trigger}
          <PopoverContent
            {...ctx.subject}
            size={values.size}
            side={values.side}
            align={values.align}
            aria-label={values['aria-label'] || undefined}
          >
            <PopoverHeader>
              {values.title === 'show' && <PopoverTitle>{label}</PopoverTitle>}
              <PopoverClose />
              {values.description === 'show' && (
                <PopoverDescription>
                  <bdi>{description}</bdi>
                </PopoverDescription>
              )}
            </PopoverHeader>
            <PopoverBody>
              <form
                {...ctx.form}
                id={formId}
                onSubmit={(event) => {
                  event.preventDefault();
                  const value = new FormData(event.currentTarget).get('name');
                  if (typeof value === 'string' && value.trim()) {
                    setName(value.trim());
                  }
                }}
              >
                <div className="popover-demo-field">
                  <Text as="label" htmlFor={`${formId}-name`} size="body-s" color="secondary">
                    Display name
                  </Text>
                  <Input id={`${formId}-name`} name="name" defaultValue={name} required />
                </div>
              </form>
            </PopoverBody>
            <PopoverFooter>
              <Button size="s" variant="secondary" type="reset" form={formId}>
                Reset name
              </Button>
              <Button size="s" type="submit" form={formId}>
                Save name
              </Button>
            </PopoverFooter>
          </PopoverContent>
        </Popover>
      </div>
      <Text size="body-s" color="secondary">
        Page name: {name}
      </Text>
    </div>
  );
}

function exampleCode(values: Values): string {
  const stateProps =
    (values.open === 'unset' ? '' : ` open={${values.open}}`) +
    (values.defaultOpen ? ' defaultOpen' : '');
  const trigger = values.asChild
    ? `<PopoverTrigger asChild${values.disabled ? ' disabled' : ''}>
    <Button variant="secondary">${label}</Button>
  </PopoverTrigger>`
    : `<PopoverTrigger${values.disabled ? ' disabled' : ''}>${label}</PopoverTrigger>`;
  const contentProps = [
    values.size === 'm' ? '' : ` size="${values.size}"`,
    values.side === 'bottom' ? '' : ` side="${values.side}"`,
    values.align === 'center' ? '' : ` align="${values.align}"`,
    values['aria-label'] ? ` aria-label="${values['aria-label']}"` : '',
  ].join('');
  const title = values.title === 'show' ? `\n      <PopoverTitle>${label}</PopoverTitle>` : '';
  const summary =
    values.description === 'show'
      ? `\n      <PopoverDescription><bdi>${description}</bdi></PopoverDescription>`
      : '';
  return `<Popover${stateProps} onOpenChange={handleOpenChange}>
  ${trigger}
  <PopoverContent${contentProps}>
    <PopoverHeader>${title}
      <PopoverClose />${summary}
    </PopoverHeader>
    <PopoverBody>
      <form id={formId} onSubmit={saveName}>
        <Text as="label" htmlFor={fieldId} size="body-s" color="secondary">Display name</Text>
        <Input id={fieldId} name="name" defaultValue={name} required />
      </form>
    </PopoverBody>
    <PopoverFooter>
      <Button size="s" variant="secondary" type="reset" form={formId}>Reset name</Button>
      <Button size="s" type="submit" form={formId}>Save name</Button>
    </PopoverFooter>
  </PopoverContent>
</Popover>`;
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
  matrixViews: [
    {
      id: 'sizes',
      title: 'Panel sizes',
      rows: 'size',
      caption:
        'The matrix shows closed triggers. Open a panel in the Playground or Cases to inspect its size.',
    },
    {
      id: 'placement',
      title: 'Preferred placement',
      rows: 'side',
      cols: 'align',
      caption: 'Open the Anchoring & focus case to try the twelve preferred positions.',
    },
  ],
  cases: [
    {
      id: 'placements',
      title: 'Anchoring & focus',
      caption:
        'Choose a position, then open the panel. Use Tab or the next focus stop to leave it.',
      kind: 'behavior',
      overlayStage: true,
      render: PlacementExamples,
    },
    {
      id: 'states',
      title: 'Immediate settings and availability',
      caption: 'Edit the display name and reopen the panel to check that your change persisted.',
      kind: 'behavior',
      overlayStage: true,
      render: StateExamples,
    },
    {
      id: 'content',
      title: 'Content states',
      caption: 'Choose an activity state before opening the panel. Retry restores the ready state.',
      kind: 'behavior',
      overlayStage: true,
      render: ContentExamples,
    },
    {
      id: 'overflow',
      title: 'Long content and body scrolling',
      caption:
        'Open the page history and scroll the entries while the title and footer stay in place.',
      kind: 'content',
      overlayStage: true,
      render: OverflowExamples,
    },
    {
      id: 'form',
      title: 'Edit, save, and retry',
      caption:
        'Submit a valid link, simulate a failed save, or dismiss the panel to discard your draft.',
      kind: 'behavior',
      overlayStage: true,
      render: FormExamples,
    },
  ],
  usage: [
    {
      id: 'details',
      title: 'Show release details',
      code: `import {
  Button, Popover, PopoverBody, PopoverClose, PopoverContent,
  PopoverHeader, PopoverTitle, PopoverTrigger,
} from '@docouno/unica';
import '@docouno/unica/styles.css';

<Popover>
  <PopoverTrigger asChild>
    <Button variant="secondary">Release details</Button>
  </PopoverTrigger>
  <PopoverContent size="s">
    <PopoverHeader>
      <PopoverTitle>Release details</PopoverTitle>
      <PopoverClose />
    </PopoverHeader>
    <PopoverBody>Published today for everyone in the workspace.</PopoverBody>
  </PopoverContent>
</Popover>`,
      render: DetailsExample,
    },
  ],
});
