import { Button, Checkbox, CheckboxGroup, FormField, Input, Stack } from '@docouno/unica';
import {
  Anatomy,
  Availability,
  Feedback,
  Layouts,
  LiveValidation,
  Overflow,
  Overlay,
} from './form-field.examples.js';
import { size, status, disabled, required, choice, toggle, eventProp } from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { previewProps, previewText } from '../preview-code.js';
import { Groups } from './field-groups.js';
import groupsSource from './field-groups.tsx?raw';

const content = (description: string, initial = '') => ({
  kind: 'string' as const,
  group: 'Content',
  publicType: 'ReactNode',
  default: initial,
  description,
});

const axes = {
  size: 'm',
  target: 'control',
  status: 'neutral',
  disabled: false,
  readOnly: false,
  required: false,
  orientation: 'vertical',
  labelAlign: 'control',
  reserveMessage: false,
  feedbackIcon: true,
};

export default defineComponent({
  id: 'form-field',
  title: 'FormField',
  category: 'Forms',
  status: 'UI',
  summary:
    'Connect a control or group to its label, persistent instructions, and validation feedback.',
  componentName: 'FormField',
  form: 'wrap',
  props: {
    size,
    status,
    disabled,
    required,
    target: choice(
      'Structure',
      'Bind a single editor or a group of options.',
      ['control', 'group'],
      'control',
    ),
    readOnly: toggle('State', 'Keep the value available for inspection while locking edits.'),
    label: content('Visible field name.', 'Workspace'),
    optional: content('Supplementary text for a field that is optional.'),
    description: content('Persistent instructions.', 'Visible to members.'),
    message: content('Feedback associated with the current status.'),
    statusLabel: content('Override the default feedback copy for a non-neutral status.'),
    counter: content('An application-supplied count or limit.'),
    labelAction: content('Button text for an independent action beside the label.'),
    controlId: {
      kind: 'string',
      group: 'Structure',
      default: '',
      description: 'Explicit ID for the native control.',
    },
    labelId: {
      kind: 'string',
      group: 'Structure',
      default: '',
      description: 'Explicit ID for the label or group heading.',
    },
    orientation: choice(
      'Geometry',
      'Position the label above or beside the control when the container is wide enough.',
      ['vertical', 'horizontal'],
      'vertical',
    ),
    labelAlign: choice(
      'Geometry',
      'Align the first label line to a control, a text row, or the top of a group.',
      ['control', 'text', 'start'],
      'control',
    ),
    reserveMessage: toggle(
      'Geometry',
      'Reserve one line for feedback so nearby controls stay in place.',
    ),
    feedbackIcon: {
      ...toggle('Content', 'Allow the feedback row to present a glyph.'),
      default: true,
    },
    onChange: {
      ...eventProp(
        'Logs edits from the nested Input or choices from the CheckboxGroup.',
        '(event) => console.log(event.currentTarget.value)',
        'ChangeEventHandler<HTMLInputElement>',
      ),
      demo: true,
    },
    onLabelAction: {
      ...eventProp(
        'Logs activation of the example label action.',
        '() => console.log("Label action")',
        '() => void',
      ),
      demo: true,
    },
  },
  constraints: [
    {
      kind: 'ignored',
      when: { target: 'group' },
      affects: ['controlId'],
      reason: 'Each editor in a group keeps its own ID.',
    },
    {
      kind: 'ignored',
      when: { orientation: 'vertical' },
      affects: ['labelAlign'],
      reason: 'First-line alignment applies to horizontal layouts.',
    },
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: ['status', 'message', 'statusLabel', 'feedbackIcon'],
      reason: 'Disabling the field suppresses its validation feedback.',
    },
    {
      kind: 'precedence',
      when: { required: true },
      affects: ['optional'],
      reason: 'The required marker takes priority over optional copy.',
    },
  ],
  render: withOverlaySurface(({ values, ctx }) => {
    const { label, labelAction, controlId, labelId, message, ...layout } = values;
    const group = layout.target === 'group';
    const name = label.trim() ? label : '';
    return (
      <FormField
        {...layout}
        {...ctx.subject}
        data-form-field-sample={layout.orientation}
        label={name ? <bdi>{name}</bdi> : undefined}
        labelAction={
          labelAction ? (
            <Button
              size="s"
              type="button"
              variant="ghost"
              onClick={() => ctx.action('onLabelAction')()}
            >
              {labelAction}
            </Button>
          ) : undefined
        }
        controlId={!group && controlId ? `${ctx.id}-${controlId}` : undefined}
        labelId={labelId ? `${ctx.id}-${labelId}` : undefined}
        message={
          message ||
          (layout.status === 'danger' && !layout.statusLabel
            ? group
              ? 'Choose at least one access method.'
              : 'Use a name that identifies the workspace.'
            : undefined)
        }
      >
        {group ? (
          <CheckboxGroup
            name="access"
            aria-label={name ? undefined : 'Workspace access'}
            onValueChange={(value) => ctx.action('onChange')(value)}
          >
            <Checkbox value="internal" label="Workspace members" />
            <Checkbox value="external" label="Invited guests" />
          </CheckboxGroup>
        ) : (
          <Input
            name="workspace"
            defaultValue="Folio"
            aria-label={name ? undefined : 'Workspace'}
            onChange={(event) => ctx.action('onChange')(event.currentTarget.value)}
          />
        )}
      </FormField>
    );
  }, 'border-box'),
  code: ({
    label,
    description,
    optional,
    message,
    statusLabel,
    counter,
    labelAction,
    controlId,
    labelId,
    ...values
  }) => {
    const group = values.target === 'group';
    const fallback =
      values.status === 'danger' && !statusLabel
        ? group
          ? 'Choose at least one access method.'
          : 'Use a name that identifies the workspace.'
        : '';
    const field = previewProps(
      {
        ...values,
        controlId: group ? '' : controlId,
        labelId,
        label: label.trim() ? label : '',
        description,
        optional,
        message: message || fallback,
        statusLabel,
        counter,
      },
      {
        ...axes,
        controlId: '',
        labelId: '',
        label: '',
        description: '',
        optional: '',
        message: '',
        statusLabel: '',
        counter: '',
      },
    );
    const action = labelAction
      ? ` labelAction={<Button size="s" type="button" variant="ghost" onClick={() => console.log("Label action")}>${previewText(labelAction)}</Button>}`
      : '';
    const editor = group
      ? `<CheckboxGroup name="access"${label.trim() ? '' : ' aria-label="Workspace access"'}>
        <Checkbox value="internal" label="Workspace members" />
        <Checkbox value="external" label="Invited guests" />
      </CheckboxGroup>`
      : `<Input name="workspace" defaultValue="Folio"${label.trim() ? '' : ' aria-label="Workspace"'} />`;
    return `import { ${labelAction ? 'Button, ' : ''}${group ? 'Checkbox, CheckboxGroup, FormField' : 'FormField, Input'} } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function WorkspaceField() {
  return (
    <FormField${field}${action}>
      ${editor}
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
      controls: {
        groupIssue: { kind: 'boolean', label: 'Show overlapping review', default: false },
      },
      caption:
        'Open the label action and follow the address guidelines. Correct the end time, then toggle overlap to address the error to the group. Narrow labels stack while a URL keeps its writing direction.',
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
      id: 'delivery-access',
      title: 'Require at least one delivery method',
      mode: 'live',
      reset: true,
      caption:
        'Submit with no selection to check the shared rule, then choose one option and try again.',
      render: withOverlaySurface(
        ({ ctx }) => (
          <form {...ctx.form} onSubmit={(event) => event.preventDefault()}>
            <Stack gap={12} align="start">
              <FormField
                {...ctx.subject}
                target="group"
                label="Send updates"
                required
                description="Choose one or both."
              >
                <CheckboxGroup name="delivery" requiredMessage="Choose a delivery method.">
                  <Checkbox value="email" label="Email digest" />
                  <Checkbox value="in-app" label="In-app notifications" />
                </CheckboxGroup>
              </FormField>
              <Button type="submit">Save</Button>
            </Stack>
          </form>
        ),
        'border-box',
      ),
      code: `import { Checkbox, CheckboxGroup, FormField } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function DeliverySettings() {
  return (
    <form>
      <FormField target="group" label="Send updates" required description="Choose one or both.">
        <CheckboxGroup name="delivery" requiredMessage="Choose a delivery method.">
          <Checkbox value="email" label="Email digest" />
          <Checkbox value="in-app" label="In-app notifications" />
        </CheckboxGroup>
      </FormField>
      <button type="submit">Save</button>
    </form>
  );
}`,
    },
    {
      id: 'groups',
      title: 'Label binary groups and choice cards',
      mode: 'live',
      reset: true,
      caption:
        'Choose a delivery method to clear its error, change default access with the arrow keys, and toggle notifications or searchable sources.',
      render: withOverlaySurface(
        ({ ctx }) => (
          <div className="ff-example-stack">
            <Groups fieldProps={ctx.subject} />
          </div>
        ),
        'border-box',
      ),
      code: groupsSource,
    },
  ],
});
