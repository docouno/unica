import type { ReactElement } from 'react';
import { previewText } from '../preview-code.js';

export const labelledByText = {
  kind: 'string',
  group: 'Semantics',
  label: 'Referenced label',
  default: '',
  description: 'Render a separate label and link to it with aria-labelledby.',
  demo: true,
} as const;

export function activityNameReference(id: string, text: string): ReactElement | undefined {
  return text.trim() ? <span id={id}>{text}</span> : undefined;
}

export function withActivityNameCode(snippet: string, text: string): string {
  return text.trim()
    ? `<>
  <span id="operation-label">${previewText(text)}</span>
  ${snippet}
</>`
    : snippet;
}
