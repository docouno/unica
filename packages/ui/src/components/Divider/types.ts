import type { AriaAttributes, ComponentPropsWithRef } from 'react';
import type { ORIENTATION, TEXT_ALIGN } from '../../consts.js';
import type { DataAttributeValue } from '../../core/passiveRoot.js';
import type { ExactAxisSubset } from '../../types.js';
import type { DIVIDER_LABEL_POSITION } from './consts.js';

export type DividerOrientation = (typeof ORIENTATION)[keyof typeof ORIENTATION];

export type DividerLabelPosition = ExactAxisSubset<
  typeof TEXT_ALIGN,
  typeof DIVIDER_LABEL_POSITION
>[keyof typeof DIVIDER_LABEL_POSITION];

type NameKey = 'aria-label' | 'aria-labelledby';
type RootElementProps = ComponentPropsWithRef<'div'>;
type PassiveKey = 'className' | 'dir' | 'hidden' | 'id' | 'lang' | 'ref' | 'style';

type DividerRootProps = Readonly<Pick<RootElementProps, PassiveKey>> & {
  readonly [key: `data-${string}`]: DataAttributeValue;
} & {
  readonly [Key in Exclude<keyof RootElementProps, PassiveKey | NameKey | 'key'>]?: never;
};

type SeparatorName = Readonly<Pick<AriaAttributes, NameKey>>;
type NoSeparatorName = { readonly [Key in NameKey]?: never };

type PlainDivider = {
  readonly orientation?: DividerOrientation | undefined;
  readonly label?: never;
  readonly labelPosition?: never;
} & (
  | ({ readonly decorative: false } & SeparatorName)
  | ({ readonly decorative?: boolean | undefined } & NoSeparatorName)
);

type LabeledDivider = {
  readonly orientation?: 'horizontal' | undefined;
  readonly label: string;
  readonly labelPosition?: DividerLabelPosition | undefined;
  readonly decorative?: never;
} & NoSeparatorName;

export type DividerProps = DividerRootProps & (PlainDivider | LabeledDivider);
