import type { TextColor } from '@docouno/unica';
import type { Constraint, PropSchema } from '../../workbench/types.js';

export const foregrounds = [
  'primary',
  'secondary',
  'muted',
  'subtle',
  'accent',
  'info',
  'success',
  'warning',
  'danger',
] as const satisfies readonly TextColor[];

export const clampSteps = ['1', '2', '3'] as const;

export const typographyControls = {
  color: {
    kind: 'enum',
    group: 'Typography',
    default: 'inherit',
    description: 'Inherit surrounding color or use a semantic foreground.',
    choices: [{ value: 'inherit' }, ...foregrounds.map((value) => ({ value }))],
  },
  align: {
    kind: 'slot',
    group: 'Typography',
    default: 'inherit',
    description: 'Align text to the start, center, or end of the current writing direction.',
    choices: [
      { value: 'inherit', label: 'From context' },
      { value: 'start' },
      { value: 'center' },
      { value: 'end' },
    ],
  },
  italic: {
    kind: 'slot',
    group: 'Typography',
    default: 'auto',
    description: 'Use italic or upright text, or keep the default.',
    choices: [
      { value: 'auto', label: 'Default' },
      { value: 'italic', label: 'Italic' },
      { value: 'normal', label: 'Upright' },
    ],
  },
  tabularNums: {
    kind: 'boolean',
    group: 'Typography',
    default: false,
    description: 'Use equal-width digits where the font supports them.',
  },
  lineClamp: {
    kind: 'slot',
    group: 'Overflow',
    default: 'off',
    description: 'Limit the text to a fixed number of lines.',
    choices: [
      { value: 'off', label: 'Off' },
      ...clampSteps.map((value) => ({ value, label: value === '1' ? '1 line' : `${value} lines` })),
    ],
  },
  truncate: {
    kind: 'boolean',
    group: 'Overflow',
    default: false,
    description: 'Keep the content on one line and indicate overflow with an ellipsis.',
  },
} as const satisfies PropSchema;

export const clampPrecedence: readonly Constraint[] = clampSteps.map((lineClamp) => ({
  kind: 'precedence',
  when: { lineClamp },
  affects: [{ key: 'truncate', value: true }],
  reason: 'Line clamp takes precedence over single-line truncation.',
}));
