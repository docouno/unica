import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { previewProps, previewText } from '../preview-code.js';
import { OptionalBudget } from './optional-budget.js';
import budgetSource from './optional-budget.tsx?raw';
import { PortionEstimate } from './portion-estimate.js';
import portionSource from './portion-estimate.tsx?raw';
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

const messages = {
  neutral: '',
  info: 'Seats are counted per workspace.',
  success: 'The quota has been reviewed.',
  warning: 'Review the seat quota before saving.',
  danger: 'This quota needs approval.',
};

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
    status: {
      ...status,
      description: 'Feedback tone. Each non-neutral tone has a pinned example message.',
    },
    width,
    disabled,
    readOnly,
    required,
    loading,
    suffix: {
      kind: 'string',
      group: 'Content',
      default: '',
      description:
        'Unit shown after the number. The example also includes it in the accessible description.',
    },
    onValueChange: eventProp(
      'Receives the number after an edit or step, or an empty string when cleared.',
      '(value) => console.log(value)',
      "(value: number | '') => void",
    ),
  },
  constraints: [
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: ['status', 'loading'],
      reason: 'A disabled field suppresses feedback and pending visuals.',
    },
  ],
  render: withOverlaySurface(({ values, ctx }) => {
    const message = !values.disabled && messages[values.status];
    return (
      <form {...ctx.form} className="number-playground-form">
        <NumberInput
          {...values}
          {...ctx.subject}
          id={ctx.id}
          name="quota"
          label="Seat quota"
          defaultValue={25}
          min={0}
          max={100}
          description={
            values.suffix.trim() ? (
              <bdi>
                Unit: <bdi>{values.suffix}</bdi>
              </bdi>
            ) : undefined
          }
          message={message ? <bdi>{message}</bdi> : undefined}
          onValueChange={ctx.action('onValueChange')}
        />
      </form>
    );
  }, 'border-box'),
  code: (values) => {
    const attrs = previewProps(values, {
      size: 'm',
      variant: 'default',
      status: 'neutral',
      width: 'full',
      disabled: false,
      readOnly: false,
      required: false,
      loading: false,
      suffix: '',
    });
    const message = !values.disabled && messages[values.status];
    const unit = values.suffix.trim()
      ? ` description={<bdi>Unit: <bdi>${previewText(values.suffix)}</bdi></bdi>}`
      : '';
    return `import { NumberInput } from './prototypes/number-input/number-input.proto.js';
import '@docouno/unica/styles.css';

export function SeatQuota() {
  return <NumberInput label="Seat quota" name="quota" defaultValue={25} min={0} max={100}${attrs}${unit}${message ? ` message={<bdi>${previewText(message)}</bdi>}` : ''} onValueChange={(value) => console.log(value)} />;
}`;
  },
  states: [
    {
      id: 'roles',
      rows: 'size',
      cols: 'variant',
      title: 'Form and inline quantities',
      caption:
        'Compare the bordered field and the inline baseline at all three sizes. Each editor keeps an action at either edge.',
    },
  ],
  cases: [
    {
      id: 'optional-limits',
      title: 'Optional limits at every size',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Both roles start empty at all three sizes. The first increase sets a limit of one item. Clear the editor to remove the limit.',
      render: withOverlaySurface(NumberRoles, 'border-box'),
    },
    {
      id: 'anatomy',
      title: 'Units, intrinsic width and control rhythm',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Compare the centered amount, unit, and status slots, including intrinsic width with pending feedback. Each size shares a control height with Input and Button.',
      render: withOverlaySurface(NumberAnatomy, 'border-box'),
    },
    {
      id: 'interaction',
      title: 'Pointer, keyboard and held actions',
      caption:
        'Both columns pin pointer, press, and keyboard appearances. In the live field, use the arrow keys or hold either action to step repeatedly.',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      render: withOverlaySurface(NumberInteraction, 'border-box'),
    },
    {
      id: 'feedback',
      title: 'Validation and feedback',
      caption:
        'Compare five pinned tones in each role and the focus outline over a feedback edge. One glyph and its explanation identify each non-neutral status.',
      kind: 'behavior',
      mode: 'pinned',
      render: withOverlaySurface(NumberFeedback, 'border-box'),
    },
    {
      id: 'availability',
      title: 'Editing, reading and checking',
      caption:
        'Try editing or stepping during a pending check. Read-only keeps a selectable value and locks both actions. Disabled fields also suppress status and busy visuals.',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      render: withOverlaySurface(NumberAvailability, 'border-box'),
    },
    {
      id: 'bounds',
      title: 'Limits, empty values and decimal steps',
      caption:
        'Edit a value and press Enter or leave the field to check it. An inward step corrects an out-of-range value. In an empty positive or negative range, either action starts at the allowed value nearest zero.',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      render: withOverlaySurface(NumberBounds, 'border-box'),
    },
    {
      id: 'live',
      title: 'Check and correct a capacity request',
      caption:
        'Start the check, then confirm capacity or reduce it to eight workers. The response applies only to a checking field. Another edit clears it. The adjacent property editors use external labels and short units.',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      actions: [
        { id: 'check', label: 'Check limit' },
        { id: 'accept', label: 'Confirm capacity' },
        { id: 'capacity', label: 'Set capacity to 8' },
      ],
      render: withOverlaySurface(NumberLive, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Long quantities, units and direction',
      caption:
        'Follow a long number with the caret. In a narrow field the unit yields space first. Signed decimals keep their reading order when the surrounding actions mirror.',
      kind: 'content',
      mode: 'live',
      reset: true,
      render: withOverlaySurface(NumberOverflow, 'border-box'),
    },
    {
      id: 'surfaces',
      title: 'Quantities on base and overlay',
      caption:
        'Compare an ordinary interval, an inline percentage and a focused error on each material.',
      kind: 'surface',
      mode: 'pinned',
      compareSurfaces: true,
      render: NumberSurfaces,
    },
  ],
  compositions: [
    {
      id: 'portion-estimate',
      title: 'Scale a recipe',
      mode: 'live',
      reset: true,
      caption:
        'Change the number of portions to update the dry rice estimate. Empty, off-step and out-of-range values keep the draft and explain which quantities can be estimated.',
      render: withOverlaySurface(
        ({ ctx }) => (
          <div className="number-pairing">
            <PortionEstimate fieldProps={ctx.subject} />
          </div>
        ),
        'border-box',
      ),
      code: portionSource.replace('../../prototypes/', './prototypes/'),
    },
    {
      id: 'optional-budget',
      title: 'Save an optional spending limit',
      mode: 'live',
      reset: true,
      caption:
        'Save an empty field, zero, or a positive whole amount. The submitted value distinguishes an unlimited budget from a budget that allows no spending.',
      render: withOverlaySurface(
        ({ ctx }) => (
          <div className="number-pairing">
            <OptionalBudget fieldProps={ctx.subject} />
          </div>
        ),
        'border-box',
      ),
      code: budgetSource.replace('../../prototypes/', './prototypes/'),
    },
  ],
});
