import type { ReactNode } from 'react';
import { nonBlank } from '../../core/passiveRoot.js';
import { TAG_DESCRIPTION_ATTRIBUTES } from './consts.js';

const descriptiveAria = new Set(Object.keys(TAG_DESCRIPTION_ATTRIBUTES));

const reservedRoot = new Set([
  'accesskey',
  'autofocus',
  'contenteditable',
  'dangerouslysetinnerhtml',
  'defaultchecked',
  'defaultvalue',
  'focusable',
  'is',
  'onauxclick',
  'onauxclickcapture',
  'onclick',
  'onclickcapture',
  'ondoubleclick',
  'ondoubleclickcapture',
  'popover',
  'previewstate',
  'role',
  'tabindex',
  'title',
  'data-preview',
]);

export function tagRootAttributes<Props extends object>(props: Props): Props {
  return Object.fromEntries(
    Object.entries(props).filter(([name]) => {
      const key = name.toLowerCase();
      return (
        !reservedRoot.has(key) &&
        !key.startsWith('data-unica-tag-') &&
        !key.startsWith('data-unica-mark-') &&
        (!key.startsWith('aria-') || descriptiveAria.has(key))
      );
    }),
  ) as Props;
}

export function getTagText(label: ReactNode, textValue?: string): string | undefined {
  if (
    typeof label === 'string'
      ? !nonBlank(label)
      : label === null || label === undefined || typeof label === 'boolean'
  ) {
    return undefined;
  }
  const text = textValue ?? (typeof label === 'string' ? label : undefined);
  return nonBlank(text) === undefined ? undefined : text;
}
