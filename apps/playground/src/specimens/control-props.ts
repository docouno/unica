import type { PropDefinition } from '../workbench/types.js';

export function choice<const Options extends readonly string[]>(
  group: string,
  description: string,
  options: Options,
  initial: NoInfer<Options[number]>,
) {
  return {
    kind: 'enum' as const,
    group,
    description,
    choices: options.map((value: Options[number]) => ({ value })),
    default: initial,
  };
}

export function toggle(
  group: string,
  description: string,
  initial = false,
): PropDefinition & {
  readonly kind: 'boolean';
} {
  return { kind: 'boolean', group, description, default: initial };
}

export function eventProp(
  description: string,
  handler: string,
): PropDefinition & {
  readonly kind: 'action';
} {
  return { kind: 'action', group: 'Events', description, code: handler };
}

export const size = choice('Geometry', 'Density of the control.', ['s', 'm', 'l'], 'm');
export const variant = choice(
  'Field',
  'Form field or inline editing role.',
  ['default', 'ghost'],
  'default',
);
export const status = choice(
  'Field',
  'Feedback tone of the field.',
  ['neutral', 'info', 'success', 'warning', 'danger'],
  'neutral',
);
export const width = choice('Geometry', 'Available inline width.', ['auto', 'full'], 'full');
export const disabled = toggle('Availability', 'Disable the control.');
export const readOnly = toggle('Availability', 'Keep the current value available for reading.');
export const required = toggle('Availability', 'Mark the value as required.');
export const clearable = toggle('Field', 'Show the control for clearing the current value.');
export const loading = toggle('Availability', 'Show pending work.');
