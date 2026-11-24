import type { ComponentValues } from '../../workbench/types.js';
import { previewProps } from '../preview-code.js';
import { choice, disabled, eventProp, readOnly, size, toggle } from '../control-props.js';

export const percent = (value: number): string => `${value}%`;

export const sliderControls = {
  size,
  disabled,
  readOnly: {
    ...readOnly,
    description: 'Keep the field focusable and submittable while blocking user edits.',
  },
  orientation: choice(
    'Geometry',
    'Direction of the scale.',
    ['horizontal', 'vertical'],
    'horizontal',
  ),
  status: choice(
    'Semantics',
    'Validation feedback for the control.',
    ['neutral', 'danger'],
    'neutral',
  ),
  showValue: toggle(
    'Content',
    'Show the current value above the rail. The formatter still supplies the spoken value when this readout is hidden.',
    true,
  ),
  min: {
    kind: 'number',
    group: 'Geometry',
    default: 0,
    examples: [0, 10, 20],
    description:
      'First point of the scale. The inspector accepts whole numbers from −10,000 to 10,000.',
  },
  max: {
    kind: 'number',
    group: 'Geometry',
    default: 100,
    examples: [80, 100, 120],
    description:
      'Upper bound before rounding down to the last full step. The inspector accepts whole numbers from −10,000 to 10,000.',
  },
  step: {
    kind: 'number',
    group: 'Geometry',
    default: 1,
    examples: [1, 5, 10],
    description:
      'Distance between adjacent values. The inspector uses positive whole-number steps up to 10,000.',
  },
  formatValue: {
    kind: 'slot',
    group: 'Content',
    default: 'percent',
    publicType: '(value: number) => string',
    description: 'Used for the visible readout and spoken value.',
    choices: [
      { value: 'percent', code: "(value) => value + '%'" },
      { value: 'number', label: 'Plain number', code: 'String' },
    ],
  },
  marks: {
    kind: 'slot',
    group: 'Content',
    default: 'none',
    publicType: 'readonly SliderMark[]',
    description:
      'Reference ticks and optional labels. The endpoints preset marks the reachable scale. Vertical percentage scales show the unit in the readout and use short numeric tick labels.',
    choices: [
      { value: 'none', code: 'undefined' },
      { value: 'marked', label: 'Endpoints', code: 'endpoints' },
    ],
  },
  form: {
    kind: 'string',
    group: 'Host',
    default: '',
    examples: ['', 'preferences'],
    description:
      'The native form owner ID. Leave empty to use the enclosing form. This example prefixes a custom ID so copies stay independent.',
  },
  onValueChange: eventProp(
    'Receives each new proposed number in the original units.',
    '(next) => console.log(next)',
    '(next: number) => void',
  ),
  onValueCommit: eventProp(
    'Reports the accepted value when editing finishes.',
    '(next) => console.log(next)',
    '(next: number) => void',
  ),
} as const;

export const sliderConstraints = [
  {
    kind: 'ignored',
    when: { disabled: true },
    affects: ['readOnly', 'status'],
    reason:
      'A disabled control skips native focus and form submission, suppresses validation paint, and blocks edits.',
  },
] as const;

export const scaleMessage =
  'Use whole-number bounds from −10,000 to 10,000, with the minimum at or below the maximum and a positive whole-number step up to 10,000.';

export function demoScale(min: number, max: number, step: number): boolean {
  // Keep the inspector's free-text edits within its small demonstration domain.
  return (
    [min, max, step].every((value) => Number.isSafeInteger(value) && Math.abs(value) <= 10000) &&
    min <= max &&
    step > 0
  );
}

export function demoPresentation({
  min,
  max,
  step,
  formatValue,
  marks,
  orientation,
}: {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly formatValue: string;
  readonly marks: string;
  readonly orientation: string;
}) {
  const end = min + Math.floor((max - min) / step) * step;
  const format = formatValue === 'percent' ? percent : String;
  const endpoints = end === min ? [min] : [min, end];
  const formatMark = orientation === 'vertical' ? String : format;
  return {
    formatValue: format,
    marks:
      marks === 'none'
        ? undefined
        : endpoints.map((value) => ({ value, label: formatMark(value) })),
  };
}

export function sliderPresentationCode(values: ComponentValues<typeof sliderControls>): string {
  const { size, disabled, readOnly, orientation, status, showValue, min, max, step } = values;
  const attrs = previewProps(
    { size, disabled, readOnly, orientation, status, showValue, min, max, step },
    {
      size: 'm',
      disabled: false,
      readOnly: false,
      orientation: 'horizontal',
      status: 'neutral',
      showValue: true,
      min: 0,
      max: 100,
      step: 1,
    },
  );
  const { marks } = demoPresentation(values);
  const format = values.formatValue === 'percent' ? ' formatValue={(value) => value + "%"}' : '';
  return attrs + format + (marks ? ' marks={' + JSON.stringify(marks) + '}' : '');
}

export function rejectedScaleCode(message: string): string {
  return `import { Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ScaleMessage() {
  return <form><Text size="body-s" role="status"><bdi>${message}</bdi></Text></form>;
}`;
}
