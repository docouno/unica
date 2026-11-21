import type { ComponentPropsWithRef } from 'react';

const reserved = [
  'accessKey',
  'aria-live',
  'aria-valuemax',
  'aria-valuemin',
  'aria-valuenow',
  'autoFocus',
  'children',
  'contentEditable',
  'dangerouslySetInnerHTML',
  'defaultChecked',
  'defaultValue',
  'focusable',
  'is',
  'popover',
  'role',
  'tabIndex',
] as const;

type Reserved = (typeof reserved)[number];

export type PassiveProps<Tag extends 'div' | 'svg'> = Omit<ComponentPropsWithRef<Tag>, Reserved> & {
  readonly [Key in Reserved]?: never;
} & {
  readonly [data: `data-${string}`]: string | number | boolean | undefined;
};

const reservedNames = /* @__PURE__ */ new Set(reserved.map((name) => name.toLowerCase()));

// JavaScript callers can also supply native attributes through object spreads.
export function passiveAttributes<Props extends object>(props: Props): Props {
  return Object.fromEntries(
    Object.entries(props).filter(([name]) => !reservedNames.has(name.toLowerCase())),
  ) as Props;
}

export function nonBlank(text: string | undefined): string | undefined {
  return text?.trim() || undefined;
}
