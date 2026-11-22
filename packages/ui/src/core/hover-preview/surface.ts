import type { HTMLAttributes } from 'react';

type OwnedSurfaceProp =
  | 'aria-hidden'
  | 'autoFocus'
  | 'contentEditable'
  | 'dangerouslySetInnerHTML'
  | 'popover'
  | 'role'
  | 'tabIndex';

export type PreviewSurfaceProps<T extends HTMLElement> = Omit<HTMLAttributes<T>, OwnedSurfaceProp>;

const ownedAttributes = /* @__PURE__ */ new Set([
  'aria-hidden',
  'autofocus',
  'contenteditable',
  'dangerouslysetinnerhtml',
  'data-align',
  'data-side',
  'data-surface',
  'data-unica-preview-scroll',
  'popover',
  'role',
  'tabindex',
]);

export function previewSurfaceProps<T extends HTMLElement>(
  props: PreviewSurfaceProps<T>,
): PreviewSurfaceProps<T> {
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => !ownedAttributes.has(key.toLowerCase())),
  );
}
