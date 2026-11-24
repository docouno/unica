import { defineComponent } from '../../workbench/types.js';
import { size, disabled, readOnly, required, choice, toggle } from '../control-props.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { previewProps, previewText } from '../preview-code.js';
import {
  Availability,
  Interaction,
  MeasuredCheckbox,
  Overflow,
  Sizes,
  Validation,
} from './checkbox.examples.js';
import { ExportSelection } from './export-selection.js';
import exportSource from './export-selection.tsx?raw';

export default defineComponent({
  id: 'checkbox',
  title: 'Checkbox',
  category: 'Forms',
  status: 'UI',
  summary: 'Independent choices, partial selection, and group validation.',
  componentName: 'Checkbox',
  form: 'owned',
  props: {
    size,
    disabled,
    readOnly,
    required,
    status: choice(
      'Role',
      'Validation feedback for this choice.',
      ['neutral', 'danger'],
      'neutral',
    ),
    defaultChecked: toggle(
      'Interaction',
      'Start Product updates selected. Reset restores this initial value.',
      true,
    ),
    indeterminate: toggle(
      'Interaction',
      'Expose a mixed state. Native submission still follows the checked value.',
    ),
    description: {
      kind: 'string',
      group: 'Content',
      publicType: 'ReactNode',
      default: '',
      description: 'Persistent help associated with the native input.',
    },
    onCheckedChange: {
      kind: 'action',
      group: 'Interaction',
      publicType: '(next: boolean) => void',
      description: 'Reports the proposed checked value after activation.',
      code: '(checked) => console.log(checked)',
    },
  },
  constraints: [
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: [{ key: 'status', value: 'danger' }],
      reason: 'Disabled controls suppress invalid styling and semantics.',
    },
    {
      kind: 'precedence',
      when: { disabled: true },
      affects: [
        { key: 'readOnly', value: true },
        { key: 'required', value: true },
      ],
      reason: 'Disabled controls are excluded from focus, validation, and submission.',
    },
  ],
  render: withOverlaySurface(
    ({ values, ctx }) => (
      <form {...ctx.form}>
        <MeasuredCheckbox
          subject={ctx.subject}
          {...values}
          key={String(values.defaultChecked)}
          label="Product updates"
          name="subscriptions"
          value="updates"
          description={values.description || undefined}
          onCheckedChange={ctx.action('onCheckedChange')}
        />
      </form>
    ),
    'border-box',
  ),
  code: ({ description, ...values }) => {
    const attributes = previewProps(values, {
      size: 'm',
      status: 'neutral',
      disabled: false,
      readOnly: false,
      required: false,
      defaultChecked: false,
      indeterminate: false,
    });
    const help = description ? ` description={<bdi>${previewText(description)}</bdi>}` : '';
    return `import { Checkbox } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ProductUpdates() {
  return <Checkbox label="Product updates" name="subscriptions" value="updates"${attributes}${help} onCheckedChange={(checked) => console.log(checked)} />;
}`;
  },
  states: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'status',
      title: 'Size and validation',
      caption: 'Compare all three control heights with neutral and danger feedback.',
    },
    {
      id: 'selection',
      rows: 'defaultChecked',
      cols: 'indeterminate',
      title: 'Selection and mixed state',
      caption:
        'The mixed mark can accompany either submitted value. The checkmark shows when mixed is off and the value is selected.',
    },
  ],
  cases: [
    {
      id: 'size-marks',
      title: 'Selection marks at each size',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Read-only examples hold the empty square, checkmark, and mixed dash side by side at each size.',
      render: withOverlaySurface(Sizes, 'border-box'),
    },
    {
      id: 'interaction',
      title: 'Interaction states',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Tab to a checkbox or hold the pointer on its label. Space or a click changes that option and resolves a partial selection.',
      render: withOverlaySurface(Interaction, 'border-box'),
    },
    {
      id: 'availability',
      title: 'Read-only and disabled',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Tab through the read-only selections. Disabled choices leave the tab order. Both retain their values.',
      render: withOverlaySurface(Availability, 'border-box'),
    },
    {
      id: 'validation',
      title: 'Required group',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Check an empty selection to find the required-group error. Select a format and check again to confirm it.',
      render: withOverlaySurface(Validation, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Labels and density',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Long labels and descriptions wrap beside the square. Select the separately labelled option by clicking its text.',
      render: withOverlaySurface(Overflow, 'border-box'),
    },
    {
      id: 'surfaces',
      title: 'Base and overlay',
      kind: 'surface',
      mode: 'live',
      reset: true,
      compareSurfaces: true,
      caption:
        'Compare empty, selected, and mixed controls in the page and floating materials. Each group can be edited independently.',
      render: withOverlaySurface(Interaction, 'border-box'),
    },
  ],
  compositions: [
    {
      id: 'group',
      title: 'Groups and select all',
      mode: 'live',
      reset: true,
      caption:
        'A partial selection includes all available items on activation. Activate it again to clear them. Archived items and the separate metadata group keep their own values.',
      render: withOverlaySurface(
        ({ ctx }) => <ExportSelection groupProps={ctx.subject} />,
        'border-box',
      ),
      code: exportSource,
    },
  ],
});
