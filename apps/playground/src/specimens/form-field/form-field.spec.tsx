import { previewProps } from '../preview-code.js';
import { FormField } from '../../prototypes/form-field/form-field.proto.js';
import { Input } from '@docouno/unica';
import { size, status, disabled, required, choice, toggle, eventProp } from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
import {
  Anatomy,
  Availability,
  Feedback,
  Groups,
  Layouts,
  LiveValidation,
  Overflow,
  Overlay,
} from '../../prototypes/form-field/form-field.examples.js';

export default defineComponent({
  id: 'form-field',
  title: 'FormField',
  category: 'Forms',
  status: 'Proto',
  summary: 'Clear labels, persistent instructions, and considered feedback for fields and groups.',
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
      default: 'Workspace',
      description: 'Name attached to the native child control.',
    },
    orientation: choice(
      'Geometry',
      'Position the label above or beside the control.',
      ['vertical', 'horizontal'],
      'vertical',
    ),
    reserveMessage: toggle('Field', 'Keep a line available for feedback.'),
    onChange: { ...eventProp('Reports edits from the nested input.', 'handleChange'), demo: true },
  },
  render: ({ values, ctx }) => {
    const { size, disabled, required, ...layout } = values;
    return (
      <FormField
        {...layout}
        {...ctx.subject}
        htmlFor={ctx.id}
        size={size}
        disabled={disabled}
        required={required}
        description="Visible to members."
        descriptionId={`${ctx.id}-description`}
        messageId={values.status === 'neutral' || disabled ? undefined : `${ctx.id}-message`}
        feedbackIcon={false}
        message={
          values.status === 'danger' ? 'Use a name that identifies the workspace.' : undefined
        }
      >
        <Input
          id={ctx.id}
          name="workspace"
          defaultValue="Folio"
          size={size}
          disabled={disabled}
          required={required}
          status={values.status}
          aria-describedby={`${ctx.id}-description${values.status === 'neutral' || disabled ? '' : ` ${ctx.id}-message`}`}
          onChange={(event) => ctx.action('onChange')(event.currentTarget.value)}
        />
      </FormField>
    );
  },
  code: ({ size, status, disabled, required, label }, attributes) => {
    const fieldLabel = label === 'Workspace' ? ' label="Workspace"' : '';
    const message =
      status === 'danger' ? ' message="Use a name that identifies the workspace."' : '';
    const inputAttributes = previewProps(
      { size, disabled, required, status },
      { size: 'm', disabled: false, required: false, status: 'neutral' },
    );
    const feedbackId = status === 'neutral' || disabled ? '' : ' workspace-message';
    return `<FormField htmlFor="workspace"${fieldLabel} description="Visible to members." descriptionId="workspace-description" messageId="workspace-message" feedbackIcon={false}${message}${attributes}>
  <Input id="workspace" name="workspace" defaultValue="Folio" aria-describedby="workspace-description${feedbackId}"${inputAttributes} onChange={handleChange} />
</FormField>`;
  },
  matrixViews: [
    {
      id: 'layout',
      rows: 'orientation',
      cols: 'size',
      title: 'Vertical, horizontal & sizes',
      reference: () => <Layouts />,
    },
  ],
  cases: [
    {
      id: 'anatomy',
      title: 'Labels, actions & supporting content',
      kind: 'behavior',
      render: () => <Anatomy />,
    },
    {
      id: 'feedback',
      title: 'Status & message ownership',
      kind: 'behavior',
      render: () => <Feedback />,
    },
    {
      id: 'availability',
      title: 'Availability & focus',
      kind: 'behavior',
      render: () => <Availability />,
    },
    {
      id: 'live',
      title: 'Validation, correction & reset',
      kind: 'behavior',
      render: () => <LiveValidation />,
    },
    {
      id: 'overflow',
      title: 'Long content, composite fields & RTL',
      kind: 'content',
      render: () => <Overflow />,
    },
    {
      id: 'overlay',
      title: 'Inside a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => <Overlay />,
    },
  ],
  usage: [
    {
      id: 'groups',
      title: 'Binary groups & choice cards',
      code: `<FormField target="group" label="Default access" labelId="access-label">
  <RadioGroup aria-labelledby="access-label" defaultValue="read">
    <Radio value="read" label="Can view" />
    <Radio value="edit" label="Can edit" />
  </RadioGroup>
</FormField>`,
      render: () => <Groups />,
    },
  ],
});
