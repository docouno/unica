import { Input } from '../../prototypes/input/input.proto.js';
import {
  size,
  variant,
  status,
  width,
  disabled,
  readOnly,
  required,
  clearable,
  loading,
  eventProp,
} from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
import {
  InputAnatomy,
  InputAvailability,
  InputFeedback,
  InputInteraction,
  InputLive,
  InputOverflow,
  InputRoles,
  InputSurfaces,
} from '../../prototypes/input/input.examples.js';

export default defineComponent({
  id: 'input',
  title: 'Input & FormField',
  category: 'Forms',
  status: 'Proto',
  summary:
    'Quiet form fields and inline editing, with stable slots, clear feedback, and native text interaction.',
  componentName: 'Input',
  form: 'wrap',
  props: {
    size,
    variant,
    status,
    width,
    disabled,
    readOnly,
    required,
    clearable,
    loading,
    placeholder: {
      kind: 'string',
      group: 'Content',
      default: '',
      description: 'Hint shown when the field is empty.',
    },
    onChange: eventProp('Reports the text after a native edit.', 'handleChange'),
  },
  constraints: [
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: ['status', 'loading'],
      reason: 'A disabled field suppresses feedback and pending visuals.',
    },
  ],
  render: ({ values, ctx }) => (
    <Input
      {...values}
      {...ctx.subject}
      id={ctx.id}
      name="workspace"
      label="Workspace name"
      defaultValue="Folio"
      onChange={(event) => ctx.action('onChange')(event.currentTarget.value)}
    />
  ),
  code: (_values, attributes) =>
    `<Input label="Workspace name" name="workspace" defaultValue="Folio"${attributes} />`,
  matrixViews: [
    {
      id: 'roles',
      rows: 'size',
      cols: 'variant',
      title: 'Field roles & sizes',
      caption:
        'Default defines a form slot. Ghost marks inline editing with a quiet baseline and transparent fill.',
      reference: () => <InputRoles />,
    },
  ],
  cases: [
    {
      id: 'anatomy',
      title: 'Anatomy & slot priority',
      caption:
        'Icon, prefix, value, suffix, Clear, status, spinner. Decorative trailing icons yield to feedback.',
      kind: 'behavior',
      render: () => <InputAnatomy />,
    },
    {
      id: 'interaction',
      title: 'Hover, focus & clear action',
      caption:
        'Compare pointer and keyboard focus, then try both live. End-slot examples compare icons and clear targets.',
      kind: 'behavior',
      render: () => <InputInteraction />,
    },
    {
      id: 'feedback',
      title: 'Validation & information',
      caption:
        'Feedback uses an edge, a glyph, and readable copy. Keyboard focus preserves the status hue; pointer focus stays quiet.',
      kind: 'behavior',
      render: () => <InputFeedback />,
    },
    {
      id: 'availability',
      title: 'Availability & overlapping states',
      caption:
        'Read-only preserves reading and selection. Disabled removes actions. Loading indicates work without forcing read-only.',
      kind: 'behavior',
      render: () => <InputAvailability />,
    },
    {
      id: 'live',
      title: 'Live editing & feedback transitions',
      caption:
        'An explicit response harness demonstrates checking, success, error, correction, and clearing.',
      kind: 'behavior',
      render: () => <InputLive />,
    },
    {
      id: 'overflow',
      title: 'Long content, naming & direction',
      caption:
        'Inspect at 360px and 120% text, then switch RTL. Text, affixes, labels, and messages have different overflow behavior.',
      kind: 'content',
      render: () => <InputOverflow />,
    },
    {
      id: 'surfaces',
      title: 'Base & overlay materials',
      caption:
        'The same fields on two real surfaces. These material plates are static, not open dialogs or popovers.',
      kind: 'surface',
      render: () => <InputSurfaces />,
    },
  ],
});
