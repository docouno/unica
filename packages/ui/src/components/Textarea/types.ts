import type { ComponentPropsWithRef } from 'react';
import type { ControlSize, FieldStatus, FieldVariant } from '../../core/forms/fieldAxes.js';
import type { DataAttributeValue } from '../../core/passiveRoot.js';
import type { TEXTAREA_RESIZE, TEXTAREA_WIDTH } from './consts.js';

interface TextareaOptions {
  readonly variant?: FieldVariant | undefined;
  readonly size?: ControlSize | undefined;
  readonly status?: FieldStatus | undefined;
  readonly width?: (typeof TEXTAREA_WIDTH)[keyof typeof TEXTAREA_WIDTH] | undefined;
  readonly resize?: (typeof TEXTAREA_RESIZE)[keyof typeof TEXTAREA_RESIZE] | undefined;
  readonly autosize?: boolean | undefined;
  readonly minRows?: number | undefined;
  readonly maxRows?: number | undefined;
  readonly [data: `data-${string}`]: DataAttributeValue;
}

type TextareaValue =
  | { readonly value: string; readonly defaultValue?: never }
  | { readonly defaultValue?: string | undefined; readonly value?: undefined };

type OwnedAttribute = 'aria-invalid' | 'children' | 'dangerouslySetInnerHTML';

export type TextareaProps = TextareaOptions &
  TextareaValue &
  Omit<ComponentPropsWithRef<'textarea'>, keyof TextareaValue | OwnedAttribute> & {
    readonly [Key in OwnedAttribute]?: never;
  };
