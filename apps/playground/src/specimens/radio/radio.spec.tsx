import { Radio, RadioGroup, Stack, Text } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { size, disabled, readOnly, required, choice, eventProp } from '../control-props.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { previewProps } from '../preview-code.js';
import {
  Availability,
  Interaction,
  Overflow,
  SurfaceChoices,
  Validation,
} from './radio.examples.js';
import { DeliveryPreferences } from './delivery-preferences.js';
import deliverySource from './delivery-preferences.tsx?raw';

export default defineComponent({
  id: 'radio',
  title: 'Radio',
  category: 'Forms',
  status: 'UI',
  summary: 'One choice from a named group of visible options.',
  componentName: 'RadioGroup',
  form: 'owned',
  props: {
    size,
    disabled,
    readOnly,
    required,
    selection: {
      kind: 'enum',
      group: 'Interaction',
      label: 'Initial selection',
      description:
        'Sets the initial key on RadioGroup. No choice passes null. A native reset restores this example’s initial selection.',
      choices: [
        { value: '', label: 'No choice yet' },
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
      ],
      default: 'daily',
      demo: true,
    },
    status: choice(
      'Semantics',
      'Validation feedback for RadioGroup. This example pins a review message for danger.',
      ['neutral', 'danger'],
      'neutral',
    ),
    orientation: choice(
      'Geometry',
      'Stack choices or place them side by side.',
      ['vertical', 'horizontal'],
      'vertical',
    ),
    onValueChange: eventProp(
      'RadioGroup reports the proposed option key after selection.',
      '(next) => console.log(next)',
      '(next: string) => void',
    ),
  },
  constraints: [
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: [{ key: 'status', value: 'danger' }],
      reason: 'Disabled groups suppress invalid styling and semantics.',
    },
    {
      kind: 'precedence',
      when: { disabled: true },
      affects: [
        { key: 'readOnly', value: true },
        { key: 'required', value: true },
      ],
      reason: 'Disabled groups are excluded from focus, validation, and submission.',
    },
  ],
  render: withOverlaySurface(({ values: { selection, ...props }, ctx }) => {
    const review = props.status === 'danger' && !props.disabled;
    return (
      <form {...ctx.form} className="radio-example-form" data-orientation={props.orientation}>
        <Stack gap={8}>
          <Text id={ctx.id} size="body-s" weight="medium">
            Delivery frequency
            {props.required && !props.disabled && (
              <Text as="span" aria-hidden="true" color="danger">
                {' '}
                *
              </Text>
            )}
          </Text>
          <RadioGroup
            key={selection}
            {...props}
            {...ctx.subject}
            name="delivery"
            defaultValue={selection || null}
            aria-labelledby={ctx.id}
            aria-describedby={review ? ctx.id + '-review' : undefined}
            onValueChange={ctx.action('onValueChange')}
          >
            <Radio value="daily" label="Daily" />
            <Radio value="weekly" label="Weekly" />
            <Radio value="monthly" label="Monthly" />
          </RadioGroup>
          {review && (
            <Text size="caption-l" color="danger" id={ctx.id + '-review'}>
              <bdi>The delivery schedule needs review.</bdi>
            </Text>
          )}
        </Stack>
      </form>
    );
  }, 'border-box'),
  code: ({ selection, ...values }) => {
    const attrs = previewProps(values, {
      size: 'm',
      disabled: false,
      readOnly: false,
      required: false,
      status: 'neutral',
      orientation: 'vertical',
    });
    const review = values.status === 'danger' && !values.disabled;
    const mark =
      values.required && !values.disabled
        ? ' <Text as="span" aria-hidden="true" color="danger">*</Text>'
        : '';
    return `import { useId } from 'react';
import { Radio, RadioGroup, Stack, Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function DeliveryFrequency() {
  const id = useId();
  return (
    <form>
      <Stack gap={8}>
        <Text id={id} size="body-s" weight="medium">Delivery frequency${mark}</Text>
        <RadioGroup name="delivery" aria-labelledby={id}${review ? ' aria-describedby={id + "-review"}' : ''} defaultValue={${JSON.stringify(selection || null)}}${attrs} onValueChange={(next) => console.log(next)}>
          <Radio value="daily" label="Daily" />
          <Radio value="weekly" label="Weekly" />
          <Radio value="monthly" label="Monthly" />
        </RadioGroup>${review ? '\n        <Text id={id + "-review"} size="caption-l" color="danger"><bdi>The delivery schedule needs review.</bdi></Text>' : ''}
      </Stack>
    </form>
  );
}`;
  },
  states: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'orientation',
      fixed: { selection: 'weekly' },
      title: 'Size and orientation',
      caption:
        'Compare 16, 20, and 24px circles in rows at least 30, 40, and 48px high. Each group starts on Weekly with a choice on either side.',
    },
    {
      id: 'selection',
      rows: 'selection',
      cols: 'required',
      title: 'Initial selection and requirement',
      caption:
        'Compare required and optional groups with and without an initial answer. Only the checked available option contributes a form entry.',
    },
  ],
  cases: [
    {
      id: 'interaction',
      title: 'Keyboard and pointer selection',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Tab enters on the selected option. Arrow keys move the selection. Home and End choose the first and last available options. Hold a label to inspect its pressed state.',
      render: withOverlaySurface(Interaction, 'border-box'),
    },
    {
      id: 'availability',
      title: 'Read-only and unavailable choices',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Read-only keeps a focusable answer. A disabled group stays out of the tab order. Replace the disconnected, still-selected channel with an available one.',
      render: withOverlaySurface(Availability, 'border-box'),
    },
    {
      id: 'validation',
      title: 'Missing and disallowed answers',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Submit an empty group, choose a visibility, then submit again. In the policy example, switching from Public to Team only resolves a different error.',
      render: withOverlaySurface(Validation, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Long options and control density',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Compare a wrapped label, supporting text and an unbroken settings key. Compact and touch-sized groups keep a circular indicator beside the first line.',
      render: withOverlaySurface(Overflow, 'border-box'),
    },
    {
      id: 'surfaces',
      title: 'Visibility on base and overlay',
      kind: 'surface',
      mode: 'live',
      reset: true,
      compareSurfaces: true,
      caption: 'Change the visibility on either material. The other group keeps its own selection.',
      render: SurfaceChoices,
    },
  ],
  compositions: [
    {
      id: 'group',
      title: 'Delivery and date preferences',
      mode: 'live',
      reset: true,
      caption:
        'The delivery schedule starts unanswered. Select a schedule to update its summary. Date display keeps an independent selection, including when its options wrap.',
      render: withOverlaySurface(
        ({ ctx }) => <DeliveryPreferences groupProps={ctx.subject} />,
        'border-box',
      ),
      code: deliverySource,
    },
  ],
});
