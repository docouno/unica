import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { previewProps, previewText } from '../preview-code.js';
import { OptionalBudget } from './optional-budget.js';
import budgetSource from './optional-budget.tsx?raw';
import { PortionEstimate } from './portion-estimate.js';
import portionSource from './portion-estimate.tsx?raw';
import { NumberField } from './number-field.js';
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
} from './number-input.examples.js';

const messages = {
  neutral: '',
  info: 'Seats are counted per workspace.',
  success: 'The quota has been reviewed.',
  warning: 'Review the seat quota before saving.',
  danger: 'This quota needs approval.',
};

function numericProp(description: string, initial: string, publicType = 'number') {
  return { kind: 'string' as const, group: 'Value', default: initial, description, publicType };
}

function textProp(description: string, initial = '') {
  return { kind: 'string' as const, group: 'Content', default: initial, description };
}

function readNumber(text: string): number | undefined {
  const value = Number(text);
  return text.trim() && Number.isFinite(value) ? value : undefined;
}

export default defineComponent({
  id: 'number-input',
  title: 'NumberInput',
  category: 'Forms',
  status: 'UI',
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
    readOnly: {
      ...readOnly,
      description:
        'Keep the value available for selection and submission while blocking typing and steps.',
    },
    required,
    loading,
    value: {
      kind: 'slot',
      group: 'Value',
      default: 'uncontrolled',
      publicType: "number | ''",
      description: 'The owner supplies a committed value and can decline edits.',
      choices: [
        { value: 'uncontrolled', code: 'undefined' },
        { value: 'fixed', label: 'Owner holds 25', code: '25' },
        { value: 'empty', label: 'Owner holds empty', code: "''" },
      ],
    },
    defaultValue: numericProp(
      'Initial value and native reset baseline. Omit it to start empty.',
      '25',
      "number | ''",
    ),
    min: numericProp('Lower bound and explicit step base.', '0'),
    max: numericProp('Upper bound.', '100'),
    step: numericProp(
      "Positive step size or 'any' for unrestricted decimals. Defaults to 1.",
      '1',
      "number | 'any'",
    ),
    prefix: textProp('Decorative text before the number.'),
    suffix: textProp(
      'Decorative text after the number. Name the unit in the label or description.',
    ),
    decrementLabel: textProp('Accessible name of the decrease action.', 'Decrease value'),
    incrementLabel: textProp('Accessible name of the increase action.', 'Increase value'),
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
    ...(['fixed', 'empty'] as const).map((value) => ({
      kind: 'precedence' as const,
      when: { value },
      affects: ['defaultValue'],
      reason: 'The controlled owner holds the value, even when an edit is proposed.',
    })),
  ],
  render: withOverlaySurface(({ values, ctx }) => {
    const { value, defaultValue, min, max, step, ...props } = values;
    const controlledValue = value === 'fixed' ? 25 : value === 'empty' ? '' : undefined;
    const initialValue = readNumber(defaultValue) ?? '';
    const message = !props.disabled && messages[props.status];
    return (
      <form {...ctx.form} className="number-playground-form">
        <NumberField
          {...props}
          subject={ctx.subject}
          key={`${value}:${initialValue}`}
          id={ctx.id}
          name="quota"
          label="Seat quota"
          value={controlledValue}
          defaultValue={initialValue}
          min={readNumber(min)}
          max={readNumber(max)}
          step={step === 'any' ? 'any' : readNumber(step)}
          description={
            props.suffix.trim() ? (
              <bdi>
                Unit: <bdi>{props.suffix}</bdi>
              </bdi>
            ) : undefined
          }
          message={message ? <bdi>{message}</bdi> : undefined}
          onValueChange={ctx.action('onValueChange')}
        />
      </form>
    );
  }, 'border-box'),
  code: ({ value, defaultValue, min, max, step, ...props }) => {
    const initial =
      value === 'uncontrolled'
        ? { defaultValue: readNumber(defaultValue) ?? '' }
        : { value: value === 'fixed' ? 25 : '' };
    const lower = readNumber(min);
    const upper = readNumber(max);
    const spacing = step === 'any' ? 'any' : readNumber(step);
    const attrs = previewProps(
      {
        ...initial,
        ...(lower !== undefined && { min: lower }),
        ...(upper !== undefined && { max: upper }),
        ...(spacing !== undefined && spacing !== 1 && { step: spacing }),
        ...props,
      },
      {
        size: 'm',
        variant: 'default',
        status: 'neutral',
        width: 'full',
        disabled: false,
        readOnly: false,
        required: false,
        loading: false,
        prefix: '',
        suffix: '',
        decrementLabel: 'Decrease value',
        incrementLabel: 'Increase value',
      },
    );
    const message = !props.disabled && messages[props.status];
    const unit = props.suffix.trim();
    return `import { useId } from 'react';
import { NumberInput, Stack, Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function SeatQuota() {
  const id = useId();
  return (
    <Stack gap={8}>
      <Text as="label" htmlFor={id} size="body-s">Seat quota</Text>
      <NumberInput id={id} name="quota"${attrs}${unit || message ? ` aria-describedby={${[unit && "id + '-unit'", message && "id + '-message'"].filter(Boolean).join(" + ' ' + ")}}` : ''} onValueChange={(next) => console.log(next)} />
${
  unit
    ? `      <Text id={id + '-unit'} size="caption-l">Unit: <bdi>${previewText(unit)}</bdi></Text>
`
    : ''
}${
      message
        ? `      <Text id={id + '-message'} size="caption-l"><bdi>${previewText(message)}</bdi></Text>
`
        : ''
    }    </Stack>
  );
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
        'Tab into either field to show the keyboard outline. Click to compare pointer focus, then hold either action to step repeatedly.',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      render: withOverlaySurface(NumberInteraction, 'border-box'),
    },
    {
      id: 'feedback',
      title: 'Validation and feedback',
      caption:
        'Compare five feedback tones in each role. Tab into a feedback field to inspect its outline. One glyph and its explanation identify each non-neutral status.',
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
        'Compare an ordinary interval, an inline percentage and a validation error on each material. Tab into the last field to inspect focus.',
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
      code: portionSource,
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
      code: budgetSource,
    },
  ],
});
