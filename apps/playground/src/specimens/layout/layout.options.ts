export const viewportNote =
  'Responsive values follow the browser viewport. Workbench Width changes only the artboard.';

export function choiceProp<const Options extends Readonly<Record<string, unknown>>>(
  options: Options,
  initial: keyof Options & string,
  description: string,
  group = 'Layout',
) {
  const keys = Object.keys(options) as (keyof Options & string)[];
  return {
    kind: 'slot' as const,
    group,
    default: initial,
    description,
    choices: keys.map((value) => ({ value, code: JSON.stringify(options[value]) })),
  };
}

export const spacingOptions = {
  Default: undefined,
  '0': 0,
  xs: 'xs',
  s: 's',
  m: 'm',
  l: 'l',
  xl: 'xl',
  'Tablet m · Wide l': { tablet: 'm', wide: 'l' },
} as const;

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
