import { useState } from 'react';
import { NumberInput } from '../../prototypes/number-input/number-input.proto.js';
import {
  size,
  variant,
  status,
  width,
  disabled,
  readOnly,
  required,
  loading,
  eventProp,
} from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
import {
  NumberAnatomy,
  NumberAvailability,
  NumberBounds,
  NumberFeedback,
  NumberInteraction,
  NumberLive,
  NumberOverflow,
  NumberRoles,
  NumberSurfaces,
} from '../../prototypes/number-input/number-input.examples.js';

export default defineComponent({
  id: 'number-input',
  title: 'NumberInput',
  category: 'Forms',
  status: 'Proto',
  summary:
    'A centered quantity between full-height decrease and increase actions. Keep the entered number and explain corrections clearly.',
  componentName: 'NumberInput',
  form: 'owned',
  props: {
    size,
    variant,
    status,
    width,
    disabled,
    readOnly,
    required,
    loading,
    suffix: {
      kind: 'string',
      group: 'Content',
      default: '',
      description: 'Unit displayed after the number.',
    },
    onValueChange: eventProp('Reports a number or an empty value.', 'handleValueChange'),
  },
  constraints: [
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: ['status', 'loading'],
      reason: 'A disabled field suppresses feedback and pending visuals.',
    },
  ],
  render: function NumberPreview({ values, ctx }) {
    const [revision, setRevision] = useState(0);
    return (
      <form {...ctx.form} onReset={() => setRevision((current) => current + 1)}>
        <NumberInput
          {...values}
          {...ctx.subject}
          key={revision}
          id={ctx.id}
          name="quota"
          label="Seat quota"
          defaultValue={25}
          min={0}
          max={100}
          onValueChange={ctx.action('onValueChange')}
        />
      </form>
    );
  },
  code: (_values, attributes) =>
    `<NumberInput label="Seat quota" name="quota" defaultValue={25} min={0} max={100}${attributes} />`,
  matrixViews: [
    {
      id: 'roles',
      rows: 'size',
      cols: 'variant',
      title: 'Field roles & sizes',
      caption:
        'S / M / L match Input. Ghost keeps a quiet baseline; both actions remain visible at rest.',
      reference: () => <NumberRoles />,
    },
  ],
  cases: [
    {
      id: 'anatomy',
      title: 'Units, slots & shared rhythm',
      caption:
        'Decrease, centered prefix/value/unit, feedback, increase. Symmetric feedback clearance keeps the amount centered.',
      kind: 'behavior',
      render: () => <NumberAnatomy />,
    },
    {
      id: 'interaction',
      title: 'Hover, press & focus',
      caption:
        'Comparisons pin appearance without moving DOM focus. The final example is live. Press changes only the active segment.',
      kind: 'behavior',
      render: () => <NumberInteraction />,
    },
    {
      id: 'feedback',
      title: 'Status & validation',
      caption:
        'An edge, one distinct glyph, and readable feedback. Actions remain neutral when the value needs correction.',
      kind: 'behavior',
      render: () => <NumberFeedback />,
    },
    {
      id: 'availability',
      title: 'Reading, availability & checking',
      caption:
        'Read-only preserves selection. Disabled suppresses feedback. Loading leaves editing available unless read-only is explicit.',
      kind: 'behavior',
      render: () => <NumberAvailability />,
    },
    {
      id: 'bounds',
      title: 'Limits, empty values & decimal steps',
      caption:
        'Live cases. Blur or Enter checks the draft without replacing it. Outward actions stop; the opposite direction offers a correction.',
      kind: 'behavior',
      render: () => <NumberBounds />,
    },
    {
      id: 'live',
      title: 'Checking, correction & inline properties',
      caption:
        'An explicit response harness and a small property inspector demonstrate state changes without copying an application screen.',
      kind: 'behavior',
      render: () => <NumberLive />,
    },
    {
      id: 'overflow',
      title: 'Content, width & direction',
      caption:
        'Inspect at 360px, 120% text, and RTL. Labels wrap, numbers keep a native editing viewport, short units stay outside the value.',
      kind: 'content',
      render: () => <NumberOverflow />,
    },
    {
      id: 'surfaces',
      title: 'Base & overlay materials',
      caption:
        'Identical controls on actual material plates. The overlay is static; it does not simulate popover behavior.',
      kind: 'surface',
      render: () => <NumberSurfaces />,
    },
  ],
});
