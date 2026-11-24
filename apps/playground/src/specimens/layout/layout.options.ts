import type { Spacing } from '@docouno/unica';

export const viewportNote =
  'Responsive values follow the browser viewport. Workbench Width changes only the artboard.';

export function choiceProp<const Options extends Readonly<Record<string, unknown>>>(
  options: Options,
  initial: keyof Options & string,
  description: string,
  publicType: string,
) {
  const keys = Object.keys(options) as (keyof Options & string)[];
  return {
    kind: 'slot' as const,
    group: 'Geometry',
    publicType,
    default: initial,
    description,
    choices: keys.map((value) => ({ value, code: JSON.stringify(options[value]) ?? 'undefined' })),
  };
}

export const spacingValues = {
  '0': 0,
  '2': 2,
  '4': 4,
  '8': 8,
  '12': 12,
  '16': 16,
  '24': 24,
  '32': 32,
  '48': 48,
  '64': 64,
  'Tablet 16 · Wide 24': { tablet: 16, wide: 24 },
} as const satisfies { [Step in Spacing]: Step } & Record<string, unknown>;

export const spacingOptions = { Default: undefined, ...spacingValues } as const;

export const directionOptions = {
  row: 'row',
  'row-reverse': 'row-reverse',
  column: 'column',
  'column-reverse': 'column-reverse',
  'Mobile column · Tablet row': { mobile: 'column', tablet: 'row' },
} as const;

export const alignOptions = {
  start: 'start',
  center: 'center',
  end: 'end',
  stretch: 'stretch',
  baseline: 'baseline',
  'Tablet center': { tablet: 'center' },
} as const;

export const trackOptions = {
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  '11': 11,
  '12': 12,
} as const;

export const responsiveTracksType = 'Responsive<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12>';
