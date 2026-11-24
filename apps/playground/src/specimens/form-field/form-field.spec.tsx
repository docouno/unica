import { Input } from '@docouno/unica';
import { FormField } from '../../prototypes/form-field/form-field.proto.js';
import {
  Anatomy,
  Availability,
  Feedback,
  Layouts,
  LiveValidation,
  Overflow,
  Overlay,
} from '../../prototypes/form-field/form-field.examples.js';
import { size, status, disabled, required, choice, toggle, eventProp } from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { previewProps, previewText } from '../preview-code.js';
import { Groups } from './field-groups.js';
import groupsSource from './field-groups.tsx?raw';

export default defineComponent({
  id: 'form-field',
  title: 'FormField',
  category: 'Forms',
  status: 'Proto',
  summary:
    'Connect a control or group to its label, persistent instructions, and validation feedback.',
  componentName: 'FormField',
  form: 'wrap',
  props: {
    size,
    status,
    disabled,
    required,
    label: {
      kind: 'string',
      group: 'Content',
      publicType: 'ReactNode',
      default: 'Workspace',
      description:
        'Visible name of the nested input. An empty label uses an accessible name in this example.',
    },
    orientation: choice(
      'Geometry',
      'Position the label above or beside the control when the container is wide enough.',
      ['vertical', 'horizontal'],
      'vertical',
    ),
    reserveMessage: toggle(
      'Geometry',
      'Reserve one line for feedback so nearby controls stay in place.',
    ),
    onChange: {
      ...eventProp(
        'Receives the nested Input change event. The event log displays its new value.',
        '(event) => console.log(event.currentTarget.value)',
        'ChangeEventHandler<HTMLInputElement>',
      ),
      demo: true,
    },
  },
  render: withOverlaySurface(({ values: { label, ...layout }, ctx }) => {
    const showFeedback = layout.status !== 'neutral' && !layout.disabled;
    const name = label.trim() ? label : '';
    return (
      <FormField
        {...layout}
        {...ctx.subject}
        data-form-field-sample=""
        label={name ? <bdi>{name}</bdi> : undefined}
        htmlFor={ctx.id}
        description={<bdi>Visible to members.</bdi>}
        descriptionId={`${ctx.id}-description`}
        messageId={showFeedback ? `${ctx.id}-message` : undefined}
        feedbackIcon={false}
        message={
          layout.status === 'danger' ? (
            <bdi>Use a name that identifies the workspace.</bdi>
          ) : undefined
        }
      >
        <Input
          id={ctx.id}
          name="workspace"
          defaultValue="Folio"
          size={layout.size}
          disabled={layout.disabled}
          required={layout.required}
          status={layout.status}
          aria-label={name ? undefined : 'Workspace'}
          aria-describedby={`${ctx.id}-description${showFeedback ? ` ${ctx.id}-message` : ''}`}
          onChange={(event) => ctx.action('onChange')(event.currentTarget.value)}
        />
      </FormField>
    );
  }, 'border-box'),
  code: ({ label, ...values }) => {
    const field = previewProps(values, {
      size: 'm',
      status: 'neutral',
      disabled: false,
      required: false,
      orientation: 'vertical',
      reserveMessage: false,
    });
    const control = previewProps(
      {
        size: values.size,
        status: values.status,
        disabled: values.disabled,
        required: values.required,
      },
      { size: 'm', status: 'neutral', disabled: false, required: false },
    );
    const message =
      values.status === 'danger'
        ? ' message={<bdi>Use a name that identifies the workspace.</bdi>}'
        : '';
    const feedback = values.status !== 'neutral' && !values.disabled;
    const name = label.trim() ? ` label={<bdi>${previewText(label)}</bdi>}` : '';
    return `import { useId } from 'react';
import { Input } from '@docouno/unica';
import { FormField } from './prototypes/form-field/form-field.proto.js';
import '@docouno/unica/styles.css';

export function WorkspaceField() {
  const id = useId();
  const descriptionId = id + '-description';${feedback ? "\n  const messageId = id + '-message';" : ''}
  return (
    <FormField htmlFor={id}${name}${field} description={<bdi>Visible to members.</bdi>} descriptionId={descriptionId}${feedback ? ' messageId={messageId}' : ''} feedbackIcon={false}${message}>
      <Input id={id} name="workspace" defaultValue="Folio"${control}${name ? '' : ' aria-label="Workspace"'} aria-describedby={${feedback ? "descriptionId + ' ' + messageId" : 'descriptionId'}} onChange={(event) => console.log(event.currentTarget.value)} />
    </FormField>
  );
}`;
  },
  states: [
    {
      id: 'layout',
      rows: 'size',
      cols: 'orientation',
      title: 'Label position and field size',
      caption:
        'Compare single-line fields in both orientations at three sizes. The side-by-side label needs at least 30rem of field width.',
    },
  ],
  cases: [
    {
      id: 'paired-layouts',
      title: 'Adjacent fields and container width',
      kind: 'content',
      mode: 'pinned',
      caption:
        'At each size, compare a required vertical field with two adjacent horizontal fields. Their labels share a column above 30rem and stack in narrow containers. The last row uses an inline editor.',
      render: withOverlaySurface(Layouts, 'border-box'),
    },
    {
      id: 'anatomy',
      title: 'Labels, actions and supporting content',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Reveal the invitation hint without moving focus into the access code. Compare a multiline field and a custom layout using the individual label and support parts.',
      render: withOverlaySurface(Anatomy, 'border-box'),
    },
    {
      id: 'feedback',
      title: 'Status and feedback ownership',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'The text field owns its status glyph. The group shows one glyph beside its message. Compare all five pinned tones and the fallback text when no message is supplied.',
      render: withOverlaySurface(Feedback, 'border-box'),
    },
    {
      id: 'availability',
      title: 'Availability and keyboard focus',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Compare a selectable read-only value, an unavailable field with a reason, and a pending check. Tab to each enabled field to inspect keyboard focus.',
      render: withOverlaySurface(Availability, 'border-box'),
    },
    {
      id: 'live',
      title: 'Validate and correct a form',
      kind: 'behavior',
      mode: 'live',
      controls: {
        reserve: { kind: 'boolean', label: 'Reserve a line for feedback', default: false },
      },
      reset: true,
      caption:
        'Submit an empty form, correct the focused field, and choose a delivery method. Persistent instructions stay visible during correction. The native Reset action clears this form.',
      render: withOverlaySurface(LiveValidation, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Long labels, directions and time ranges',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Open the long label action and follow the address guidelines. Edit either time boundary to check their order. Narrow fields stack their labels while a structured URL keeps its writing direction.',
      render: withOverlaySurface(Overflow, 'border-box'),
    },
    {
      id: 'overlay',
      title: 'Fields on a floating surface',
      kind: 'surface',
      mode: 'live',
      surface: 'overlay',
      overlayStage: true,
      controls: { feedback: { kind: 'boolean', label: 'Show validation feedback', default: true } },
      reset: true,
      caption:
        'Compare labels and support on a panel with a shared material. Toggle the pinned email error while the group remains available.',
      render: Overlay,
    },
  ],
  compositions: [
    {
      id: 'groups',
      title: 'Label binary groups and choice cards',
      mode: 'live',
      reset: true,
      caption:
        'Each heading names its group. Choose a delivery method to clear its error, change the default access with the arrow keys, and toggle notifications and searchable sources independently.',
      render: withOverlaySurface(
        ({ ctx }) => (
          <div className="ff-example-stack">
            <Groups fieldProps={ctx.subject} />
          </div>
        ),
        'border-box',
      ),
      code: groupsSource.replaceAll('../../prototypes/', './prototypes/'),
    },
  ],
});
