import type { Values } from '../workbench/types.js';

export function previewProps(values: Values, defaults: Values = {}): string {
  return Object.entries(values)
    .filter(([name, value]) => value !== defaults[name])
    .map(([name, value]) => {
      if (value === true) {
        return ` ${name}`;
      }
      // A JSX expression preserves authored input verbatim, including quotes and newlines.
      return ` ${name}={${JSON.stringify(value)}}`;
    })
    .join('');
}

export function previewText(value: string): string {
  return `{${JSON.stringify(value)}}`;
}
