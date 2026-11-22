import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import type { SIZE } from '../../consts.js';
import type { GlyphSource } from '../../core/glyph.js';
import type { ExactAxisSubset } from '../../types.js';
import type { BUTTON_SIZE, BUTTON_TONE, BUTTON_VARIANT } from './consts.js';

export type ButtonSize = ExactAxisSubset<typeof SIZE, typeof BUTTON_SIZE>[keyof typeof BUTTON_SIZE];
export type ButtonVariant = (typeof BUTTON_VARIANT)[keyof typeof BUTTON_VARIANT];
export type ButtonTone = (typeof BUTTON_TONE)[keyof typeof BUTTON_TONE];

type OwnedAttribute = 'aria-busy' | 'aria-disabled' | 'aria-pressed' | 'dangerouslySetInnerHTML';

interface ActionOptions {
  readonly size?: ButtonSize | undefined;
  readonly variant?: ButtonVariant | undefined;
  readonly tone?: ButtonTone | undefined;
  readonly disabled?: boolean | undefined;
  readonly loading?: boolean | undefined;
}

interface ToggleOptions {
  readonly pressed?: boolean | undefined;
  readonly defaultPressed?: boolean | undefined;
  readonly onPressedChange?: ((pressed: boolean) => void) | undefined;
}

type NativeAttributes = ComponentPropsWithRef<'button'>;
type AnchorAttributes = ComponentPropsWithRef<'a'>;
type NavigationAttribute =
  'download' | 'href' | 'hrefLang' | 'media' | 'ping' | 'referrerPolicy' | 'rel' | 'target';
type FormAttribute =
  | 'command'
  | 'commandFor'
  | 'form'
  | 'formAction'
  | 'formEncType'
  | 'formMethod'
  | 'formNoValidate'
  | 'formTarget'
  | 'name'
  | 'popoverTarget'
  | 'popoverTargetAction'
  | 'type'
  | 'value';

type Forbidden<Keys extends string> = { readonly [Key in Keys]?: never };

export interface NativeInvokerAttributes {
  readonly command?: string | undefined;
  readonly commandFor?: string | undefined;
}

type NativeHost = Omit<NativeAttributes, 'children' | 'disabled' | OwnedAttribute> &
  NativeInvokerAttributes &
  ToggleOptions &
  Forbidden<OwnedAttribute | NavigationAttribute> & {
    readonly asChild?: false | undefined;
  };

type AnchorHost = Omit<
  AnchorAttributes,
  'children' | OwnedAttribute | NavigationAttribute | FormAttribute
> &
  Forbidden<OwnedAttribute | NavigationAttribute | FormAttribute | keyof ToggleOptions> & {
    readonly asChild: true;
    readonly children: ReactElement;
  };

export type ButtonProps = ActionOptions & {
  readonly iconLeft?: GlyphSource | undefined;
  readonly iconRight?: GlyphSource | undefined;
  readonly width?: 'auto' | 'full' | undefined;
} & (AnchorHost | (NativeHost & { readonly children?: ReactNode }));

type AccessibleName =
  | { readonly 'aria-label': string; readonly 'aria-labelledby'?: string | undefined }
  | { readonly 'aria-label'?: string | undefined; readonly 'aria-labelledby': string };

export type IconButtonProps = ActionOptions &
  AccessibleName &
  Forbidden<'width' | 'iconLeft' | 'iconRight'> & {
    readonly icon: GlyphSource;
  } & (AnchorHost | (NativeHost & { readonly children?: never }));
