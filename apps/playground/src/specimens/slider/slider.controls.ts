import { choice, disabled, eventProp, readOnly, size, toggle } from '../control-props.js';

export const percent = (value: number): string => `${value}%`;

export const sliderControls = {
  size,
  disabled,
  readOnly,
  orientation: choice(
    'Geometry',
    'Direction of the scale.',
    ['horizontal', 'vertical'],
    'horizontal',
  ),
  status: choice(
    'Availability',
    'Validation feedback for the control.',
    ['neutral', 'danger'],
    'neutral',
  ),
  showValue: toggle('Content', 'Show the current value above the rail.', true),
  min: {
    kind: 'number',
    group: 'Scale',
    default: 0,
    examples: [0, 10, 20],
    description: 'First point of the scale.',
  },
  max: {
    kind: 'number',
    group: 'Scale',
    default: 100,
    examples: [80, 100, 120],
    description: 'Upper bound before rounding down to the last full step.',
  },
  step: {
    kind: 'number',
    group: 'Scale',
    default: 1,
    examples: [1, 5, 10],
    description: 'Distance between adjacent values.',
  },
  formatValue: {
    kind: 'slot',
    group: 'Content',
    default: 'percent',
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
    description: 'Reference ticks and optional labels within the reachable scale.',
    choices: [
      { value: 'none', code: 'undefined' },
      { value: 'marked', label: 'Endpoints', code: 'endpoints' },
    ],
  },
  form: {
    kind: 'string',
    group: 'Form',
    default: '',
    examples: ['', 'preferences'],
    description: 'Associate the input with the enclosing form or a form by ID.',
  },
  onValueChange: eventProp('Reports each new proposed value.', 'handleValueChange'),
  onValueCommit: eventProp(
    'Reports the accepted value when editing finishes.',
    'handleValueCommit',
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
  {
    kind: 'precedence',
    when: { readOnly: true },
    affects: ['value', 'defaultValue'],
    reason: 'A read-only control retains its value and keyboard focus while edits are blocked.',
  },
  {
    kind: 'precedence',
    when: { showValue: false },
    affects: ['formatValue'],
    reason: 'The formatter still supplies the spoken value when the local readout is hidden.',
  },
] as const;

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
}: {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly formatValue: string;
  readonly marks: string;
}) {
  const end = min + Math.floor((max - min) / step) * step;
  const format = formatValue === 'percent' ? percent : String;
  const endpoints = end === min ? [min] : [min, end];
  return {
    formatValue: format,
    marks:
      marks === 'none' ? undefined : endpoints.map((value) => ({ value, label: format(value) })),
  };
}
