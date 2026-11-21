import type { ComponentPropsWithRef } from 'react';

type ClosedRootKey = 'role' | 'tabIndex' | 'dangerouslySetInnerHTML';

export type PassiveRootProps = Omit<
  ComponentPropsWithRef<'code'>,
  ClosedRootKey | 'contentEditable'
> & {
  readonly [Key in ClosedRootKey]?: never;
} & {
  readonly contentEditable?: false | 'false' | 'inherit' | undefined;
};

export function passiveRootAttributes(
  props: PassiveRootProps,
  nameProhibited = false,
): ComponentPropsWithRef<'code'> {
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

  if (editable === false || editable === 'false') {
    attributes.contentEditable = false;
  }
  return attributes;
}
