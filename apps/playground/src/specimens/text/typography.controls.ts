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
    group: 'Role',
    default: 'inherit',
    description: 'Inherit surrounding color or use a semantic foreground.',
    choices: [{ value: 'inherit' }, ...foregrounds.map((value) => ({ value }))],
  },
  align: {
    kind: 'enum',
    group: 'Geometry',
    default: 'inherit',
    description:
      'Align text within its block. Logical start and end follow the writing direction. Inline runs follow their paragraph.',
    choices: [
      { value: 'inherit', label: 'From context', omit: true },
      { value: 'start' },
      { value: 'center' },
      { value: 'end' },
    ],
  },
  italic: {
    kind: 'enum',
    group: 'Role',
    publicType: 'boolean',
    default: 'auto',
    description: 'Use italic or upright text, or keep the default.',
    choices: [
      { value: 'auto', label: 'Default', omit: true },
      { value: 'italic', label: 'Italic' },
      { value: 'normal', label: 'Upright' },
    ],
  },
  tabularNums: {
    kind: 'boolean',
    group: 'Geometry',
    default: false,
    description: 'Use equal-width digits where the font supports them.',
  },
  lineClamp: {
    kind: 'enum',
    group: 'Geometry',
    publicType: 'number',
    default: 'off',
    description:
      'A positive integer limits the number of lines. The editor samples one to three lines.',
    choices: [
      { value: 'off', label: 'Off', omit: true },
      ...clampSteps.map((value) => ({ value, label: value === '1' ? '1 line' : `${value} lines` })),
    ],
  },
  truncate: {
    kind: 'boolean',
    group: 'Geometry',
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
