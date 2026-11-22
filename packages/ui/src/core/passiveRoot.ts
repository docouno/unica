import type { ComponentPropsWithRef } from 'react';

type ClosedEditorialKey = 'role' | 'tabIndex' | 'dangerouslySetInnerHTML';

export type PassiveRootProps<Tag extends 'code' | 'figure' = 'code'> = Omit<
  ComponentPropsWithRef<Tag>,
  ClosedEditorialKey | 'contentEditable'
> & {
  readonly [Key in ClosedEditorialKey]?: never;
} & {
  readonly contentEditable?: false | 'false' | 'inherit' | undefined;
};

export function passiveRootAttributes<Tag extends 'code' | 'figure' = 'code'>(
  props: PassiveRootProps<Tag>,
  nameProhibited = false,
): ComponentPropsWithRef<Tag> {
  const attributes = { ...props } as Record<string, unknown>;
  const editable = props.contentEditable ?? attributes.contenteditable;

  // Untyped spreads can include native spellings that bypass React's prop types.
  for (const key of Object.keys(attributes)) {
    switch (key.toLowerCase()) {
      case 'role':
      case 'tabindex':
      case 'dangerouslysetinnerhtml':
      case 'contenteditable':
        delete attributes[key];
        break;
      case 'aria-label':
      case 'aria-labelledby':
        if (nameProhibited) {
          delete attributes[key];
        }
        break;
    }
  }

  // HTML contract: contentEditable="inherit" omits the attribute (null) to inherit editing host.
  if (editable === false || editable === 'false') {
    attributes.contentEditable = false;
  }
  return attributes as ComponentPropsWithRef<Tag>;
}

const PROGRESS_RESERVED = [
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

type ProgressReserved = (typeof PROGRESS_RESERVED)[number];

export type PassiveIndicatorProps<Tag extends 'div' | 'span' | 'svg'> = Omit<
  ComponentPropsWithRef<Tag>,
  ProgressReserved
> & {
  readonly [Key in ProgressReserved]?: never;
} & {
  readonly [data: `data-${string}`]: string | number | boolean | undefined;
};

const progressReservedNames = /* @__PURE__ */ new Set(
  PROGRESS_RESERVED.map((name) => name.toLowerCase()),
);

export function passiveIndicatorAttributes<Props extends object>(props: Props): Props {
  return Object.fromEntries(
    Object.entries(props).filter(([name]) => !progressReservedNames.has(name.toLowerCase())),
  ) as Props;
}

export type DataAttributeValue = string | number | boolean | undefined;

export function pickConsumerDataAttributes(
  props: Record<string, unknown>,
  reservedPrefix?: string,
): Record<string, string | number | boolean> {
  const normalizedPrefix = reservedPrefix?.toLowerCase();
  const attributes: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(props)) {
    if (
      key.startsWith('data-') &&
      (normalizedPrefix === undefined || !key.toLowerCase().startsWith(normalizedPrefix)) &&
      (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    ) {
      attributes[key] = value;
    }
  }
  return attributes;
}

export function nonBlank(text: string | undefined): string | undefined {
  return text?.trim() || undefined;
}
